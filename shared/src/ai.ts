import { z } from "zod";

export type AIModel = "gpt-4o-mini" | "gpt-4o" | "gpt-4.1-mini" | "claude-3-haiku" | "claude-3-sonnet";

export const AI_MODELS: AIModel[] = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "claude-3-haiku", "claude-3-sonnet"];

export interface AiKeyDto {
  id: string;
  hint: string;
  createdAt: string;
  updatedAt: string;
}

export interface AISubtaskSuggestion {
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
}

export interface AITaskBreakdownInput {
  projectId: string;
  taskTitle: string;
  taskDescription?: string;
  model: AIModel;
}

export interface AITaskBreakdownOutput {
  subtasks: AISubtaskSuggestion[];
}

export const aiKeyStatusSchema = z.object({
  hasKey: z.boolean(),
  hint: z.string().optional(),
});

export const taskBreakdownSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  taskTitle: z.string().min(1, "Task title is required").max(200, "Title too long"),
  taskDescription: z.string().optional(),
  model: z.enum(["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "claude-3-haiku", "claude-3-sonnet"]),
});

export const aiBreakdownSchema = z.object({
  provider: z.enum(["openai"]).optional(),
  model: z.enum(["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"]).optional(),
  instruction: z.string().max(1000).optional(),
});

export const aiAcceptSubtaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  estimatedHours: z.number().optional(),
});

export const aiAcceptSchema = z.object({
  subtasks: z.array(aiAcceptSubtaskSchema),
});

export type AIAcceptSubtaskInput = z.infer<typeof aiAcceptSubtaskSchema>;
export type AIAcceptInput = z.infer<typeof aiAcceptSchema>;
