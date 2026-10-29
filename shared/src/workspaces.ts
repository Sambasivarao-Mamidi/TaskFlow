import { z } from "zod";

export type WorkspaceRole = "owner" | "member";

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
}

export interface WorkspaceDto {
  id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
}

export const workspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

export type CreateWorkspaceInput = z.infer<typeof workspaceSchema>;
