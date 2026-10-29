/// <reference types="vite/client" />

import { useAuthStore } from "../store/auth";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

let refreshPromise: Promise<string | null> | null = null;

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function setAccessToken(token: string | null) {
  useAuthStore.getState().setAccessToken(token ?? "");
  if (token === null) {
    useAuthStore.getState().clearAuth();
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: useAuthStore.getState().refreshToken,
        }),
      });
      if (!res.ok) {
        return null;
      }
      const data = (await res.json()) as { accessToken?: string; refreshToken?: string };
      if (data.accessToken) {
        useAuthStore.getState().setTokens(
          data.accessToken,
          data.refreshToken ?? useAuthStore.getState().refreshToken ?? "",
          useAuthStore.getState().user ?? { id: "", name: "", email: "" }
        );
      }
      return data.accessToken ?? null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${input}`, {
    ...init,
    headers,
  });

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders: Record<string, string> = {
        ...(init?.headers as Record<string, string> ?? {}),
        Authorization: `Bearer ${newToken}`,
      };
      return fetch(`${API_BASE}${input}`, { ...init, headers: retryHeaders });
    }
    setAccessToken(null);
    window.location.href = "/login";
  }

  return res;
}

export async function apiJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await apiRequest(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}
