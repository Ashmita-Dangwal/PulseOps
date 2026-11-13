import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: "", maxlength: 500 },
  // Optional until the authentication teammate wires req.user into the routes.
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true }
}, { timestamps: true });

projectSchema.index({ userId: 1, createdAt: -1 });
export default mongoose.models.Project || mongoose.model("Project", projectSchema);
