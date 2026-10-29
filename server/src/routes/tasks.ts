import { Router, Request, Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { Workspace } from "../models/Workspace";
import { authenticate, requireAuth, type AuthRequest } from "../middleware/auth";
import {
  taskSchema,
  updateTaskSchema,
  taskListQuerySchema,
} from "@taskflow/shared";
import { createErrorResponse } from "@taskflow/shared";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const router = Router();

function clampLimit(raw: string | undefined): number {
  const parsed = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(parsed, MAX_LIMIT);
}

function parseCursor(cursor: string | undefined) {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const obj = JSON.parse(decoded);
    return { createdAt: new Date(obj.createdAt), id: obj.id };
  } catch {
    return null;
  }
}

async function requireProjectMembership(
  projectId: string,
  userId: string
): Promise<boolean> {
  if (!Types.ObjectId.isValid(projectId)) {
    return false;
  }
  const project = await Project.findById(projectId);
  if (!project) {
    return false;
  }
  const workspace = await Workspace.findById(project.workspaceId);
  if (!workspace || workspace.deletedAt !== null) {
    return false;
  }
  return workspace.members.some((m) => m.userId.toString() === userId);
}

function taskToDto(task: any) {
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    projectId: task.projectId.toString(),
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    assigneeId: task.assigneeId ? task.assigneeId.toString() : null,
    createdBy: task.createdBy.toString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

router.get(
  "/projects/:projectId/tasks",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { projectId } = req.params;

    const isMember = await requireProjectMembership(projectId, userId);
    if (!isMember) {
      res.status(403).json(createErrorResponse("forbidden", "Not a project member"));
      return;
    }

    const parsed = taskListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json(
        createErrorResponse(
          "validation_error",
          "Invalid query",
          parsed.error.flatten().fieldErrors
        )
      );
      return;
    }

    const { cursor, limit, status, priority, assigneeId, dueBefore } = parsed.data;
    const pageSize = clampLimit(limit);

    const filter: any = { projectId: new Types.ObjectId(projectId) };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.assigneeId = new Types.ObjectId(assigneeId);
    if (dueBefore) filter.dueDate = { $lt: new Date(dueBefore) };

    const cursorObj = parseCursor(cursor);
    if (cursorObj) {
      filter.$or = [
        { createdAt: { $lt: cursorObj.createdAt } },
        { createdAt: cursorObj.createdAt, _id: { $lt: new Types.ObjectId(cursorObj.id) } },
      ];
    }

    const docs = await Task.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(pageSize + 1);

    let nextCursor: string | null = null;
    const tasks = docs.slice(0, pageSize);
    if (docs.length > pageSize) {
      const last = tasks[tasks.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          createdAt: last.createdAt.toISOString(),
          id: last._id.toString(),
        })
      ).toString("base64");
    }

    res.json({
      tasks: tasks.map(taskToDto),
      nextCursor,
    });
  }
);

router.post(
  "/projects/:projectId/tasks",
  authenticate, requireAuth,
  async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).userId!;
    const { projectId } = req.params;

    const isMember = await requireProjectMembership(projectId, userId);
    if (!isMember) {
      res.status(403).json(createErrorResponse("forbidden", "Not a project member"));
      return;
    }

    const parsed = taskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(
        createErrorResponse(
          "validation_error",
          "Invalid request",
          parsed.error.flatten().fieldErrors
        )
      );
      return;
    }

    const { title, description, status, priority, dueDate, assigneeId } = parsed.data;

    if (assigneeId && !Types.ObjectId.isValid(assigneeId)) {
      res.status(400).json(createErrorResponse("validation_error", "Invalid assigneeId"));
      return;
    }

    // Validate assignee is a workspace member (or null)
    const project = await Project.findById(projectId);
    const workspace = await Workspace.findById(project!.workspaceId);
    if (assigneeId) {
      const isAssigneeMember = workspace?.members.some(
        (m) => m.userId.toString() === assigneeId
      );
      if (!isAssigneeMember) {
        res.status(400).json(
          createErrorResponse("validation_error", "Assignee is not a workspace member")
        );
        return;
      }
    }

    const task = await Task.create({
      title,
      description: description ?? "",
      projectId: new Types.ObjectId(projectId),
      status: status ?? "todo",
      priority: priority ?? "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId ? new Types.ObjectId(assigneeId) : null,
      createdBy: new Types.ObjectId(userId),
    });

    res.status(201).json(taskToDto(task));
  }
);

router.get(
  "/tasks/:id",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json(createErrorResponse("not_found", "Task not found"));
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json(createErrorResponse("not_found", "Task not found"));
      return;
    }

    const isMember = await requireProjectMembership(
      task.projectId.toString(),
      userId
    );
    if (!isMember) {
      res.status(403).json(createErrorResponse("forbidden", "Not a project member"));
      return;
    }

    res.json(taskToDto(task));
  }
);

router.patch(
  "/tasks/:id",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json(createErrorResponse("not_found", "Task not found"));
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json(createErrorResponse("not_found", "Task not found"));
      return;
    }

    const isMember = await requireProjectMembership(
      task.projectId.toString(),
      userId
    );
    if (!isMember) {
      res.status(403).json(createErrorResponse("forbidden", "Not a project member"));
      return;
    }

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(
        createErrorResponse(
          "validation_error",
          "Invalid request",
          parsed.error.flatten().fieldErrors
        )
      );
      return;
    }

    const { assigneeId, dueDate, ...rest } = parsed.data;

    if (assigneeId !== undefined) {
      if (assigneeId && !Types.ObjectId.isValid(assigneeId)) {
        res.status(400).json(createErrorResponse("validation_error", "Invalid assigneeId"));
        return;
      }
      const project = await Project.findById(task.projectId);
      const workspace = await Workspace.findById(project!.workspaceId);
      if (assigneeId) {
        const isAssigneeMember = workspace?.members.some(
          (m) => m.userId.toString() === assigneeId
        );
        if (!isAssigneeMember) {
          res.status(400).json(
            createErrorResponse("validation_error", "Assignee is not a workspace member")
          );
          return;
        }
        task.assigneeId = new Types.ObjectId(assigneeId);
      } else {
        task.assigneeId = null;
      }
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : null;
    }

    Object.assign(task, rest);
    await task.save();

    res.json(taskToDto(task));
  }
);

router.delete(
  "/tasks/:id",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json(createErrorResponse("not_found", "Task not found"));
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json(createErrorResponse("not_found", "Task not found"));
      return;
    }

    const isMember = await requireProjectMembership(
      task.projectId.toString(),
      userId
    );
    if (!isMember) {
      res.status(403).json(createErrorResponse("forbidden", "Not a project member"));
      return;
    }

    await Task.deleteOne({ _id: id });
    res.json({ message: "Task deleted" });
  }
);

router.get(
  "/tasks/:taskId/subtasks",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json(createErrorResponse("not_found", "Task not found"));
      return;
    }

    const isMember = await requireProjectMembership(
      task.projectId.toString(),
      userId
    );
    if (!isMember) {
      res.status(403).json(createErrorResponse("forbidden", "Not a project member"));
      return;
    }

    const subtasks = await Task.find({ parentTaskId: new Types.ObjectId(taskId) });
    const completedCount = subtasks.filter((t) => t.status === "done").length;

    res.json({
      isParent: subtasks.length > 0,
      subtaskCount: subtasks.length,
      completedCount,
    });
  }
);

export default router;
