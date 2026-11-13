import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import { processHealthCheck } from "../services/healthCheckProcessor.js";
import { persistIncidentDecision } from "../services/incidentPersistenceService.js";
import Monitor from "../models/Monitor.js";
import CheckResult from "../models/CheckResult.js";
import logger from "../utils/logger.js";
import { emitToUser } from "../sockets/socket.js";
import Incident from "../models/Incident.js";

const healthCheckWorker = new Worker(
  "health-checks",
  async (job) => {
    const queued = job.data;
    if (!queued?.monitorId) throw new Error("Invalid health-check job data: monitorId is required");

    // Always load current persisted configuration/state; queued payloads may be stale.
    const storedMonitor = await Monitor.findById(queued.monitorId);
    if (!storedMonitor) {
      logger.warn("Skipping health check because monitor no longer exists", { monitorId: queued.monitorId });
      return { skipped: true, reason: "MONITOR_NOT_FOUND" };
    }
    if (!storedMonitor.isActive) return { skipped: true, reason: "MONITOR_INACTIVE" };

    const monitor = {
      ...storedMonitor.toObject(),
      monitorId: storedMonitor._id.toString()
    };
    logger.info("Starting health check", { jobId: job.id, monitorId: monitor.monitorId });

    const { result, decision } = await processHealthCheck(monitor, {
      consecutiveFailures: storedMonitor.consecutiveFailures,
      hasOpenIncident: storedMonitor.hasOpenIncident
    });

    await CheckResult.create({
      monitorId: storedMonitor._id,
      success: result.success,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      errorType: result.errorType,
      errorMessage: result.errorMessage,
      checkedAt: result.checkedAt || new Date()
    });
    await persistIncidentDecision(storedMonitor, decision);
    emitToUser(storedMonitor.userId?.toString(), "monitor:status", {
      monitorId: storedMonitor._id.toString(), name: storedMonitor.name,
      status: decision.monitorUpdates.status, success: result.success,
      responseTime: result.responseTime, checkedAt: result.checkedAt
    });
    if (decision.incidentAction === "CREATE") {
      const incident = await Incident.findOne({ monitorId: storedMonitor._id, status: "OPEN" }).lean();
      emitToUser(storedMonitor.userId?.toString(), "incident:created", incident);
    } else if (decision.incidentAction === "RESOLVE") {
      const incident = await Incident.findOne({ monitorId: storedMonitor._id }).sort({ updatedAt: -1 }).lean();
      emitToUser(storedMonitor.userId?.toString(), "incident:resolved", incident);
    }

    logger.info("Health check persisted", {
      jobId: job.id,
      monitorId: monitor.monitorId,
      success: result.success,
      incidentAction: decision.incidentAction
    });
    return { result, decision };
  },
  { connection: redisConnection }
);

healthCheckWorker.on("completed", (job) => logger.info("Health-check job completed", { jobId: job.id }));
healthCheckWorker.on("failed", (job, error) => logger.error("Health-check job failed", { jobId: job?.id, error: error.message }));
healthCheckWorker.on("error", (error) => logger.error("BullMQ worker error", { error: error.message }));
export default healthCheckWorker;
