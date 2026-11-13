
import { Router } from "express";

import {
  createMonitor,
  getMonitors,
  getMonitorById,
  getMonitorChecks,
  updateMonitor,
  deleteMonitor,
  pauseMonitor,
  resumeMonitor
} from "../controllers/monitorController.js";

const router = Router();

/**
 * @swagger
 * /api/monitors:
 *   get:
 *     summary: Get all monitors
 *     tags: [Monitors]
 *     responses:
 *       200:
 *         description: Monitors retrieved successfully
 */
router.get("/", getMonitors);

/**
 * @swagger
 * /api/monitors:
 *   post:
 *     summary: Create a new monitor
 *     tags: [Monitors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *               - projectId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Website Monitor
 *               url:
 *                 type: string
 *                 example: https://example.com
 *               method:
 *                 type: string
 *                 enum: [GET, POST, PUT, DELETE]
 *                 default: GET
 *               interval:
 *                 type: integer
 *                 example: 60
 *               timeout:
 *                 type: integer
 *                 example: 5000
 *               expectedStatus:
 *                 type: integer
 *                 example: 200
 *               projectId:
 *                 type: string
 *                 example: project-123
 *     responses:
 *       201:
 *         description: Monitor creation request successful
 *       400:
 *         description: Invalid monitor data
 */
router.post("/", createMonitor);

/**
 * @swagger
 * /api/monitors/{id}:
 *   get:
 *     summary: Get a monitor by ID
 *     tags: [Monitors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor retrieved successfully
 */
router.get("/:id/checks", getMonitorChecks);
router.get("/:id", getMonitorById);

/**
 * @swagger
 * /api/monitors/{id}:
 *   put:
 *     summary: Update a monitor
 *     tags: [Monitors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [GET, POST, PUT, DELETE]
 *               interval:
 *                 type: integer
 *               timeout:
 *                 type: integer
 *               expectedStatus:
 *                 type: integer
 *               projectId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Monitor update request successful
 *       400:
 *         description: Invalid monitor data
 */
router.put("/:id", updateMonitor);

/**
 * @swagger
 * /api/monitors/{id}:
 *   delete:
 *     summary: Delete a monitor
 *     tags: [Monitors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor deletion request successful
 */
router.delete("/:id", deleteMonitor);

/**
 * @swagger
 * /api/monitors/{id}/pause:
 *   patch:
 *     summary: Pause a monitor
 *     tags: [Monitors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor pause request successful
 */
router.patch("/:id/pause", pauseMonitor);

/**
 * @swagger
 * /api/monitors/{id}/resume:
 *   patch:
 *     summary: Resume a monitor
 *     tags: [Monitors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor resume request successful
 */
router.patch("/:id/resume", resumeMonitor);

export default router;
