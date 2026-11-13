
import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema({
  monitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Monitor",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
  },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  reason: { type: String, default: "" },
  status: {
    type: String,
    enum: ["OPEN", "RESOLVED"],
    default: "OPEN",
    index: true
  },
  startedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null },
  failureCount: { type: Number, default: 3 }
}, { timestamps: true });

// Prevent multiple OPEN incidents for the same monitor.
incidentSchema.index(
  { monitorId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "OPEN" }
  }
);

export default mongoose.models.Incident ||
  mongoose.model("Incident", incidentSchema);
