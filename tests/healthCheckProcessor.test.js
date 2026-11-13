
import { jest } from "@jest/globals";

const mockPerformHealthCheck = jest.fn();
const mockEvaluateCheckResult = jest.fn();

jest.unstable_mockModule(
  "../src/services/healthCheckService.js",
  () => ({
    performHealthCheck: mockPerformHealthCheck
  })
);

jest.unstable_mockModule(
  "../src/services/incidentService.js",
  () => ({
    evaluateCheckResult: mockEvaluateCheckResult
  })
);

const { processHealthCheck } = await import(
  "../src/services/healthCheckProcessor.js"
);

describe("Health Check Processor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Should perform health check and evaluate result", async () => {
    const monitor = {
      monitorId: "monitor-123",
      url: "https://example.com",
      consecutiveFailures: 0
    };

    const result = {
      monitorId: "monitor-123",
      success: true,
      statusCode: 200,
      responseTime: 100
    };

    const decision = {
      incidentAction: "NONE"
    };

    mockPerformHealthCheck.mockResolvedValue(result);
    mockEvaluateCheckResult.mockReturnValue(decision);

    const output = await processHealthCheck(monitor);

    expect(mockPerformHealthCheck).toHaveBeenCalledWith(monitor);

    expect(mockEvaluateCheckResult).toHaveBeenCalledWith(
      monitor,
      result,
      false
    );

    expect(output).toEqual({
      result,
      decision
    });
  });
});
