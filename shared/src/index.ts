import { z } from "zod";

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): ErrorResponse {
  return { error: { code, message, details } };
}

export { registerSchema, loginSchema } from "./auth";
export type { RegisterInput, LoginInput } from "./auth";
export { workspaceSchema } from "./workspaces";
export type { WorkspaceRole, WorkspaceMember, WorkspaceDto, CreateWorkspaceInput } from "./workspaces";
export { projectSchema } from "./projects";
export type { ProjectStatus, ProjectDto, CreateProjectInput } from "./projects";
export {
  taskSchema,
  updateTaskSchema,
  taskListQuerySchema,
} from "./tasks";
export type {
  TaskStatus,
  TaskPriority,
  TaskDto,
  CreateTaskInput,
  UpdateTaskInput,
  TaskListResponse,
  TaskListQuery,
} from "./tasks";
export type { DashboardStats } from "./dashboard";
export {
  AI_MODELS,
} from "./ai";
export type {
  AIModel,
  AiKeyDto,
  AISubtaskSuggestion,
  AITaskBreakdownInput,
  AITaskBreakdownOutput,
  AIAcceptSubtaskInput,
  AIAcceptInput,
} from "./ai";
export { taskBreakdownSchema, aiBreakdownSchema, aiAcceptSchema } from "./ai";

export const placeholder = true;
