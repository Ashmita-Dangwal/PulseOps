import mongoose from "mongoose";
import { calculateAnalytics } from "../services/analyticsService.js";
import CheckResult from "../models/CheckResult.js";
import Monitor from "../models/Monitor.js";

export const getAnalytics = async (req, res, next) => {
  try {
    const filter = {};
    const actorId = req.user?.id || req.user?._id || null;
    if (req.query.monitorId) {
      if (!mongoose.isValidObjectId(req.query.monitorId)) return res.status(400).json({ success: false, message: "Invalid monitor ID" });
      const monitor = await Monitor.findOne({ _id: req.query.monitorId, ...(actorId ? { userId: actorId } : {}) }).select("_id");
      if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });
      filter.monitorId = monitor._id;
    } else if (req.query.projectId) {
      if (!mongoose.isValidObjectId(req.query.projectId)) return res.status(400).json({ success: false, message: "Invalid project ID" });
      const monitorIds = await Monitor.find({ projectId: req.query.projectId, ...(actorId ? { userId: actorId } : {}) }).distinct("_id");
      filter.monitorId = { $in: monitorIds };
    } else if (actorId) {
      const monitorIds = await Monitor.find({ userId: actorId }).distinct("_id");
      filter.monitorId = { $in: monitorIds };
    }
    if (req.query.from || req.query.to) {
      filter.checkedAt = {};
      if (req.query.from) {
        const from = new Date(req.query.from);
        if (Number.isNaN(from.getTime())) return res.status(400).json({ success: false, message: "Invalid from date" });
        filter.checkedAt.$gte = from;
      }
      if (req.query.to) {
        const to = new Date(req.query.to);
        if (Number.isNaN(to.getTime())) return res.status(400).json({ success: false, message: "Invalid to date" });
        filter.checkedAt.$lte = to;
      }
    }
    const checkResults = await CheckResult.find(filter).sort({ checkedAt: -1 }).lean();
    const analytics = calculateAnalytics(checkResults);
    return res.status(200).json({ success: true, message: "Analytics retrieved successfully", data: analytics });
  } catch (error) { return next(error); }
};
