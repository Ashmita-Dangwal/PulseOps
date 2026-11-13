
import { z } from "zod";

// Validation rules for creating a project
const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(100, "Project name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default("")
}).strict();

// Validation rules for updating a project
const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name cannot be empty")
    .max(100, "Project name cannot exceed 100 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required for an update"
);

// Project ID validation
const projectIdSchema = z.string().trim().min(1, "Project ID is required");

// Create project
export const createProject = async (req, res, next) => {
  try {
    const validatedData = projectSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid project details",
        errors: validatedData.error.issues
      });
    }

    return res.status(201).json({
      success: true,
      message: "Project details validated successfully",
      data: validatedData.data
    });
  } catch (error) {
    return next(error);
  }
};

// Get all projects
export const getProjects = async (req, res, next) => {
  try {
    const projects = [];

    return res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      count: projects.length,
      data: projects
    });
  } catch (error) {
    return next(error);
  }
};

// Get project by ID
export const getProjectById = async (req, res, next) => {
  try {
    const validatedId = projectIdSchema.safeParse(req.params.id);

    if (!validatedId.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
        errors: validatedId.error.issues
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project ID received successfully",
      data: {
        id: validatedId.data
      }
    });
  } catch (error) {
    return next(error);
  }
};

// Update project
export const updateProject = async (req, res, next) => {
  try {
    const validatedId = projectIdSchema.safeParse(req.params.id);

    if (!validatedId.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
        errors: validatedId.error.issues
      });
    }

    const validatedData = updateProjectSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid project details",
        errors: validatedData.error.issues
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project details validated for update",
      data: {
        id: validatedId.data,
        ...validatedData.data
      }
    });
  } catch (error) {
    return next(error);
  }
};

// Delete project
export const deleteProject = async (req, res, next) => {
  try {
    const validatedId = projectIdSchema.safeParse(req.params.id);

    if (!validatedId.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
        errors: validatedId.error.issues
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deletion request received",
      data: {
        id: validatedId.data
      }
    });
  } catch (error) {
    return next(error);
  }
};
