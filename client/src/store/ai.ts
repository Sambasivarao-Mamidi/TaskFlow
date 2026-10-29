import { create } from "zustand";
import { apiJson } from "../lib/api";
import type { AiKeyDto, AITaskBreakdownInput, AITaskBreakdownOutput } from "@taskflow/shared";

interface AIState {
  hasKey: boolean;
  hint: string | null;
  loading: boolean;
  error: string | null;
  checkStatus: () => Promise<void>;
  saveKey: (apiKey: string) => Promise<void>;
  deleteKey: () => Promise<void>;
  breakdown: (input: AITaskBreakdownInput) => Promise<AITaskBreakdownOutput>;
  clearError: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  hasKey: false,
  hint: null,
  loading: false,
  error: null,
  clearError: () => set({ error: null }),

  checkStatus: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiJson<{ hasKey: boolean; hint?: string }>("/api/ai/keys/status");
      set({ hasKey: data.hasKey, hint: data.hint ?? null, loading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to check AI key status", loading: false });
    }
  },

  saveKey: async (apiKey: string) => {
    set({ loading: true, error: null });
    try {
      const data = await apiJson<{ message: string; hint: string }>("/api/ai/keys", {
        method: "POST",
        body: JSON.stringify({ apiKey }),
      });
      set({ hasKey: true, hint: data.hint, loading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to save AI key", loading: false });
    }
  },

  deleteKey: async () => {
    set({ loading: true, error: null });
    try {
      await apiJson("/api/ai/keys", { method: "DELETE" });
      set({ hasKey: false, hint: null, loading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Failed to delete AI key", loading: false });
    }
  },

  breakdown: async (input) => {
    const data = await apiJson<AITaskBreakdownOutput>("/api/ai/task-breakdown", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data;
  },
}));
