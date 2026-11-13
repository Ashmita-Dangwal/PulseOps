
import { z } from "zod";

import {
  scheduleMonitor,
  pauseMonitorSchedule,
  removeMonitorSchedule
} from "../services/monitorScheduler.js";

// Reusable validation rules
const monitorFields = {
  name: z.string().trim()
    .min(1, "Monitor name is required")
    .max(100, "Monitor name cannot exceed 100 characters"),

  url: z.string().trim()
    .url("Enter a valid URL")
    .refine((value) => {
      try {
        const parsedUrl = new URL(value);

        return (
          ["http:", "https:"].includes(parsedUrl.protocol) &&
          !parsedUrl.username &&
          !parsedUrl.password
        );
      } catch {
        return false;
      }
    }, "URL must use HTTP or HTTPS and cannot contain credentials"),

  method: z.enum(["GET", "POST", "PUT", "DELETE"]),

  interval: z.number().int()
    .min(30, "Monitor interval must be at least 30 seconds"),

  timeout: z.number().int()
    .min(1000, "Timeout must be at least 1000 milliseconds")
    .max(30000, "Timeout cannot exceed 30000 milliseconds"),

  expectedStatus: z.number().int()
    .min(100, "Expected status must be at least 100")
    .max(599, "Expected status cannot exceed 599"),

  projectId: z.string().trim()
    .min(1, "Project ID is required")
};

const monitorSchema = z.object({
  ...monitorFields,
  method: monitorFields.method.default("GET"),
  interval: monitorFields.interval.default(60),
  timeout: monitorFields.timeout.default(5000),
  expectedStatus: monitorFields.expectedStatus.default(200)
}).strict();

const updateMonitorSchema = z.object({
  ...monitorFields
}).partial().strict().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required for an update"
);

const monitorIdSchema = z.string().trim()
  .min(1, "Monitor ID is required");

const validateMonitorId = (req, res) => {
  const validatedId = monitorIdSchema.safeParse(req.params.id);

  if (!validatedId.success) {
    res.status(400).json({
      success: false,
      message: "Invalid monitor ID",
      errors: validatedId.error.issues
    });

    return null;
  }

  return validatedId.data;
};

// Create monitor and schedule recurring health checks
export const createMonitor = async (req, res, next) => {
  try {
    const validatedData = monitorSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid monitor details",
        errors: validatedData.error.issues
      });
    }

    // Temporary ID until MongoDB creates the actual monitor ID
    const monitorId = `monitor-${Date.now()}`;

    const monitor = {
      monitorId,
      ...validatedData.data
    };

    await scheduleMonitor(monitor);

    return res.status(201).json({
      success: true,
      message: "Monitor created and scheduled successfully",
      data: monitor
    });
  } catch (error) {
    return next(error);
  }
};

// Get all monitors
export const getMonitors = async (req, res, next) => {
  try {
    const monitors = [];

    return res.status(200).json({
      success: true,
      message: "Monitors retrieved successfully",
      count: monitors.length,
      data: monitors
    });
  } catch (error) {
    return next(error);
  }
};

// Get monitor by ID
export const getMonitorById = async (req, res, next) => {
  try {
    const monitorId = validateMonitorId(req, res);
    if (!monitorId) return;

    return res.status(200).json({
      success: true,
      message: "Monitor ID received successfully",
      data: { id: monitorId }
    });
  } catch (error) {
    return next(error);
  }
};

// Update monitor
export const updateMonitor = async (req, res, next) => {
  try {
    const monitorId = validateMonitorId(req, res);
    if (!monitorId) return;

    const validatedData = updateMonitorSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid monitor details",
        errors: validatedData.error.issues
      });
    }

    return res.status(200).json({
      success: true,
      message: "Monitor details validated for update",
      data: {
        id: monitorId,
        ...validatedData.data
      }
    });
  } catch (error) {
    return next(error);
  }
};

// Delete monitor and remove its recurring schedule
export const deleteMonitor = async (req, res, next) => {
  try {
    const monitorId = validateMonitorId(req, res);
    if (!monitorId) return;

    await removeMonitorSchedule(monitorId);

    return res.status(200).json({
      success: true,
      message: "Monitor schedule removed successfully",
      data: { id: monitorId }
    });
  } catch (error) {
    return next(error);
  }
};

// Pause monitor
export const pauseMonitor = async (req, res, next) => {
  try {
    const monitorId = validateMonitorId(req, res);
    if (!monitorId) return;

    await pauseMonitorSchedule(monitorId);

    return res.status(200).json({
      success: true,
      message: "Monitor paused successfully",
      data: {
        id: monitorId,
        status: "PAUSED"
      }
    });
  } catch (error) {
    return next(error);
  }
};

// Resume monitor
export const resumeMonitor = async (req, res, next) => {
  try {
    const monitorId = validateMonitorId(req, res);
    if (!monitorId) return;

    return res.status(501).json({
      success: false,
      message: "Resume requires retrieving the monitor configuration from the database",
      data: { id: monitorId }
    });
  } catch (error) {
    return next(error);
  }
};
