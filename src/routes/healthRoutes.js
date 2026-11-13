import express from "express";

const router = express.Router();
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API health
 *     description: Returns the current health status of the PulseOps backend.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Backend is healthy
 */

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PulseOps API is healthy",
    timestamp: new Date()
  });
});

export default router;