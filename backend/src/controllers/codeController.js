import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import { ENV } from "../lib/env.js";

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54
};

export async function runCode(req, res) {
  try {
    const { code, language, problemId, runType } = req.body;
    const candidateId = req.auth?.userId;

    if (!code || !language || !problemId || !runType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const langId = LANGUAGE_IDS[language] || 63;

    // 1. Fetch problem
    const problem = await Problem.findOne({ id: problemId }).lean();
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // 2. Filter test cases
    let testCasesToRun = problem.testCases;
    if (runType === "run") {
      testCasesToRun = problem.testCases.filter((tc) => !tc.isHidden);
    }

    if (testCasesToRun.length === 0) {
      return res.status(400).json({ message: "No test cases found to run" });
    }

    let totalPassed = 0;

    // 3. For each test case, call Judge0 concurrently
    const fetchPromises = testCasesToRun.map(async (tc, index) => {
      try {
        const judge0Url = (ENV.JUDGE0_API_URL || "https://ce.judge0.com").trim();
        const response = await fetch(judge0Url + "/submissions?wait=true", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_code: code,
            language_id: langId,
            stdin: tc.input,
            expected_output: tc.expectedOutput
          })
        });

        if (!response.ok) {
          throw new Error("Judge0 API Error: " + response.statusText);
        }

        const data = await response.json();

        let statusName = "Error";
        let passed = false;

        if (data.status?.id === 3) {
          statusName = "Accepted";
          passed = true;
        } else if (data.status?.id === 4) {
          statusName = "Wrong Answer";
        } else if (data.status?.id === 5) {
          statusName = "TLE";
        } else if (data.status?.id === 6) {
          statusName = "Compilation Error";
        } else {
          statusName = data.status?.description || "Runtime Error";
        }

        if (passed) totalPassed++;

        const execTime = data.time ? (data.time + "s") : "0.000s";

        return {
          testCaseIndex: index,
          input: tc.isHidden ? undefined : tc.input,
          expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
          actualOutput: (data.stdout || data.stderr || data.compile_output || "").trim(),
          passed,
          status: statusName,
          executionTime: execTime,
          isHidden: tc.isHidden
        };
      } catch (err) {
        return {
          testCaseIndex: index,
          input: tc.isHidden ? undefined : tc.input,
          expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
          actualOutput: err.message,
          passed: false,
          status: "Error",
          executionTime: "0.000s",
          isHidden: tc.isHidden
        };
      }
    });

    const evaluatedResults = await Promise.all(fetchPromises);
    evaluatedResults.sort((a, b) => a.testCaseIndex - b.testCaseIndex);

    // 4. Save submission to MongoDB when runType === 'submit'
    if (runType === "submit" && candidateId) {
      await Submission.create({
        candidateId,
        problemId,
        code,
        language,
        results: evaluatedResults,
        totalPassed,
        total: testCasesToRun.length,
        submittedAt: new Date()
      });
    }

    res.status(200).json({
      results: evaluatedResults,
      totalPassed,
      total: testCasesToRun.length,
      runType
    });

  } catch (error) {
    console.error("Error running code via Judge0:", error);
    res.status(500).json({ message: "Internal server error during code execution" });
  }
}
