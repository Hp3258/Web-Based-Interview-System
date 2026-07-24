import { CheckCircle2Icon, XCircleIcon, ClockIcon, TerminalIcon } from "lucide-react";
import { memo } from "react";

const TestResultsPanel = memo(function TestResultsPanel({
  results,
  totalPassed,
  total,
  runType,
  isCompiling
}) {
  if (isCompiling) {
    return (
      <div className="h-full bg-base-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-base-content/60">
          <TerminalIcon className="size-8 animate-pulse" />
          <p className="font-medium">Executing code...</p>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="h-full bg-base-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-base-content/40">
          <TerminalIcon className="size-8" />
          <p className="font-medium">Run your code to see test results</p>
        </div>
      </div>
    );
  }

  const isAllPassed = totalPassed === total;

  return (
    <div className="h-full bg-base-100 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="flex-none px-6 py-4 border-b border-base-300 bg-base-200">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          {runType === "submit" ? "Submission Results" : "Test Results"}
          <span className={`badge ${isAllPassed ? "badge-success" : "badge-error"} badge-sm font-medium`}>
            {totalPassed}/{total} passed {isAllPassed ? "✅" : "❌"}
          </span>
        </h3>
      </div>

      {/* RESULTS LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {results.map((res, idx) => (
          <div key={idx} className={`border rounded-lg p-4 ${res.passed ? 'border-success/30 bg-success/5' : 'border-error/30 bg-error/5'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-semibold flex items-center gap-2 ${res.passed ? 'text-success' : 'text-error'}`}>
                {res.passed ? <CheckCircle2Icon className="size-5" /> : <XCircleIcon className="size-5" />}
                Test Case {idx + 1} {res.isHidden && "(Hidden)"}
              </h4>
              <div className="flex items-center gap-2 text-xs opacity-70">
                <span className="badge badge-outline badge-sm">{res.status}</span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {res.executionTime}
                </span>
              </div>
            </div>

            {/* details */}
            {res.isHidden ? (
              <div className="text-sm opacity-60 italic px-2">
                Input and expected output are hidden.
              </div>
            ) : runType === "submit" && res.passed ? (
               <div className="text-sm opacity-60 italic px-2">
                 Accepted
               </div>
            ) : (
              <div className="space-y-3 font-mono text-sm">
                <div>
                  <span className="text-base-content/60 font-sans text-xs uppercase tracking-wider block mb-1">Input:</span>
                  <div className="bg-base-300 p-2 rounded break-all whitespace-pre-wrap">{res.input}</div>
                </div>
                <div>
                  <span className="text-base-content/60 font-sans text-xs uppercase tracking-wider block mb-1">Expected Output:</span>
                  <div className="bg-base-300 p-2 rounded break-all whitespace-pre-wrap">{res.expectedOutput}</div>
                </div>
                <div>
                  <span className="text-base-content/60 font-sans text-xs uppercase tracking-wider block mb-1">Actual Output:</span>
                  <div className={`p-2 rounded break-all whitespace-pre-wrap ${res.passed ? 'bg-base-300' : 'bg-error/20 text-error-content'}`}>
                    {res.actualOutput || "null"}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* FOOTER */}
      <div className={`flex-none px-6 py-4 border-t ${isAllPassed ? "bg-success/10 border-success/20 text-success" : "bg-error/10 border-error/20 text-error"}`}>
        <div className="font-bold flex items-center gap-2">
          {isAllPassed ? (
            <>
              {totalPassed}/{total} Test Cases Passed — Accepted <CheckCircle2Icon className="size-5" />
            </>
          ) : (
            <>
              {totalPassed}/{total} Test Cases Passed — Wrong Answer <XCircleIcon className="size-5" />
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default TestResultsPanel;
