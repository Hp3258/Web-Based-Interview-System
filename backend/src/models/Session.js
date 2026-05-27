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
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
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
          enum: ["fullscreen_exit", "tab_switch"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        description: String,
      },
    ],
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;