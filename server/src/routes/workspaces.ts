import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Workspace } from "../models/Workspace";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { authenticate, requireAuth, type AuthRequest } from "../middleware/auth";
import { workspaceSchema } from "@taskflow/shared";
import { createErrorResponse } from "@taskflow/shared";

const router = Router();

router.get("/", authenticate, requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const workspaces = await Workspace.find({
    deletedAt: null,
    "members.userId": userId,
  }).sort({ createdAt: -1 });

  res.json(
    workspaces.map((w) => ({
      id: w._id.toString(),
      name: w.name,
      ownerId: w.ownerId.toString(),
      members: w.members.map((m) => ({
        userId: m.userId.toString(),
        role: m.role,
      })),
      createdAt: w.createdAt.toISOString(),
    }))
  );
});

router.post(
  "/",
  authenticate,
  requireAuth,
  async (req: Request, res: Response) => {
    const parsed = workspaceSchema.safeParse(req.body);
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

    const { name } = parsed.data;
    const userId = (req as AuthRequest).userId!;

    const workspace = await Workspace.create({
      name,
      ownerId: userId,
      members: [{ userId, role: "owner" }],
    });

    res.status(201).json({
      id: workspace._id.toString(),
      name: workspace.name,
      ownerId: workspace.ownerId.toString(),
      members: workspace.members.map((m) => ({
        userId: m.userId.toString(),
        role: m.role,
      })),
      createdAt: workspace.createdAt.toISOString(),
    });
  }
);

router.delete(
  "/:id",
  authenticate,
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace || workspace.deletedAt !== null) {
      res.status(404).json(createErrorResponse("not_found", "Workspace not found"));
      return;
    }

    if (workspace.ownerId.toString() !== userId) {
      res.status(403).json(
        createErrorResponse("forbidden", "Only the owner can delete a workspace")
      );
      return;
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const projects = await Project.find({ workspaceId: workspace._id }).session(session);
        const projectIds = projects.map((p) => p._id);
        if (projectIds.length > 0) {
          await Task.deleteMany({ projectId: { $in: projectIds } }, { session });
        }
        await Project.deleteMany({ workspaceId: workspace._id }, { session });
        await Workspace.deleteOne({ _id: id }, { session });
      });
    } finally {
      await session.endSession();
    }

    res.json({ message: "Workspace deleted" });
  }
);

export default router;
