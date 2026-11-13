import mongoose from "mongoose";

const checkResultSchema = new mongoose.Schema({
  monitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Monitor", required: true },
  success: { type: Boolean, required: true, index: true },
  statusCode: { type: Number, default: null },
  responseTime: { type: Number, min: 0, default: null },
  errorType: { type: String, default: null },
  errorMessage: { type: String, default: null },
  checkedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

checkResultSchema.index({ monitorId: 1, checkedAt: -1 });
export default mongoose.models.CheckResult || mongoose.model("CheckResult", checkResultSchema);
