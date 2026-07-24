import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema({
  testCaseIndex: Number,
  input: String,
  expectedOutput: String,
  actualOutput: String,
  passed: Boolean,
  status: String,
  executionTime: String,
  isHidden: Boolean
});

const SubmissionSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  problemId: {
    type: String,
    required: true
  },
  code: String,
  language: String,
  results: [ResultSchema],
  totalPassed: Number,
  total: Number,
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const Submission = mongoose.model("Submission", SubmissionSchema);
export default Submission;
