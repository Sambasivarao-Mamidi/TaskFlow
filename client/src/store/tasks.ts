import { create } from "zustand";
import { apiJson } from "../lib/api";
import type { TaskDto, TaskStatus, TaskPriority, TaskListResponse } from "@taskflow/shared";

export interface AISubtaskDraft {
  id: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  estimatedHours?: number;
  selected: boolean;
}

interface TaskState {
  tasks: TaskDto[];
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  selectedTask: TaskDto | null;
  subtasks: AISubtaskDraft[];
  drawerOpen: boolean;
  aiLoading: boolean;
  aiError: string | null;
  fetchTasks: (projectId: string, cursor?: string, params?: Record<string, string>) => Promise<void>;
  createTask: (projectId: string, input: { title: string; description?: string; status?: TaskStatus; priority?: TaskPriority; dueDate?: string | null; assigneeId?: string | null }) => Promise<void>;
  updateTask: (id: string, updates: Partial<TaskDto>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  openTaskDrawer: (task: TaskDto) => void;
  closeTaskDrawer: () => void;
  setSubtasks: (subtasks: AISubtaskDraft[]) => void;
  toggleSubtask: (id: string) => void;
  updateSubtaskDraft: (id: string, updates: Partial<AISubtaskDraft>) => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  nextCursor: null,
  loading: false,
  error: null,
  selectedTask: null,
  subtasks: [],
  drawerOpen: false,
  aiLoading: false,
  aiError: null,

  fetchTasks: async (projectId, cursor?, params?) => {
    set({ loading: true, error: null });
    try {
      const searchParams = new URLSearchParams();
      if (cursor) searchParams.set("cursor", cursor);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.set(key, String(value));
          }
        });
      }
      const queryString = searchParams.toString();
      const data = await apiJson<TaskListResponse>(
        `/api/projects/${projectId}/tasks${queryString ? "?" + queryString : ""}`
      );
      set((state) => ({
        tasks: cursor ? [...state.tasks, ...data.tasks] : data.tasks,
        nextCursor: data.nextCursor,
        loading: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to load tasks", loading: false });
    }
  },

  createTask: async (projectId, input) => {
    set({ loading: true, error: null });
    try {
      const data = await apiJson<TaskDto>(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      set((state) => ({
        tasks: [data, ...state.tasks],
        loading: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to create task", loading: false });
    }
  },

  updateTask: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const data = await apiJson<TaskDto>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? data : t)),
        selectedTask: state.selectedTask?.id === id ? data : state.selectedTask,
        loading: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to update task", loading: false });
    }
  },

  deleteTask: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiJson(`/api/tasks/${id}`, { method: "DELETE" });
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        loading: false,
      }));
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to delete task", loading: false });
    }
  },

  openTaskDrawer: (task) => {
    set({ selectedTask: task, drawerOpen: true, subtasks: [], aiError: null });
  },

  closeTaskDrawer: () => {
    set({ selectedTask: null, drawerOpen: false, subtasks: [], aiError: null, aiLoading: false });
  },

  setSubtasks: (subtasks) => {
    set({ subtasks });
  },

  toggleSubtask: (id) => {
    set((state) => ({
      subtasks: state.subtasks.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)),
    }));
  },

  updateSubtaskDraft: (id, updates) => {
    set((state) => ({
      subtasks: state.subtasks.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  },

  clearError: () => set({ error: null }),
}));