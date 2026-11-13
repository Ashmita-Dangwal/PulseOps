
export const evaluateCheckResult = (monitor, result, hasOpenIncident = false) => {
  const currentFailures = monitor.consecutiveFailures || 0;

  // Successful health check
  if (result.success) {
    return {
      monitorUpdates: {
        status: "UP",
        consecutiveFailures: 0,
        lastCheckedAt: result.checkedAt,
        lastResponseTime: result.responseTime
      },
      incidentAction: hasOpenIncident ? "RESOLVE" : "NONE"
    };
  }

  // Failed health check
  const newFailureCount = currentFailures + 1;

  let incidentAction = "NONE";

  if (newFailureCount >= 3) {
    incidentAction = hasOpenIncident ? "UPDATE" : "CREATE";
  }

  return {
    monitorUpdates: {
      status: "DOWN",
      consecutiveFailures: newFailureCount,
      lastCheckedAt: result.checkedAt,
      lastResponseTime: result.responseTime
    },
    incidentAction,
    incidentData: {
      monitorId: result.monitorId,
      reason: result.errorMessage || "Health check failed",
      failureCount: newFailureCount,
      status: "OPEN"
    }
  };
};
