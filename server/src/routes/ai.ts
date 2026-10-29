import { Router, Request, Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { AiKey } from "../models/AiKey";
import { Task } from "../models/Task";
import { encrypt, decrypt, maskKey } from "../utils/encryption";
import { authenticate, requireAuth, type AuthRequest } from "../middleware/auth";
import { rateLimitMiddleware } from "../middleware/rateLimit";
import { taskBreakdownSchema } from "@taskflow/shared";
import { createErrorResponse } from "@taskflow/shared";

const router = Router();

function isOpenAIModel(model: string): boolean {
  return model.startsWith("gpt-");
}

function isAnthropicModel(model: string): boolean {
  return model.startsWith("claude-");
}

async function callOpenAI(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${body}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${body}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function buildBreakdownPrompt(input: { taskTitle: string; taskDescription?: string }): string {
  const desc = input.taskDescription ? `\nDescription: ${input.taskDescription}` : "";
  return `Break down the following task into smaller, actionable subtasks.

Title: ${input.taskTitle}${desc}

Return a JSON array of subtasks. Each subtask must have:
- "title" (string, required): short subtask title
- "description" (string, optional): brief description
- "status" (string, optional): one of "todo", "in_progress", "done"
- "priority" (string, optional): one of "low", "medium", "high"

Return ONLY the JSON array, no markdown fences, no extra text.`;
}

function parseSubtasks(text: string): { title: string; description?: string; status?: string; priority?: string }[] {
  let cleaned = text.trim();
  // Remove markdown code fences if present
  cleaned = cleaned.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

router.post(
  "/ai/keys",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { apiKey } = req.body as { apiKey?: string };

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      res.status(400).json(createErrorResponse("validation_error", "API key is required"));
      return;
    }

    // Basic key format validation: non-empty, reasonable length
    if (apiKey.trim().length < 8) {
      res.status(400).json(createErrorResponse("validation_error", "API key appears invalid (too short)"));
      return;
    }

    const trimmed = apiKey.trim();
    const existing = await AiKey.findOne({ userId });
    if (existing) {
      existing.encryptedKey = encrypt(trimmed);
      existing.hint = maskKey(trimmed);
      await existing.save();
    } else {
      await AiKey.create({
        userId: new Types.ObjectId(userId),
        encryptedKey: encrypt(trimmed),
        hint: maskKey(trimmed),
      });
    }

    res.json({ message: "API key saved", hint: maskKey(trimmed) });
  }
);

router.get(
  "/ai/keys/status",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const key = await AiKey.findOne({ userId });
    if (!key) {
      res.json({ hasKey: false });
      return;
    }
    res.json({ hasKey: true, hint: key.hint });
  }
);

router.delete(
  "/ai/keys",
  authenticate, requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    await AiKey.deleteOne({ userId });
    res.json({ message: "API key removed" });
  }
);

router.post(
  "/ai/task-breakdown",
  authenticate, requireAuth,
  rateLimitMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const parsed = taskBreakdownSchema.safeParse(req.body);
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

    const { projectId, taskTitle, taskDescription, model } = parsed.data;

    const keyRecord = await AiKey.findOne({ userId });
    if (!keyRecord) {
      res.status(400).json(
        createErrorResponse("no_ai_key", "No AI key configured. Save your key in settings first.")
      );
      return;
    }

    let apiKey: string;
    try {
      apiKey = decrypt(keyRecord.encryptedKey);
    } catch {
      res.status(500).json(createErrorResponse("decryption_error", "Failed to decrypt stored AI key"));
      return;
    }

    const prompt = buildBreakdownPrompt({ taskTitle, taskDescription });
    let aiResponse: string;
    try {
      if (isOpenAIModel(model)) {
        aiResponse = await callOpenAI(apiKey, model, prompt);
      } else if (isAnthropicModel(model)) {
        aiResponse = await callAnthropic(apiKey, model, prompt);
      } else {
        res.status(400).json(createErrorResponse("validation_error", "Unsupported model"));
        return;
      }
    } catch (err: unknown) {
      res.status(502).json(
        createErrorResponse("ai_provider_error", err instanceof Error ? err.message : "AI provider request failed")
      );
      return;
    }

    const suggestions = parseSubtasks(aiResponse).map((s) => ({
      title: s.title || "Untitled subtask",
      description: s.description,
      status: s.status === "todo" || s.status === "in_progress" || s.status === "done" ? s.status : "todo",
      priority: s.priority === "low" || s.priority === "medium" || s.priority === "high" ? s.priority : "medium",
    }));

    if (suggestions.length === 0) {
      res.status(502).json(
        createErrorResponse("ai_parse_error", "AI provider did not return parseable subtasks")
      );
      return;
    }

    res.json({ subtasks: suggestions });
  }
);

const aiBreakdownSchema = z.object({
  provider: z.enum(["openai"]).optional(),
  model: z.enum(["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"]),
  instruction: z.string().max(1000).optional(),
});

router.post(
  "/projects/:projectId/tasks/:taskId/ai/breakdown",
  authenticate,
  requireAuth,
  rateLimitMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { projectId, taskId } = req.params;

    const parsed = aiBreakdownSchema.safeParse(req.body);
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

    const { model = "gpt-4o-mini", instruction } = parsed.data;

    // Verify task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json(createErrorResponse("not_found", "Task not found"));
      return;
    }

    if (task.projectId.toString() !== projectId) {
      res.status(400).json(
        createErrorResponse("validation_error", "Task does not belong to this project")
      );
      return;
    }

    const keyRecord = await AiKey.findOne({ userId });
    if (!keyRecord) {
      res.status(400).json(
        createErrorResponse("no_ai_key", "No AI key configured. Save your key in settings first.")
      );
      return;
    }

    let apiKey: string;
    try {
      apiKey = decrypt(keyRecord.encryptedKey);
    } catch {
      res.status(500).json(createErrorResponse("decryption_error", "Failed to decrypt stored AI key"));
      return;
    }

    const prompt = `
Break down the following task into smaller, actionable subtasks.

Project context: Task "${task.title}" in a project.
Task description: ${task.description || "No description"}
Task priority: ${task.priority}
Task due date: ${task.dueDate ? task.dueDate.toISOString() : "Not set"}
${instruction ? `Additional instruction: ${instruction}` : ""}

Return a JSON array of subtasks. Each subtask must have:
- "title" (string, required): short subtask title
- "description" (string, optional): brief description
- "priority" (string, optional): one of "low", "medium", "high"
- "estimatedHours" (number, optional): estimated hours to complete

Return ONLY the JSON array, no markdown fences, no extra text.
`;

    let aiResponse: string;
    try {
      aiResponse = await callOpenAI(apiKey, model, prompt);
    } catch (err: unknown) {
      res.status(502).json(
        createErrorResponse("ai_provider_error", err instanceof Error ? err.message : "AI provider request failed")
      );
      return;
    }

    const suggestions = parseSubtasks(aiResponse).map((s: any) => ({
      title: s.title || "Untitled subtask",
      description: s.description,
      priority: s.priority === "low" || s.priority === "medium" || s.priority === "high" ? s.priority : "medium",
      estimatedHours: typeof s.estimatedHours === "number" ? s.estimatedHours : undefined,
    }));

    if (suggestions.length === 0) {
      res.status(502).json(
        createErrorResponse("ai_parse_error", "AI provider did not return parseable subtasks")
      );
      return;
    }

    res.json({ suggestions });
  }
);

const aiAcceptSchema = z.object({
  subtasks: z.array(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      estimatedHours: z.number().optional(),
    })
  ),
});

router.post(
  "/projects/:projectId/tasks/:taskId/ai/accept",
  authenticate,
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { projectId, taskId } = req.params;

    const parsed = aiAcceptSchema.safeParse(req.body);
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

    const { subtasks } = parsed.data;

    // Verify parent task exists and user has access
    const parentTask = await Task.findById(taskId);
    if (!parentTask) {
      res.status(404).json(createErrorResponse("not_found", "Task not found"));
      return;
    }

    if (parentTask.projectId.toString() !== projectId) {
      res.status(400).json(
        createErrorResponse("validation_error", "Task does not belong to this project")
      );
      return;
    }

    const createdTaskIds: string[] = [];
    for (const s of subtasks) {
      const created = await Task.create({
        title: s.title,
        description: s.description || "",
        projectId: new Types.ObjectId(projectId),
        status: "todo",
        priority: s.priority || "medium",
        dueDate: null,
        assigneeId: null,
        createdBy: new Types.ObjectId(userId),
        parentTaskId: new Types.ObjectId(taskId),
      });
      createdTaskIds.push(created._id.toString());
    }

    res.json({ createdTaskIds });
  }
);

export default router;
