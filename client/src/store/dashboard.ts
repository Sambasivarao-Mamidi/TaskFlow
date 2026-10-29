import { create } from "zustand";
import { apiJson } from "../lib/api";
import type { DashboardStats } from "@taskflow/shared";

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  fetchDashboard: (workspaceId: string) => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  clearError: () => set({ error: null }),

  fetchDashboard: async (workspaceId) => {
    set({ loading: true, error: null });
    try {
      const data = await apiJson<DashboardStats>(
        `/api/dashboard/${workspaceId}`
      );
      set({ stats: data, loading: false });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : "Failed to load dashboard",
        loading: false,
      });
    }
  },
}));
