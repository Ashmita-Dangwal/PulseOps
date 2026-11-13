
import request from "supertest";
import app from "../src/app.js";

describe("Project Management API", () => {

  // Existing tests

  test("POST /api/projects should accept valid project details", async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: "PulseOps Project",
        description: "API monitoring platform"
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe("PulseOps Project");
  });

  test("POST /api/projects should reject an empty project name", async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: "",
        description: "Test project"
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("GET /api/projects should return a project list", async () => {
    const response = await request(app)
      .get("/api/projects");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  test("GET /api/projects/:id should return the requested ID", async () => {
    const response = await request(app)
      .get("/api/projects/project-123");

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe("project-123");
  });

  // New validation tests

  test("POST should reject project names longer than 100 characters", async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: "A".repeat(101),
        description: "Test project"
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("POST should reject descriptions longer than 500 characters", async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: "Test Project",
        description: "A".repeat(501)
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("POST should reject unexpected fields", async () => {
    const response = await request(app)
      .post("/api/projects")
      .send({
        name: "Test Project",
        description: "Test description",
        owner: "Unknown"
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("PUT should allow updating only the description", async () => {
    const response = await request(app)
      .put("/api/projects/project-123")
      .send({
        description: "Updated description"
      });

    expect(response.status).toBe(200);
    expect(response.body.data.description).toBe("Updated description");
  });

  test("PUT should allow updating only the name", async () => {
    const response = await request(app)
      .put("/api/projects/project-123")
      .send({
        name: "Updated Project"
      });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Updated Project");
  });

  test("PUT should reject an empty update request", async () => {
    const response = await request(app)
      .put("/api/projects/project-123")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("GET should reject a blank project ID", async () => {
    const response = await request(app)
      .get("/api/projects/%20");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("PUT should reject unexpected update fields", async () => {
    const response = await request(app)
      .put("/api/projects/project-123")
      .send({
        name: "Updated Project",
        owner: "Unknown"
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

});
