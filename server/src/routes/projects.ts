import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Workspace } from "../models/Workspace";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { authenticate, requireAuth, type AuthRequest } from "../middleware/auth";
import { projectSchema } from "@taskflow/shared";
import { createErrorResponse } from "@taskflow/shared";

const router = Router();

async function requireWorkspaceMembership(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace || workspace.deletedAt !== null) {
    return false;
  }
  return workspace.members.some((m) => m.userId.toString() === userId);
}

router.get(
  "/workspaces/:workspaceId/projects",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { workspaceId } = req.params;

    const isMember = await requireWorkspaceMembership(workspaceId, userId);
    if (!isMember) {
      res.status(403).json(createErrorResponse("forbidden", "Not a workspace member"));
      return;
    }

    const projects = await Project.find({
      workspaceId,
      status: { $ne: "archived" },
    }).sort({ createdAt: -1 });

    res.json(
      projects.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        workspaceId: p.workspaceId.toString(),
        createdBy: p.createdBy.toString(),
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))
    );
  }
);

router.post(
  "/workspaces/:workspaceId/projects",
  authenticate, requireAuth,
  async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).userId!;
    const { workspaceId } = req.params;

    const isMember = await requireWorkspaceMembership(workspaceId, userId);
    if (!isMember) {
      res.status(403).json(createErrorResponse("forbidden", "Not a workspace member"));
      return;
    }

    const parsed = projectSchema.safeParse(req.body);
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

    const { name, status = "active" } = parsed.data;

    const project = await Project.create({
      name,
      workspaceId,
      createdBy: userId,
      status,
    });

    res.status(201).json({
      id: project._id.toString(),
      name: project.name,
      workspaceId: project.workspaceId.toString(),
      createdBy: project.createdBy.toString(),
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  }
);

router.get(
  "/projects/:id",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json(createErrorResponse("not_found", "Project not found"));
      return;
    }

    const isMember = await requireWorkspaceMembership(
      project.workspaceId.toString(),
      userId
    );
    if (!isMember) {
      res.status(403).json(createErrorResponse("forbidden", "Not a workspace member"));
      return;
    }

    res.json({
      id: project._id.toString(),
      name: project.name,
      workspaceId: project.workspaceId.toString(),
      createdBy: project.createdBy.toString(),
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  }
);

router.patch(
  "/projects/:id",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json(createErrorResponse("not_found", "Project not found"));
      return;
    }

    const isMember = await requireWorkspaceMembership(
      project.workspaceId.toString(),
      userId
    );
    if (!isMember) {
      res.status(403).json(createErrorResponse("forbidden", "Not a workspace member"));
      return;
    }

    const parsed = projectSchema.partial().safeParse(req.body);
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

    if (parsed.data.name !== undefined) {
      project.name = parsed.data.name;
    }
    if (parsed.data.status !== undefined) {
      project.status = parsed.data.status;
    }
    await project.save();

    res.json({
      id: project._id.toString(),
      name: project.name,
      workspaceId: project.workspaceId.toString(),
      createdBy: project.createdBy.toString(),
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  }
);

router.delete(
  "/projects/:id",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json(createErrorResponse("not_found", "Project not found"));
      return;
    }

    const isMember = await requireWorkspaceMembership(
      project.workspaceId.toString(),
      userId
    );
    if (!isMember) {
      res.status(403).json(createErrorResponse("forbidden", "Not a workspace member"));
      return;
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Task.deleteMany({ projectId: project._id }, { session });
        await Project.deleteOne({ _id: id }, { session });
      });
    } finally {
      await session.endSession();
    }

    res.json({ message: "Project deleted" });
  }
);

export default router;
