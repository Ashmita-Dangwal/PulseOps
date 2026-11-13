
import { Router } from "express";
import { getAnalytics } from "../controllers/analyticsController.js";

const router = Router();

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get monitoring analytics
 *     description: Retrieves monitoring statistics including total checks, successful checks, failed checks, uptime percentage and average response time.
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/", getAnalytics);

export default router;
