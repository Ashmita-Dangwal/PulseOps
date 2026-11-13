
import { evaluateCheckResult } from "../src/services/incidentService.js";

describe("Incident Service", () => {
  const monitor = {
    monitorId: "test-monitor-001",
    consecutiveFailures: 0
  };

  const failedResult = {
    monitorId: "test-monitor-001",
    success: false,
    responseTime: 5000,
    errorMessage: "Request timed out",
    checkedAt: new Date()
  };

  const successfulResult = {
    ...failedResult,
    success: true,
    responseTime: 100,
    errorMessage: null
  };

  test("First failure should not create an incident", () => {
    const result = evaluateCheckResult(monitor, failedResult);

    expect(result.monitorUpdates.consecutiveFailures).toBe(1);
    expect(result.incidentAction).toBe("NONE");
  });

  test("Second failure should not create an incident", () => {
    const result = evaluateCheckResult(
      { ...monitor, consecutiveFailures: 1 },
      failedResult
    );

    expect(result.monitorUpdates.consecutiveFailures).toBe(2);
    expect(result.incidentAction).toBe("NONE");
  });

  test("Third failure should create an incident", () => {
    const result = evaluateCheckResult(
      { ...monitor, consecutiveFailures: 2 },
      failedResult
    );

    expect(result.monitorUpdates.consecutiveFailures).toBe(3);
    expect(result.incidentAction).toBe("CREATE");
  });

  test("Successful recovery should resolve an open incident", () => {
    const result = evaluateCheckResult(
      { ...monitor, consecutiveFailures: 3 },
      successfulResult,
      true
    );

    expect(result.monitorUpdates.status).toBe("UP");
    expect(result.monitorUpdates.consecutiveFailures).toBe(0);
    expect(result.incidentAction).toBe("RESOLVE");
  });

  // Additional edge-case tests

  test("Further failures should update an existing incident", () => {
    const result = evaluateCheckResult(
      { ...monitor, consecutiveFailures: 3 },
      failedResult,
      true
    );

    expect(result.monitorUpdates.consecutiveFailures).toBe(4);
    expect(result.incidentAction).toBe("UPDATE");
  });

  test("Failure count should continue increasing after an incident is created", () => {
    const result = evaluateCheckResult(
      { ...monitor, consecutiveFailures: 5 },
      failedResult,
      true
    );

    expect(result.monitorUpdates.consecutiveFailures).toBe(6);
    expect(result.incidentAction).toBe("UPDATE");
  });

  test("Successful check without an open incident should not resolve an incident", () => {
    const result = evaluateCheckResult(
      { ...monitor, consecutiveFailures: 2 },
      successfulResult,
      false
    );

    expect(result.monitorUpdates.status).toBe("UP");
    expect(result.monitorUpdates.consecutiveFailures).toBe(0);
    expect(result.incidentAction).toBe("NONE");
  });

  test("Successful check should reset failure count after repeated failures", () => {
    const result = evaluateCheckResult(
      { ...monitor, consecutiveFailures: 5 },
      successfulResult,
      false
    );

    expect(result.monitorUpdates.consecutiveFailures).toBe(0);
    expect(result.monitorUpdates.status).toBe("UP");
  });
});
