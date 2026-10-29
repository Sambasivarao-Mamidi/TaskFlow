import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import { Workspace } from "../models/Workspace";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { authenticate, requireAuth, type AuthRequest } from "../middleware/auth";
import { createErrorResponse } from "@taskflow/shared";

const router = Router();

router.get(
  "/dashboard/:workspaceId",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { workspaceId } = req.params;

    if (!Types.ObjectId.isValid(workspaceId)) {
      res.status(404).json(createErrorResponse("not_found", "Workspace not found"));
      return;
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || workspace.deletedAt !== null) {
      res.status(404).json(createErrorResponse("not_found", "Workspace not found"));
      return;
    }

    const isMember = workspace.members.some(
      (m) => m.userId.toString() === userId
    );
    if (!isMember) {
      res.status(403).json(createErrorResponse("forbidden", "Not a workspace member"));
      return;
    }

    const projectIds = await Project.find(
      { workspaceId: new Types.ObjectId(workspaceId) },
      { _id: 1 }
    ).distinct("_id");

    const now = new Date();
    const [
      total,
      completed,
      inProgress,
      overdue,
    ] = await Promise.all([
      Task.countDocuments({ projectId: { $in: projectIds } }),
      Task.countDocuments({
        projectId: { $in: projectIds },
        status: "done",
      }),
      Task.countDocuments({
        projectId: { $in: projectIds },
        status: "in_progress",
      }),
      Task.countDocuments({
        projectId: { $in: projectIds },
        dueDate: { $lt: now },
        status: { $ne: "done" },
      }),
    ]);

    res.json({ total, completed, inProgress, overdue });
  }
);

export default router;
