
import { jest } from "@jest/globals";

const mockFetch = jest.fn();
const mockLookup = jest.fn();

class MockAgent {
  async close() {}
}

jest.unstable_mockModule("node:dns/promises", () => ({
  lookup: mockLookup
}));

jest.unstable_mockModule("undici", () => ({
  Agent: MockAgent,
  fetch: mockFetch
}));

const { performHealthCheck } = await import(
  "../src/services/healthCheckService.js"
);

describe("Health Check Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Simulate public DNS, except localhost.
    mockLookup.mockImplementation(async (hostname) => {
      if (hostname === "localhost") {
        return [{ address: "127.0.0.1", family: 4 }];
      }

      return [{ address: "8.8.8.8", family: 4 }];
    });
  });

  // URL security tests

  test("Should reject localhost", async () => {
    const result = await performHealthCheck({
      monitorId: "test-1",
      url: "http://localhost",
      timeout: 3000
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/local or private/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("Should reject a private IP address", async () => {
    const result = await performHealthCheck({
      monitorId: "test-2",
      url: "http://192.168.1.1",
      timeout: 3000
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/local or private/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("Should reject FTP URLs", async () => {
    const result = await performHealthCheck({
      monitorId: "test-3",
      url: "ftp://example.com",
      timeout: 3000
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/HTTP and HTTPS/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("Should reject URLs containing credentials", async () => {
    const result = await performHealthCheck({
      monitorId: "test-4",
      url: "https://user:password@example.com",
      timeout: 3000
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/credentials/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // Health-check failure tests

  test("Should handle HTTP 500 responses", async () => {
    mockFetch.mockResolvedValue({
      status: 500
    });

    const result = await performHealthCheck({
      monitorId: "test-5",
      url: "https://example.com",
      method: "GET",
      timeout: 5000,
      expectedStatus: 200
    });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.errorType).toBe("UNEXPECTED_STATUS");
    expect(result.errorMessage).toMatch(/Expected 200, received 500/);
  });

  test("Should handle request timeouts", async () => {
    const timeoutError = new Error("Request timed out");
    timeoutError.name = "TimeoutError";

    mockFetch.mockRejectedValue(timeoutError);

    const result = await performHealthCheck({
      monitorId: "test-6",
      url: "https://example.com",
      timeout: 1000
    });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBeNull();
    expect(result.errorType).toBe("TIMEOUT");
  });

  test("Should handle unreachable endpoints", async () => {
    mockFetch.mockRejectedValue(
      new TypeError("fetch failed")
    );

    const result = await performHealthCheck({
      monitorId: "test-7",
      url: "https://example.com",
      timeout: 5000
    });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBeNull();
    expect(result.errorType).toBe("REQUEST_FAILED");
  });
});
