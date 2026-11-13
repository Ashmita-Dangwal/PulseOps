
import { performHealthCheck } from "./healthCheckService.js";
import { evaluateCheckResult } from "./incidentService.js";

export const processHealthCheck = async (monitor, monitorState) => {
  if (!monitor || !monitor.monitorId || !monitor.url) {
    throw new Error("Valid monitor details are required");
  }

  // Use supplied latest state, or fallback values for initial testing.
  const currentState = {
    consecutiveFailures:
      monitorState?.consecutiveFailures ??
      monitor.consecutiveFailures ??
      0,

    hasOpenIncident:
      monitorState?.hasOpenIncident ??
      monitor.hasOpenIncident ??
      false
  };

  if (
    !Number.isInteger(currentState.consecutiveFailures) ||
    currentState.consecutiveFailures < 0
  ) {
    throw new Error("Invalid consecutive failure count");
  }

  // Step 1: Perform health check
  const result = await performHealthCheck(monitor);

  // Step 2: Prepare current monitor state
  const currentMonitor = {
    ...monitor,
    consecutiveFailures: currentState.consecutiveFailures
  };

  // Step 3: Evaluate incident decision
  const decision = evaluateCheckResult(
    currentMonitor,
    result,
    currentState.hasOpenIncident
  );

  // Step 4: Return result and decision
  return {
    result,
    decision
  };
};
