import mongoose from "mongoose";
import { z } from "zod";
import Project from "../models/Project.js";
import Monitor from "../models/Monitor.js";
import CheckResult from "../models/CheckResult.js";
import Incident from "../models/Incident.js";
import { removeMonitorSchedule } from "../services/monitorScheduler.js";

const projectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().default("")
}).strict();
const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional()
}).strict().refine((data) => Object.keys(data).length > 0, "At least one field is required for an update");
const isValidId = (id) => mongoose.isValidObjectId(id);
const ownerId = (req) => req.user?.id || req.user?._id || null;
const ownerFilter = (req) => ownerId(req) ? { userId: ownerId(req) } : {};

export const createProject = async (req, res, next) => {
  try {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid project details", errors: parsed.error.issues });
    const project = await Project.create({ ...parsed.data, userId: ownerId(req) });
    return res.status(201).json({ success: true, message: "Project created successfully", data: project });
  } catch (error) { return next(error); }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find(ownerFilter(req)).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, message: "Projects retrieved successfully", count: projects.length, data: projects });
  } catch (error) { return next(error); }
};

export const getProjectById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid project ID" });
    const project = await Project.findOne({ _id: req.params.id, ...ownerFilter(req) }).lean();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    return res.status(200).json({ success: true, message: "Project retrieved successfully", data: project });
  } catch (error) { return next(error); }
};

export const updateProject = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid project ID" });
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid project details", errors: parsed.error.issues });
    const project = await Project.findOneAndUpdate({ _id: req.params.id, ...ownerFilter(req) }, { $set: parsed.data }, { new: true, runValidators: true });
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    return res.status(200).json({ success: true, message: "Project updated successfully", data: project });
  } catch (error) { return next(error); }
};

export const deleteProject = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid project ID" });
    const project = await Project.findOne({ _id: req.params.id, ...ownerFilter(req) });
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    const monitors = await Monitor.find({ projectId: project._id }).select("_id");
    const monitorIds = monitors.map((monitor) => monitor._id);
    await Promise.all(monitorIds.map((id) => removeMonitorSchedule(id.toString())));
    await Promise.all([
      CheckResult.deleteMany({ monitorId: { $in: monitorIds } }),
      Incident.deleteMany({ monitorId: { $in: monitorIds } }),
      Monitor.deleteMany({ projectId: project._id })
    ]);
    await project.deleteOne();
    return res.status(200).json({ success: true, message: "Project and associated monitoring data deleted", data: { id: req.params.id, deletedMonitors: monitorIds.length } });
  } catch (error) { return next(error); }
};
