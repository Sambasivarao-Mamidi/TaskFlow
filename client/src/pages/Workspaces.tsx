import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../store/workspaces";
import { useAuthStore } from "../store/auth";
import { CreateWorkspaceForm } from "../components/CreateWorkspaceForm";
import { WorkspaceSelector } from "../components/WorkspaceSelector";
import { DeleteWorkspaceDialog } from "../components/DeleteWorkspaceDialog";

export default function Workspaces() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    workspaces,
    selectedWorkspace,
    loading,
    error,
    clearError,
    fetchWorkspaces,
    createWorkspace,
    deleteWorkspace,
    selectWorkspace,
  } = useWorkspaceStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchWorkspaces();
  }, [isAuthenticated, fetchWorkspaces, navigate]);

  if (loading && workspaces.length === 0) {
    return <div>Loading workspaces...</div>;
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Workspaces</h1>
      {error && (
        <div style={{ color: "red", marginBottom: 12 }}>
          {error}
          <button onClick={clearError} style={{ marginLeft: 8 }}>
            dismiss
          </button>
        </div>
      )}
      <CreateWorkspaceForm onCreate={createWorkspace} loading={loading} />
      <WorkspaceSelector
        workspaces={workspaces}
        selected={selectedWorkspace}
        onSelect={selectWorkspace}
      />
      <div style={{ marginTop: 24 }}>
        <h2>Your workspaces</h2>
        {workspaces.length === 0 ? (
          <div style={{ padding: "16px", border: "1px dashed #ccc", borderRadius: 6, textAlign: "center", background: "#fafafa" }}>
            <p style={{ margin: "0 0 8px 0" }}>No workspaces yet.</p>
            <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Create your first workspace using the form above to get started.</p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {workspaces.map((w) => (
              <li
                key={w.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  marginBottom: 8,
                  background: w.id === selectedWorkspace?.id ? "#f5f5f5" : "#fff",
                  cursor: "pointer",
                }}
                onClick={() => selectWorkspace(w)}
              >
                <strong>{w.name}</strong>
                <span
                  style={{
                    fontSize: 12,
                    color: w.ownerId === (useAuthStore.getState().user?.id ?? "")
                      ? "green"
                      : "#666",
                  }}
                >
                  {w.ownerId === (useAuthStore.getState().user?.id ?? "")
                    ? "owner"
                    : "member"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteWorkspace(w.id);
                  }}
                  style={{
                    marginLeft: "auto",
                    color: "red",
                    background: "none",
                    border: "1px solid red",
                    borderRadius: 4,
                    padding: "2px 8px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <DeleteWorkspaceDialog />
    </div>
  );
}
