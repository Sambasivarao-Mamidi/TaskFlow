import { create } from "zustand";
import { apiJson } from "../lib/api";
import type { ProjectDto, ProjectStatus } from "@taskflow/shared";

interface ProjectState {
  projects: ProjectDto[];
  selectedProject: ProjectDto | null;
  loading: boolean;
  error: string | null;
  fetchProjects: (workspaceId: string) => Promise<void>;
  createProject: (workspaceId: string, name: string, status?: ProjectStatus) => Promise<void>;
  updateProject: (id: string, updates: { name?: string; status?: ProjectStatus }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (project: ProjectDto | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,
  clearError: () => set({ error: null }),

  fetchProjects: async (workspaceId) => {
    set({ loading: true, error: null });
    try {
      const data = await apiJson<ProjectDto[]>(`/api/workspaces/${workspaceId}/projects`);
      set({ projects: data, loading: false });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Failed to load projects",
        loading: false,
      });
    }
  },

  createProject: async (workspaceId, name, status) => {
    set({ loading: true, error: null });
    try {
      const data = await apiJson<ProjectDto>(`/api/workspaces/${workspaceId}/projects`, {
        method: "POST",
        body: JSON.stringify({ name, status }),
      });
      set((state) => ({
        projects: [data, ...state.projects],
        loading: false,
      }));
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Failed to create project",
        loading: false,
      });
    }
  },

  updateProject: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const data = await apiJson<ProjectDto>(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? data : p)),
        selectedProject: state.selectedProject?.id === id ? data : state.selectedProject,
        loading: false,
      }));
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Failed to update project",
        loading: false,
      });
    }
  },

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiJson(`/api/projects/${id}`, { method: "DELETE" });
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
        loading: false,
      }));
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete project",
        loading: false,
      });
    }
  },

  selectProject: (project) => set({ selectedProject: project }),
}));
