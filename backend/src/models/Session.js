 import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    problem: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    code: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "javascript",
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    uniqueToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    candidateEmail: {
      type: String,
    },
    candidateName: {
      type: String,
    },
    status: {
      type: String,
      enum: ["invited", "waiting_approval", "active", "completed"],
      default: "invited",
    },
    // stream video call ID
    callId: {
      type: String,
      default: "",
    },
    // proctoring: track candidate violations (tab switch, fullscreen exit)
    violations: [
      {
        type: {
          type: String,
          enum: ["fullscreen_exit", "tab_switch", "phone_detected", "person_away", "looking_away", "multiple_persons", "external_webcam", "suspicious_object"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        description: String,
      },
    ],
    // interview transcript: array of sentences spoken during the session
    transcript: [
      {
        speaker: {
          type: String, // 'candidate' or 'host'
        },
        text: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      }
    ],
  },
  { timestamps: true }
);

sessionSchema.index({ _id: 1 });
sessionSchema.index({ uniqueToken: 1 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;