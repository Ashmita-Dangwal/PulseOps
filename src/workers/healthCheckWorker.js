
import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import { processHealthCheck } from "../services/healthCheckProcessor.js";
import logger from "../utils/logger.js";

const healthCheckWorker = new Worker(
  "health-checks",
  async (job) => {
    const monitor = job.data;

    if (!monitor || !monitor.monitorId || !monitor.url) {
      throw new Error("Invalid health-check job data");
    }

    logger.info("Starting health check", {
      jobId: job.id,
      monitorId: monitor.monitorId
    });

    const { result, decision } = await processHealthCheck(monitor);

    logger.info("Health check completed", {
      jobId: job.id,
      monitorId: monitor.monitorId,
      success: result.success,
      incidentAction: decision.incidentAction
    });

    return {
      result,
      decision
    };
  },
  {
    connection: redisConnection
  }
);

healthCheckWorker.on("completed", (job) => {
  logger.info("Health-check job completed", {
    jobId: job.id
  });
});

healthCheckWorker.on("failed", (job, error) => {
  logger.error("Health-check job failed", {
    jobId: job?.id,
    error: error.message
  });
});

healthCheckWorker.on("error", (error) => {
  logger.error("BullMQ worker error", {
    error: error.message
  });
});

export default healthCheckWorker;
