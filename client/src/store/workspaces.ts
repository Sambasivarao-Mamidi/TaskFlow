import { create } from "zustand";
import { apiJson } from "../lib/api";
import type { WorkspaceDto, WorkspaceMember } from "@taskflow/shared";

interface WorkspaceState {
  workspaces: WorkspaceDto[];
  selectedWorkspace: WorkspaceDto | null;
  loading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
  updateWorkspace: (id: string, updates: { name?: string }) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  selectWorkspace: (workspace: WorkspaceDto | null) => void;
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  selectedWorkspace: null,
  loading: false,
  error: null,
  clearError: () => set({ error: null }),

  fetchWorkspaces: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiJson<WorkspaceDto[]>("/api/workspaces");
      set({ workspaces: data, loading: false });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Failed to load workspaces",
        loading: false,
      });
    }
  },

  createWorkspace: async (name: string) => {
    set({ loading: true, error: null });
    try {
      const data = await apiJson<WorkspaceDto>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      set((state) => ({
        workspaces: [data, ...state.workspaces],
        loading: false,
      }));
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Failed to create workspace",
        loading: false,
      });
    }
  },

  updateWorkspace: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const data = await apiJson<WorkspaceDto>(`/api/workspaces/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      set((state) => ({
        workspaces: state.workspaces.map((w) =>
          w.id === id ? data : w
        ),
        selectedWorkspace:
          state.selectedWorkspace?.id === id ? data : state.selectedWorkspace,
        loading: false,
      }));
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Failed to update workspace",
        loading: false,
      });
    }
  },

  deleteWorkspace: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiJson(`/api/workspaces/${id}`, { method: "DELETE" });
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
        selectedWorkspace:
          state.selectedWorkspace?.id === id ? null : state.selectedWorkspace,
        loading: false,
      }));
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete workspace",
        loading: false,
      });
    }
  },

  selectWorkspace: (workspace) => set({ selectedWorkspace: workspace }),
}));
