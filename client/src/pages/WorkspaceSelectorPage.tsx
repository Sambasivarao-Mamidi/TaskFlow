import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspaceStore } from "../store/workspaces";
import { useAuthStore } from "../store/auth";

export default function WorkspaceSelectorPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const {
    workspaces,
    loading,
    error,
    clearError,
    fetchWorkspaces,
    createWorkspace,
    selectWorkspace,
  } = useWorkspaceStore();
  const [creating, setCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchWorkspaces();
  }, [isAuthenticated, fetchWorkspaces]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setCreating(true);
    await createWorkspace(newWorkspaceName.trim());
    const updated = useWorkspaceStore.getState().workspaces;
    const created = updated.find((w) => w.name === newWorkspaceName.trim());
    if (created) {
      selectWorkspace(created);
      navigate(`/w/${created.id}/dashboard`, { replace: true });
    }
    setCreating(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading && workspaces.length === 0) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        Loading workspaces...
      </div>
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <a
          href="/workspaces"
          style={{
            textDecoration: "none",
            color: "#2563eb",
            fontSize: 14,
          }}
        >
          ← Workspaces
        </a>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#111827" }}>
          Workspaces
        </h1>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: 16, padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6 }}>
          {error}
          <button onClick={clearError} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "red" }}>
            dismiss
          </button>
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 16, fontSize: 18, color: "#111827" }}>Create your first workspace</h2>
        <p style={{ marginBottom: 16, color: "#6b7280" }}>
          A workspace is where your projects and tasks live. Create one to get started.
        </p>
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, maxWidth: 400 }}>
          <input
            type="text"
            placeholder="Workspace name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            required
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={creating || !newWorkspaceName.trim()}
            style={{
              padding: "10px 20px",
              background: creating ? "#94a3b8" : "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: creating ? "not-allowed" : "pointer",
            }}
          >
            {creating ? "Creating..." : "Create workspace"}
          </button>
        </form>
      </div>

      {workspaces.length > 0 && (
        <>
          <h2 style={{ marginBottom: 16, fontSize: 18, color: "#111827" }}>Your workspaces</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {workspaces.map((w) => (
              <li
                key={w.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  marginBottom: 8,
                  background: "#ffffff",
                  cursor: "pointer",
                }}
                onClick={() => {
                  selectWorkspace(w);
                  navigate(`/w/${w.id}/dashboard`, { replace: true });
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#111827" }}>{w.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Owner: {w.ownerId === user?.id ? "You" : "Someone else"} • Member
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: w.ownerId === user?.id ? "#16a34a" : "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  {w.ownerId === user?.id ? "Owner" : "Member"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {workspaces.length === 0 && !creating && (
        <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1", marginTop: 24 }}>
          <h2 style={{ marginBottom: 8, color: "#111827" }}>No workspaces yet</h2>
          <p style={{ color: "#6b7280", marginBottom: 20 }}>
            Create your first workspace to start organizing projects and tasks.
          </p>
        </div>
      )}
    </div>
  );
}