
import healthCheckQueue from "../queues/healthCheckQueue.js";
import logger from "../utils/logger.js";

// Register or update a monitor's recurring schedule
export const scheduleMonitor = async (monitor) => {
  if (!monitor || !monitor.monitorId || !monitor.url) {
    throw new Error("Monitor ID and URL are required");
  }

  const interval = monitor.interval ?? 60;
  const timeout = monitor.timeout ?? 5000;
  const method = monitor.method ?? "GET";
  const expectedStatus = monitor.expectedStatus ?? 200;

  if (!Number.isInteger(interval) || interval < 30) {
    throw new Error("Monitor interval must be at least 30 seconds");
  }

  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 30000) {
    throw new Error("Monitor timeout must be between 1000 and 30000 milliseconds");
  }

  if (!["GET", "POST", "PUT", "DELETE"].includes(method)) {
    throw new Error("Unsupported HTTP method");
  }

  if (!Number.isInteger(expectedStatus) || expectedStatus < 100 || expectedStatus > 599) {
    throw new Error("Expected status must be between 100 and 599");
  }

  const schedulerId = `monitor-${monitor.monitorId}`;

  await healthCheckQueue.upsertJobScheduler(
    schedulerId,
    {
      every: interval * 1000
    },
    {
      name: "scheduled-health-check",
      data: {
        monitorId: monitor.monitorId,
        url: monitor.url,
        method,
        timeout,
        expectedStatus
      }
    }
  );

  logger.info("Monitor scheduled successfully", {
    monitorId: monitor.monitorId,
    interval
  });
};

// Pause a monitor's recurring schedule
export const pauseMonitorSchedule = async (monitorId) => {
  if (!monitorId) {
    throw new Error("Monitor ID is required");
  }

  await healthCheckQueue.removeJobScheduler(`monitor-${monitorId}`);

  logger.info("Monitor schedule paused", { monitorId });
};

// Resume a monitor's recurring schedule
export const resumeMonitorSchedule = async (monitor) => {
  return scheduleMonitor(monitor);
};

// Remove a monitor's recurring schedule
export const removeMonitorSchedule = async (monitorId) => {
  if (!monitorId) {
    throw new Error("Monitor ID is required");
  }

  await healthCheckQueue.removeJobScheduler(`monitor-${monitorId}`);

  logger.info("Monitor schedule removed", { monitorId });
};
