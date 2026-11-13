import mongoose from "mongoose";

const monitorSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  url: { type: String, required: true, trim: true },
  method: { type: String, enum: ["GET", "POST", "PUT", "DELETE"], default: "GET" },
  interval: { type: Number, min: 30, default: 60 },
  timeout: { type: Number, min: 1000, max: 30000, default: 5000 },
  expectedStatus: { type: Number, min: 100, max: 599, default: 200 },
  status: { type: String, enum: ["UP", "DOWN", "PAUSED", "UNKNOWN"], default: "UNKNOWN", index: true },
  isActive: { type: Boolean, default: true, index: true },
  consecutiveFailures: { type: Number, min: 0, default: 0 },
  hasOpenIncident: { type: Boolean, default: false },
  lastCheckedAt: { type: Date, default: null },
  lastResponseTime: { type: Number, default: null }
}, { timestamps: true });

monitorSchema.index({ projectId: 1, createdAt: -1 });
monitorSchema.index({ isActive: 1, status: 1 });
export default mongoose.models.Monitor || mongoose.model("Monitor", monitorSchema);
