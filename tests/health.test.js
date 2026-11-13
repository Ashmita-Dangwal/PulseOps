
import request from "supertest";
import app from "../src/app.js";

describe("PulseOps Health API", () => {
  test("GET /api/health should return 200", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("PulseOps API is healthy");
    expect(response.body.timestamp).toBeDefined();
  });

  test("GET / should return backend running message", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "PulseOps Backend is running!"
    );
  });
});
