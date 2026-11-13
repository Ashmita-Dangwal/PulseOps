
import request from "supertest";
import { jest } from "@jest/globals";

// Mock scheduler functions before importing the app
const scheduleMonitor = jest.fn();
const pauseMonitorSchedule = jest.fn();
const removeMonitorSchedule = jest.fn();

jest.unstable_mockModule("../src/services/monitorScheduler.js", () => ({
  scheduleMonitor,
  pauseMonitorSchedule,
  removeMonitorSchedule,
  resumeMonitorSchedule: jest.fn()
}));

const { default: app } = await import("../src/app.js");

describe("Monitor Management API", () => {

  beforeEach(() => {
    jest.clearAllMocks();

    scheduleMonitor.mockResolvedValue(undefined);
    pauseMonitorSchedule.mockResolvedValue(undefined);
    removeMonitorSchedule.mockResolvedValue(undefined);
  });

  // Creation tests

  test("POST should create a monitor and schedule health checks", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Example Website",
        url: "https://example.com",
        method: "GET",
        interval: 60,
        timeout: 5000,
        expectedStatus: 200,
        projectId: "project-123"
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe("Example Website");

    expect(scheduleMonitor).toHaveBeenCalledTimes(1);
    expect(scheduleMonitor).toHaveBeenCalledWith(
      expect.objectContaining({
        monitorId: expect.any(String),
        name: "Example Website",
        url: "https://example.com",
        interval: 60,
        projectId: "project-123"
      })
    );
  });

  test("POST should reject an invalid URL", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Invalid Monitor",
        url: "not-a-valid-url",
        projectId: "project-123"
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(scheduleMonitor).not.toHaveBeenCalled();
  });

  test("POST should reject an invalid interval", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Invalid Interval Monitor",
        url: "https://example.com",
        interval: 10,
        projectId: "project-123"
      });

    expect(response.status).toBe(400);
    expect(scheduleMonitor).not.toHaveBeenCalled();
  });

  test("POST should reject monitor names longer than 100 characters", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "A".repeat(101),
        url: "https://example.com",
        projectId: "project-123"
      });

    expect(response.status).toBe(400);
  });

  test("POST should reject FTP URLs", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "FTP Monitor",
        url: "ftp://example.com",
        projectId: "project-123"
      });

    expect(response.status).toBe(400);
  });

  test("POST should reject URLs containing credentials", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Credential Monitor",
        url: "https://user:password@example.com",
        projectId: "project-123"
      });

    expect(response.status).toBe(400);
  });

  test("POST should reject unsupported HTTP methods", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Invalid Method Monitor",
        url: "https://example.com",
        method: "PATCH",
        projectId: "project-123"
      });

    expect(response.status).toBe(400);
  });

  test("POST should reject timeout below 1000 milliseconds", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Timeout Monitor",
        url: "https://example.com",
        timeout: 500,
        projectId: "project-123"
      });

    expect(response.status).toBe(400);
  });

  test("POST should reject timeout above 30000 milliseconds", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Timeout Monitor",
        url: "https://example.com",
        timeout: 40000,
        projectId: "project-123"
      });

    expect(response.status).toBe(400);
  });

  test("POST should reject expected status below 100", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Status Monitor",
        url: "https://example.com",
        expectedStatus: 99,
        projectId: "project-123"
      });

    expect(response.status).toBe(400);
  });

  test("POST should reject expected status above 599", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Status Monitor",
        url: "https://example.com",
        expectedStatus: 600,
        projectId: "project-123"
      });

    expect(response.status).toBe(400);
  });

  test("POST should reject a blank project ID", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Project Monitor",
        url: "https://example.com",
        projectId: " "
      });

    expect(response.status).toBe(400);
  });

  test("POST should reject unexpected fields", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Test Monitor",
        url: "https://example.com",
        projectId: "project-123",
        owner: "Unknown"
      });

    expect(response.status).toBe(400);
  });

  test("POST should forward scheduler errors to error middleware", async () => {
    scheduleMonitor.mockRejectedValueOnce(
      new Error("Redis unavailable")
    );

    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Example Website",
        url: "https://example.com",
        projectId: "project-123"
      });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });

  // Retrieval tests

  test("GET should return a monitor list", async () => {
    const response = await request(app)
      .get("/api/monitors");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  // Update tests

  test("PUT should allow updating only the monitor timeout", async () => {
    const response = await request(app)
      .put("/api/monitors/monitor-123")
      .send({ timeout: 10000 });

    expect(response.status).toBe(200);
    expect(response.body.data.timeout).toBe(10000);
  });

  test("PUT should allow updating only the monitor name", async () => {
    const response = await request(app)
      .put("/api/monitors/monitor-123")
      .send({ name: "Updated Monitor" });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Updated Monitor");
  });

  test("PUT should reject an empty update request", async () => {
    const response = await request(app)
      .put("/api/monitors/monitor-123")
      .send({});

    expect(response.status).toBe(400);
  });

  test("PUT should reject unexpected fields", async () => {
    const response = await request(app)
      .put("/api/monitors/monitor-123")
      .send({
        name: "Updated Monitor",
        owner: "Unknown"
      });

    expect(response.status).toBe(400);
  });

  // Pause tests

  test("PATCH pause should remove the recurring schedule", async () => {
    const response = await request(app)
      .patch("/api/monitors/monitor-123/pause");

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("PAUSED");

    expect(pauseMonitorSchedule).toHaveBeenCalledWith("monitor-123");
  });

  // Resume tests

  test("PATCH resume should return 501 until database integration exists", async () => {
    const response = await request(app)
      .patch("/api/monitors/monitor-123/resume");

    expect(response.status).toBe(501);
    expect(response.body.success).toBe(false);
  });

  // Delete tests

  test("DELETE should remove the recurring schedule", async () => {
    const response = await request(app)
      .delete("/api/monitors/monitor-123");

    expect(response.status).toBe(200);
    expect(removeMonitorSchedule).toHaveBeenCalledWith("monitor-123");
  });

  // ID validation tests

  test("GET should reject a blank monitor ID", async () => {
    const response = await request(app)
      .get("/api/monitors/%20");

    expect(response.status).toBe(400);
  });

  test("DELETE should reject a blank monitor ID", async () => {
    const response = await request(app)
      .delete("/api/monitors/%20");

    expect(response.status).toBe(400);
  });

});
