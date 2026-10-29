import { z } from "zod";

export type ProjectStatus = "active" | "archived";

export interface ProjectDto {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdBy: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  status: z.enum(["active", "archived"]).optional(),
});

export type CreateProjectInput = z.infer<typeof projectSchema>;
