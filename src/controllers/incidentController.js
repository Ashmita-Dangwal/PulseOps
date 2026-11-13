import mongoose from "mongoose";
import Incident from "../models/Incident.js";
import Monitor from "../models/Monitor.js";

const ownerId = (req) => req.user?.id || req.user?._id || null;
const ownerFilter = (req) => ownerId(req) ? { userId: ownerId(req) } : {};

export const getIncidents = async (req, res, next) => {
  try {
    const filter = { ...ownerFilter(req) };
    if (req.query.monitorId) {
      if (!mongoose.isValidObjectId(req.query.monitorId)) return res.status(400).json({ success: false, message: "Invalid monitor ID" });
      const monitor = await Monitor.findOne({ _id: req.query.monitorId, ...ownerFilter(req) }).select("_id");
      if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });
      filter.monitorId = monitor._id;
    }
    if (req.query.status) {
      if (!["OPEN", "RESOLVED"].includes(req.query.status)) return res.status(400).json({ success: false, message: "Status must be OPEN or RESOLVED" });
      filter.status = req.query.status;
    }
    const incidents = await Incident.find(filter).sort({ startedAt: -1 }).lean();
    return res.status(200).json({ success: true, count: incidents.length, data: incidents });
  } catch (error) { return next(error); }
};
