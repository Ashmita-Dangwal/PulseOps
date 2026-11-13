
import { jest } from "@jest/globals";

const mockUpsertJobScheduler = jest.fn();
const mockRemoveJobScheduler = jest.fn();

jest.unstable_mockModule("../src/queues/healthCheckQueue.js", () => ({
  default: {
    upsertJobScheduler: mockUpsertJobScheduler,
    removeJobScheduler: mockRemoveJobScheduler
  }
}));

jest.unstable_mockModule("../src/utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

const {
  scheduleMonitor,
  pauseMonitorSchedule,
  resumeMonitorSchedule,
  removeMonitorSchedule
} = await import("../src/services/monitorScheduler.js");

describe("Monitor Scheduler", () => {
  const validMonitor = {
    monitorId: "monitor-123",
    url: "https://example.com",
    method: "GET",
    interval: 60,
    timeout: 5000,
    expectedStatus: 200
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpsertJobScheduler.mockResolvedValue({});
    mockRemoveJobScheduler.mockResolvedValue({});
  });

  test("schedules a valid monitor", async () => {
    await scheduleMonitor(validMonitor);

    expect(mockUpsertJobScheduler).toHaveBeenCalledWith(
      "monitor-monitor-123",
      { every: 60000 },
      expect.objectContaining({
        name: "scheduled-health-check",
        data: expect.objectContaining({
          monitorId: "monitor-123",
          url: "https://example.com"
        })
      })
    );
  });

  test("uses default interval when omitted", async () => {
    const monitor = {
      ...validMonitor,
      interval: undefined
    };

    await scheduleMonitor(monitor);

    expect(mockUpsertJobScheduler).toHaveBeenCalledWith(
      "monitor-monitor-123",
      { every: 60000 },
      expect.any(Object)
    );
  });

  test("rejects missing monitor ID", async () => {
    await expect(
      scheduleMonitor({ ...validMonitor, monitorId: "" })
    ).rejects.toThrow("Monitor ID and URL are required");
  });

  test("rejects missing URL", async () => {
    await expect(
      scheduleMonitor({ ...validMonitor, url: "" })
    ).rejects.toThrow("Monitor ID and URL are required");
  });

  test("rejects intervals below 30 seconds", async () => {
    await expect(
      scheduleMonitor({ ...validMonitor, interval: 20 })
    ).rejects.toThrow("Monitor interval must be at least 30 seconds");
  });

  test("rejects non-integer intervals", async () => {
    await expect(
      scheduleMonitor({ ...validMonitor, interval: 30.5 })
    ).rejects.toThrow("Monitor interval must be at least 30 seconds");
  });

  test("rejects invalid timeout", async () => {
    await expect(
      scheduleMonitor({ ...validMonitor, timeout: 500 })
    ).rejects.toThrow("Monitor timeout must be between 1000 and 30000 milliseconds");
  });

  test("rejects unsupported HTTP methods", async () => {
    await expect(
      scheduleMonitor({ ...validMonitor, method: "PATCH" })
    ).rejects.toThrow("Unsupported HTTP method");
  });

  test("rejects invalid expected status", async () => {
    await expect(
      scheduleMonitor({ ...validMonitor, expectedStatus: 99 })
    ).rejects.toThrow("Expected status must be between 100 and 599");
  });

  test("pauses a monitor schedule", async () => {
    await pauseMonitorSchedule("monitor-123");

    expect(mockRemoveJobScheduler).toHaveBeenCalledWith(
      "monitor-monitor-123"
    );
  });

  test("removes a monitor schedule", async () => {
    await removeMonitorSchedule("monitor-123");

    expect(mockRemoveJobScheduler).toHaveBeenCalledWith(
      "monitor-monitor-123"
    );
  });

  test("resumes a monitor by scheduling it again", async () => {
    await resumeMonitorSchedule(validMonitor);

    expect(mockUpsertJobScheduler).toHaveBeenCalled();
  });

  test("propagates queue errors", async () => {
    mockUpsertJobScheduler.mockRejectedValueOnce(
      new Error("Redis unavailable")
    );

    await expect(
      scheduleMonitor(validMonitor)
    ).rejects.toThrow("Redis unavailable");
  });
});
