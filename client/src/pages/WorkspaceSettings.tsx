import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../store/workspaces";
import { useAuthStore } from "../store/auth";
import { apiJson } from "../lib/api";

export default function WorkspaceSettings() {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const {
    selectedWorkspace,
    updateWorkspace: _updateWorkspace,
    deleteWorkspace,
    fetchWorkspaces,
  } = useWorkspaceStore();

  const [workspaceName, setWorkspaceName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const workspace = selectedWorkspace ?? undefined;
  const wsId = workspaceId ?? workspace?.id;
  const isOwner = workspace?.ownerId === user?.id;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (wsId && selectedWorkspace) {
      setWorkspaceName(selectedWorkspace.name);
    }
  }, [isAuthenticated, wsId, selectedWorkspace, navigate]);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim() || !wsId) return;
    setRenaming(true);
    try {
      await apiJson(`/api/workspaces/${wsId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: workspaceName.trim() }),
      });
      // Refresh workspaces list to reflect rename
      const store = useWorkspaceStore.getState();
      await store.fetchWorkspaces();
      setRenaming(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to rename workspace"
      );
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!wsId) return;
    setDeleting(true);
    try {
      await deleteWorkspace(wsId);
      navigate("/workspaces", { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete workspace"
      );
      setDeleting(false);
    }
  };

  const [error, setError] = useState("");
  const members = workspace?.members || [];

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#111827" }}>
            Workspace Settings
          </h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
            Manage your workspace {workspace?.name || ""}.
          </p>
        </div>
        <button
          onClick={() => navigate(`/w/${wsId}/dashboard`, { replace: true })}
          style={{
            padding: "8px 16px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#ffffff",
            color: "#374151",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      </div>
      {error && (
        <div style={{ color: "red", marginBottom: 16, padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6 }}>
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "red" }}>
            dismiss
          </button>
        </div>
      )}
      {!wsId && (
        <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
          Select a workspace to view its settings.
        </div>
      )}
      {wsId && (
        <>
          <section style={{ marginBottom: 32, padding: 20, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <h2 style={{ marginTop: 0, fontSize: 18, color: "#111827", marginBottom: 16 }}>
              Workspace name
            </h2>
            <form onSubmit={handleRename} style={{ display: "flex", gap: 8, maxWidth: 400 }}>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
                disabled={renaming}
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
                disabled={renaming || !workspaceName.trim()}
                style={{
                  padding: "10px 20px",
                  background: renaming ? "#94a3b8" : "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: renaming ? "not-allowed" : "pointer",
                }}
              >
                {renaming ? "Saving..." : "Rename"}
              </button>
            </form>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              Only the workspace owner can rename the workspace.
            </p>
          </section>

          <section style={{ marginBottom: 32, padding: 20, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <h2 style={{ marginTop: 0, fontSize: 18, color: "#111827", marginBottom: 16 }}>
              Members
            </h2>
            {members.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No members found.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {members.map((m: any) => (
                  <li
                    key={m.userId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "#2563eb",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {String(m.userId).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#111827" }}>
                          Member {m.userId.slice(-6)}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {m.role}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: m.role === "owner" ? "#16a34a" : "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      {m.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
              You are {isOwner ? "the owner" : "a member"} of this workspace.
            </p>
          </section>

          {isOwner && (
            <section style={{ padding: 20, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <h2 style={{ marginTop: 0, fontSize: 18, color: "#111827", marginBottom: 16 }}>
                Danger zone
              </h2>
              <p style={{ color: "#6b7280", marginBottom: 16 }}>
                Deleting this workspace will permanently remove all projects and tasks within it.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  background: "#ffffff",
                  border: "1px solid #dc2626",
                  color: "#dc2626",
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontWeight: 500,
                }}
              >
                {deleting ? "Deleting..." : "Delete workspace"}
              </button>
              {showDeleteConfirm && (
                <div style={{ marginTop: 12, padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6 }}>
                  <p style={{ margin: "0 0 12px 0", color: "#dc2626", fontSize: 13 }}>
                    Are you sure? This cannot be undone. Type the workspace name to confirm.
                  </p>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder={workspace?.name}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 4,
                      fontSize: 13,
                      marginBottom: 8,
                      width: "100%",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        if (workspaceName.trim() === workspace?.name) {
                          handleDelete();
                        } else {
                          setError("Workspace name does not match.");
                        }
                      }}
                      disabled={deleting}
                      style={{
                        flex: 1,
                        padding: "8px 16px",
                        background: "#dc2626",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 4,
                        cursor: deleting ? "not-allowed" : "pointer",
                        fontWeight: 500,
                      }}
                    >
                      {deleting ? "Deleting..." : "Confirm delete"}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{
                        padding: "8px 16px",
                        background: "#ffffff",
                        border: "1px solid #d1d5db",
                        color: "#374151",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}