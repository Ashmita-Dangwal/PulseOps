import mongoose from "mongoose";
import { z } from "zod";
import Monitor from "../models/Monitor.js";
import Project from "../models/Project.js";
import CheckResult from "../models/CheckResult.js";
import Incident from "../models/Incident.js";
import {
  scheduleMonitor,
  pauseMonitorSchedule,
  resumeMonitorSchedule,
  removeMonitorSchedule
} from "../services/monitorScheduler.js";

const monitorFields = {
  name: z.string().trim().min(1).max(100),
  url: z.string().trim().url().refine((value) => {
    try { const parsed = new URL(value); return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password; }
    catch { return false; }
  }, "URL must use HTTP or HTTPS and cannot contain credentials"),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  interval: z.number().int().min(30),
  timeout: z.number().int().min(1000).max(30000),
  expectedStatus: z.number().int().min(100).max(599),
  projectId: z.string().trim().min(1)
};
const monitorSchema = z.object({
  ...monitorFields,
  method: monitorFields.method.default("GET"),
  interval: monitorFields.interval.default(60),
  timeout: monitorFields.timeout.default(5000),
  expectedStatus: monitorFields.expectedStatus.default(200)
}).strict();
const updateMonitorSchema = z.object(monitorFields).partial().strict()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required for an update");
const isValidId = (id) => mongoose.isValidObjectId(id);
const ownerId = (req) => req.user?.id || req.user?._id || null;
const ownerFilter = (req) => ownerId(req) ? { userId: ownerId(req) } : {};
const asSchedulerData = (monitor) => ({
  monitorId: monitor._id.toString(),
  name: monitor.name,
  projectId: monitor.projectId.toString(),
  url: monitor.url,
  method: monitor.method,
  interval: monitor.interval,
  timeout: monitor.timeout,
  expectedStatus: monitor.expectedStatus,
  consecutiveFailures: monitor.consecutiveFailures,
  hasOpenIncident: monitor.hasOpenIncident
});

export const createMonitor = async (req, res, next) => {
  let created;
  try {
    const parsed = monitorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid monitor details", errors: parsed.error.issues });
    if (!isValidId(parsed.data.projectId)) return res.status(400).json({ success: false, message: "Invalid project ID" });
    const project = await Project.findOne({ _id: parsed.data.projectId, ...ownerFilter(req) });
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    created = await Monitor.create({ ...parsed.data, projectId: project._id, userId: ownerId(req) });
    try {
      await scheduleMonitor(asSchedulerData(created));
    } catch (error) {
      await created.deleteOne();
      throw error;
    }
    return res.status(201).json({ success: true, message: "Monitor created and scheduled successfully", data: created });
  } catch (error) { return next(error); }
};

export const getMonitors = async (req, res, next) => {
  try {
    const filter = { ...ownerFilter(req) };
    if (req.query.projectId) {
      if (!isValidId(req.query.projectId)) return res.status(400).json({ success: false, message: "Invalid project ID" });
      filter.projectId = req.query.projectId;
    }
    const monitors = await Monitor.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, message: "Monitors retrieved successfully", count: monitors.length, data: monitors });
  } catch (error) { return next(error); }
};

export const getMonitorChecks = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid monitor ID" });
    const monitor = await Monitor.findOne({ _id: req.params.id, ...ownerFilter(req) }).select("_id");
    if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);
    const checks = await CheckResult.find({ monitorId: monitor._id }).sort({ checkedAt: -1 }).limit(limit).lean();
    return res.status(200).json({ success: true, count: checks.length, data: checks });
  } catch (error) { return next(error); }
};

export const getMonitorById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid monitor ID" });
    const monitor = await Monitor.findOne({ _id: req.params.id, ...ownerFilter(req) }).lean();
    if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });
    return res.status(200).json({ success: true, message: "Monitor retrieved successfully", data: monitor });
  } catch (error) { return next(error); }
};

export const updateMonitor = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid monitor ID" });
    const parsed = updateMonitorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid monitor details", errors: parsed.error.issues });
    if (parsed.data.projectId) {
      if (!isValidId(parsed.data.projectId)) return res.status(400).json({ success: false, message: "Invalid project ID" });
      const project = await Project.findOne({ _id: parsed.data.projectId, ...ownerFilter(req) });
      if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    }
    const monitor = await Monitor.findOneAndUpdate({ _id: req.params.id, ...ownerFilter(req) }, { $set: parsed.data }, { new: true, runValidators: true });
    if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });
    if (monitor.isActive) await scheduleMonitor(asSchedulerData(monitor));
    return res.status(200).json({ success: true, message: "Monitor updated successfully", data: monitor });
  } catch (error) { return next(error); }
};

export const deleteMonitor = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid monitor ID" });
    const monitor = await Monitor.findOne({ _id: req.params.id, ...ownerFilter(req) });
    if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });
    await removeMonitorSchedule(monitor._id.toString());
    await Promise.all([
      CheckResult.deleteMany({ monitorId: monitor._id }),
      Incident.deleteMany({ monitorId: monitor._id })
    ]);
    await monitor.deleteOne();
    return res.status(200).json({ success: true, message: "Monitor and associated history deleted", data: { id: req.params.id } });
  } catch (error) { return next(error); }
};

export const pauseMonitor = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid monitor ID" });
    const monitor = await Monitor.findOne({ _id: req.params.id, ...ownerFilter(req) });
    if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });
    await pauseMonitorSchedule(monitor._id.toString());
    monitor.isActive = false;
    monitor.status = "PAUSED";
    await monitor.save();
    return res.status(200).json({ success: true, message: "Monitor paused successfully", data: monitor });
  } catch (error) { return next(error); }
};

export const resumeMonitor = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid monitor ID" });
    const monitor = await Monitor.findOne({ _id: req.params.id, ...ownerFilter(req) });
    if (!monitor) return res.status(404).json({ success: false, message: "Monitor not found" });
    monitor.isActive = true;
    monitor.status = "UNKNOWN";
    await monitor.save();
    await resumeMonitorSchedule(asSchedulerData(monitor));
    return res.status(200).json({ success: true, message: "Monitor resumed successfully", data: monitor });
  } catch (error) { return next(error); }
};
