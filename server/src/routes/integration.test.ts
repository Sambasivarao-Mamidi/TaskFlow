import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import "../env";
import { app } from "../app";
import mongoose from "mongoose";
import request from "supertest";

const MONGO_URI =
  process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/taskflow";
const TEST_URI = MONGO_URI.replace(/\/[^/?]+(\?|$)/, "/taskflow_test$1");

beforeAll(async () => {
  await mongoose.connect(TEST_URI, { autoIndex: false });
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

async function loginUser(email: string, password = "password123", name = "Test User") {
  await request(app).post("/api/auth/register").send({ name, email, password });
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.accessToken;
}

describe("Health", () => {
  it("GET /api/health", async () => {
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("Auth", () => {
  it("POST /api/auth/register", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: "reg@example.com", password: "password123" })
      .expect(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.email).toBe("reg@example.com");
  });

  it("POST /api/auth/login", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: "login@example.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "password123" })
      .expect(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("POST /api/auth/login with wrong password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: "wrong@example.com", password: "password123" });
    await request(app)
      .post("/api/auth/login")
      .send({ email: "wrong@example.com", password: "wrongpassword" })
      .expect(401);
  });

  it("GET /api/auth/me with valid token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Me User", email: "me@example.com", password: "password123" });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "me@example.com", password: "password123" });
    const token = loginRes.body.accessToken;
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.email).toBe("me@example.com");
    expect(res.body.passwordHash).toBeUndefined();
  });

  it("GET /api/auth/me without token", async () => {
    await request(app).get("/api/auth/me").expect(401);
  });

  it("POST /api/auth/refresh rotates tokens", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Rot User", email: "rot@example.com", password: "password123" });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "rot@example.com", password: "password123" });
    const refreshToken = loginRes.body.refreshToken;
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .expect(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    // Old token should be revoked after rotation
    await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .expect(401);
  });

  it("POST /api/auth/refresh with reused token returns 401", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Reuse User", email: "reuse@example.com", password: "password123" });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "reuse@example.com", password: "password123" });
    const refreshToken = loginRes.body.refreshToken;
    await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .expect(200);
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken })
      .expect(401);
    expect(res.body.error.code).toBe("invalid_credentials");
  });

  it("POST /api/auth/logout", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Logout User", email: "logout@example.com", password: "password123" });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "logout@example.com", password: "password123" });
    const refreshToken = loginRes.body.refreshToken;
    await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken })
      .expect(200);
  });
});

describe("Workspaces", () => {
  it("POST /api/workspaces", async () => {
    const token = await loginUser("ws1@example.com");
    const res = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Workspace" })
      .expect(201);
    expect(res.body.name).toBe("Test Workspace");
    expect(res.body.ownerId).toBeDefined();
  });

  it("GET /api/workspaces", async () => {
    const token = await loginUser("ws2@example.com");
    await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Workspace" });
    const res = await request(app)
      .get("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("DELETE /api/workspaces/:id by owner", async () => {
    const token = await loginUser("ws3@example.com");
    await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "To Delete" });
    const listRes = await request(app)
      .get("/api/workspaces")
      .set("Authorization", `Bearer ${token}`);
    const ws = (listRes.body as any[]).find((w: any) => w.name === "To Delete");
    await request(app)
      .delete(`/api/workspaces/${ws.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  it("DELETE /api/workspaces/:id by non-owner returns 403", async () => {
    const tokenA = await loginUser("owner@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "Owner Workspace" });
    const wsId = wsRes.body.id;

    const tokenB = await loginUser("nonmember@example.com");
    await request(app)
      .delete(`/api/workspaces/${wsId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(403);
  });
});

describe("Projects", () => {
  it("POST /api/workspaces/:workspaceId/projects", async () => {
    const token = await loginUser("p1@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "P Workspace" });
    const workspaceId = wsRes.body.id;

    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Project" })
      .expect(201);
    expect(res.body.name).toBe("Test Project");
    expect(res.body.status).toBe("active");
  });

  it("GET /api/workspaces/:workspaceId/projects", async () => {
    const token = await loginUser("p2@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "P Workspace" });
    const workspaceId = wsRes.body.id;

    await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Project" });
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /api/projects/:id", async () => {
    const token = await loginUser("p3@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "P Workspace" });
    const workspaceId = wsRes.body.id;

    await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Get Project" });
    const listRes = await request(app)
      .get(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`);
    const projectId = (listRes.body as any[])[0].id;
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.id).toBe(projectId);
  });

  it("PATCH /api/projects/:id", async () => {
    const token = await loginUser("p4@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "P Workspace" });
    const workspaceId = wsRes.body.id;

    await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Patch Project" });
    const listRes = await request(app)
      .get(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`);
    const projectId = (listRes.body as any[])[0].id;
    const res = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Project", status: "archived" })
      .expect(200);
    expect(res.body.name).toBe("Updated Project");
    expect(res.body.status).toBe("archived");
  });

  it("DELETE /api/projects/:id", async () => {
    const token = await loginUser("p5@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "P Workspace" });
    const workspaceId = wsRes.body.id;

    await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Delete Project" });
    const listRes = await request(app)
      .get(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`);
    const projectId = (listRes.body as any[]).find((p: any) => p.name === "Delete Project").id;
    await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });
});

describe("Tasks", () => {
  it("POST /api/projects/:projectId/tasks", async () => {
    const token = await loginUser("t1@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Workspace" });
    const workspaceId = wsRes.body.id;

    const projRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Project" });
    const projectId = projRes.body.id;

    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Task", priority: "high" })
      .expect(201);
    expect(res.body.title).toBe("Test Task");
    expect(res.body.status).toBe("todo");
  });

  it("GET /api/projects/:projectId/tasks", async () => {
    const token = await loginUser("t2@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Workspace" });
    const workspaceId = wsRes.body.id;

    const projRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Project" });
    const projectId = projRes.body.id;

    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "List Task" });
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  it("GET /api/tasks/:id", async () => {
    const token = await loginUser("t3@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Workspace" });
    const workspaceId = wsRes.body.id;

    const projRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Project" });
    const projectId = projRes.body.id;

    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Get Task" });
    const listRes = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`);
    const taskId = (listRes.body as any).tasks[0].id;
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.id).toBe(taskId);
  });

  it("PATCH /api/tasks/:id", async () => {
    const token = await loginUser("t4@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Workspace" });
    const workspaceId = wsRes.body.id;

    const projRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Project" });
    const projectId = projRes.body.id;

    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Patch Task" });
    const listRes = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`);
    const taskId = (listRes.body as any).tasks[0].id;
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "done" })
      .expect(200);
    expect(res.body.status).toBe("done");
  });

  it("DELETE /api/tasks/:id", async () => {
    const token = await loginUser("t5@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Workspace" });
    const workspaceId = wsRes.body.id;

    const projRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Project" });
    const projectId = projRes.body.id;

    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Delete Task" });
    const listRes = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`);
    const taskId = (listRes.body as any).tasks.find((t: any) => t.title === "Delete Task").id;
    await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  it("Cursor pagination", async () => {
    const token = await loginUser("t6@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Workspace" });
    const workspaceId = wsRes.body.id;

    const projRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Project" });
    const projectId = projRes.body.id;

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: `Page Task ${i}` });
    }
    const res1 = await request(app)
      .get(`/api/projects/${projectId}/tasks?limit=2`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res1.body.tasks.length).toBe(2);
    expect(res1.body.nextCursor).toBeDefined();
    const res2 = await request(app)
      .get(`/api/projects/${projectId}/tasks?limit=2&cursor=${res1.body.nextCursor}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res2.body.tasks.length).toBe(2);
  });

  it("Filters by status", async () => {
    const token = await loginUser("t7@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Workspace" });
    const workspaceId = wsRes.body.id;

    const projRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "T Project" });
    const projectId = projRes.body.id;

    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Done Task", status: "done" });
    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Todo Task", status: "todo" });
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks?status=done`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect((res.body.tasks as any[]).every((t: any) => t.status === "done")).toBe(true);
  });
});

describe("Dashboard", () => {
  it("GET /api/dashboard/:workspaceId", async () => {
    const token = await loginUser("d1@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "D Workspace" });
    const workspaceId = wsRes.body.id;

    const projRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "D Project" });

    await request(app)
      .post(`/api/projects/${projRes.body.id}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Done Task", status: "done" });
    await request(app)
      .post(`/api/projects/${projRes.body.id}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "In Progress Task", status: "in_progress" });
    await request(app)
      .post(`/api/projects/${projRes.body.id}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Todo Task", status: "todo" });

    const res = await request(app)
      .get(`/api/dashboard/${workspaceId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.total).toBe(3);
    expect(res.body.completed).toBe(1);
    expect(res.body.inProgress).toBe(1);
    expect(typeof res.body.overdue).toBe("number");
  });
});

describe("AI", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = originalFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("POST /api/ai/keys saves and masks key", async () => {
    const token = await loginUser("ai1@example.com");
    const res = await request(app)
      .post("/api/ai/keys")
      .set("Authorization", `Bearer ${token}`)
      .send({ apiKey: "sk-test-1234567890" })
      .expect(200);
    expect(res.body.hint).toMatch(/\*+/);
  });

  it("GET /api/ai/keys/status returns hasKey false initially", async () => {
    const token = await loginUser("ai2@example.com");
    const res = await request(app)
      .get("/api/ai/keys/status")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.hasKey).toBe(false);
  });

  it("GET /api/ai/keys/status returns hasKey true after saving", async () => {
    const token = await loginUser("ai3@example.com");
    await request(app)
      .post("/api/ai/keys")
      .set("Authorization", `Bearer ${token}`)
      .send({ apiKey: "sk-test-abcdef123456" });
    const res = await request(app)
      .get("/api/ai/keys/status")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.hasKey).toBe(true);
    expect(res.body.hint).toBeDefined();
  });

  it("DELETE /api/ai/keys removes key", async () => {
    const token = await loginUser("ai4@example.com");
    await request(app)
      .post("/api/ai/keys")
      .set("Authorization", `Bearer ${token}`)
      .send({ apiKey: "sk-test-delete-me" });
    await request(app)
      .delete("/api/ai/keys")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const res = await request(app)
      .get("/api/ai/keys/status")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.hasKey).toBe(false);
  });

  it("POST /api/ai/task-breakdown returns 400 if no key configured", async () => {
    const token = await loginUser("ai5@example.com");
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "AI WS" });
    const wsId = wsRes.body.id;
    const projRes = await request(app)
      .post(`/api/workspaces/${wsId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "AI Project" });
    const projId = projRes.body.id;
    await request(app)
      .post("/api/ai/task-breakdown")
      .set("Authorization", `Bearer ${token}`)
      .send({ projectId: projId, taskTitle: "Test task", model: "gpt-4o-mini" })
      .expect(400);
  });

  it("POST /api/ai/task-breakdown succeeds with mocked OpenAI", async () => {
    const token = await loginUser("ai6@example.com");
    await request(app)
      .post("/api/ai/keys")
      .set("Authorization", `Bearer ${token}`)
      .send({ apiKey: "sk-test-mock-key" });
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "AI WS2" });
    const wsId = wsRes.body.id;
    const projRes = await request(app)
      .post(`/api/workspaces/${wsId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "AI Project2" });
    const projId = projRes.body.id;

    global.fetch = (async () => {
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify([
                  { title: "Subtask 1", description: "Do step 1", status: "todo", priority: "high" },
                  { title: "Subtask 2", description: "Do step 2", status: "todo", priority: "medium" },
                ]),
              },
            },
          ],
        }),
      } as any;
    }) as any;

    const res = await request(app)
      .post("/api/ai/task-breakdown")
      .set("Authorization", `Bearer ${token}`)
      .send({ projectId: projId, taskTitle: "Build feature", model: "gpt-4o-mini" })
      .expect(200);
    expect(Array.isArray(res.body.subtasks)).toBe(true);
    expect(res.body.subtasks.length).toBe(2);
  });

  it("POST /api/ai/task-breakdown returns 502 on provider error", async () => {
    const token = await loginUser("ai7@example.com");
    await request(app)
      .post("/api/ai/keys")
      .set("Authorization", `Bearer ${token}`)
      .send({ apiKey: "sk-test-mock-key2" });
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "AI WS3" });
    const wsId = wsRes.body.id;
    const projRes = await request(app)
      .post(`/api/workspaces/${wsId}/projects`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "AI Project3" });
    const projId = projRes.body.id;

    global.fetch = (async () => {
      return {
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      } as any;
    }) as any;

    await request(app)
      .post("/api/ai/task-breakdown")
      .set("Authorization", `Bearer ${token}`)
      .send({ projectId: projId, taskTitle: "Build feature", model: "gpt-4o-mini" })
      .expect(502);
  });
});
