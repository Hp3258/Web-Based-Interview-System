import mongoose from "mongoose";

const TestCaseSchema = new mongoose.Schema({
  input: String,
  expectedOutput: String,
  isHidden: { type: Boolean, default: false }
});

const ProblemSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  title: String,
  description: String,
  difficulty: String,
  category: String,
  testCases: [TestCaseSchema],
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [String],
  starterCode: {
    javascript: String,
    python: String,
    java: String,
    cpp: String
  }
});

const Problem = mongoose.model("Problem", ProblemSchema);
export default Problem;
