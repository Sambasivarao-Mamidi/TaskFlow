import { describe, it, expect } from "vitest";
import {
  ErrorResponseSchema,
  createErrorResponse,
  workspaceSchema,
  projectSchema,
  taskSchema,
  taskBreakdownSchema,
  type WorkspaceRole,
  type ProjectStatus,
} from "./index";

describe("ErrorResponseSchema", () => {
  it("validates a correct error response", () => {
    const result = ErrorResponseSchema.safeParse({
      error: { code: "validation_error", message: "Invalid input" },
    });
    expect(result.success).toBe(true);
  });

  it("validates error response with details", () => {
    const result = ErrorResponseSchema.safeParse({
      error: { code: "validation_error", message: "Invalid input", details: { field: "email" } },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing error", () => {
    const result = ErrorResponseSchema.safeParse({ message: "test" });
    expect(result.success).toBe(false);
  });

  it("createErrorResponse produces valid shape", () => {
    const resp = createErrorResponse("test_code", "test message", { detail: 1 });
    expect(ErrorResponseSchema.safeParse(resp).success).toBe(true);
    expect(resp.error.code).toBe("test_code");
    expect(resp.error.message).toBe("test message");
    expect(resp.error.details).toEqual({ detail: 1 });
  });
});

describe("workspaceSchema", () => {
  it("accepts valid name", () => {
    expect(workspaceSchema.safeParse({ name: "My Workspace" }).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(workspaceSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    expect(workspaceSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
  });
});

describe("projectSchema", () => {
  it("accepts valid project input", () => {
    expect(projectSchema.safeParse({ name: "Project A" }).success).toBe(true);
    expect(projectSchema.safeParse({ name: "Project A", status: "active" }).success).toBe(true);
    expect(projectSchema.safeParse({ name: "Project A", status: "archived" }).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(projectSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects invalid status", () => {
    expect(projectSchema.safeParse({ name: "A", status: "deleted" as ProjectStatus }).success).toBe(false);
  });
});

describe("taskSchema", () => {
  it("accepts valid task input", () => {
    expect(taskSchema.safeParse({ title: "Task 1" }).success).toBe(true);
    expect(taskSchema.safeParse({ title: "Task 1", status: "done", priority: "high" }).success).toBe(true);
  });

  it("rejects empty title", () => {
    expect(taskSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("rejects invalid status", () => {
    expect(taskSchema.safeParse({ title: "A", status: "closed" as any }).success).toBe(false);
  });
});

describe("taskBreakdownSchema", () => {
  it("accepts valid breakdown input", () => {
    expect(
      taskBreakdownSchema.safeParse({
        projectId: "proj123",
        taskTitle: "Build feature",
        model: "gpt-4o-mini",
      }).success
    ).toBe(true);
  });

  it("rejects missing projectId", () => {
    expect(taskBreakdownSchema.safeParse({ taskTitle: "x", model: "gpt-4o-mini" }).success).toBe(false);
  });

  it("rejects empty title", () => {
    expect(taskBreakdownSchema.safeParse({ projectId: "p", taskTitle: "", model: "gpt-4o-mini" }).success).toBe(false);
  });
});
