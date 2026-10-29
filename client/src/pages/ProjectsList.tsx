import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProjectStore } from "../store/projects";
import { useWorkspaceStore } from "../store/workspaces";
import { useAuthStore } from "../store/auth";

export default function ProjectsList() {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { isAuthenticated } = useAuthStore();
  const { selectedWorkspace } = useWorkspaceStore();
  const {
    projects,
    loading,
    error,
    clearError,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    selectProject,
  } = useProjectStore();

  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("active");
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const workspace = selectedWorkspace ?? undefined;
  const wsId = workspaceId ?? workspace?.id;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (wsId) {
      fetchProjects(wsId);
    }
  }, [isAuthenticated, wsId, fetchProjects, navigate]);

  if (loading && projects.length === 0) {
    return <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>Loading projects...</div>;
  }

  if (!wsId) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Projects</h1>
        <p>Select a workspace to view its projects.</p>
      </div>
    );
  }

  const workspaceName = workspace?.name ?? "Workspace";
  const filtered = projects.filter((p) => {
    if (filterStatus === "all") return true;
    return p.status === filterStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreating(true);
    await createProject(wsId, newProjectName.trim());
    setNewProjectName("");
    setNewProjectDesc("");
    setCreating(false);
  };

  const handleArchive = async (id: string) => {
    await updateProject(id, { status: "archived" });
  };

  const handleRestore = async (id: string) => {
    await updateProject(id, { status: "active" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project? All tasks will be removed.")) return;
    await deleteProject(id);
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#111827" }}>
            Projects — {workspaceName}
          </h1>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Organize tasks into projects within your workspace.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
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
              fontWeight: 500,
            }}
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => {
              setCreating(!creating);
            }}
            style={{
              padding: "8px 16px",
              border: "1px solid #2563eb",
              borderRadius: 6,
              background: creating ? "#eff6ff" : "#ffffff",
              color: "#2563eb",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {creating ? "Cancel" : "New project"}
          </button>
        </div>
      </div>
      {error && (
        <div style={{ color: "red", marginBottom: 16, padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6 }}>
          {error}
          <button onClick={clearError} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "red" }}>
            dismiss
          </button>
        </div>
      )}

      {creating && (
        <div style={{ marginBottom: 20, padding: 16, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
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
              disabled={!newProjectName.trim()}
              style={{
                padding: "10px 20px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Create
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        { (["all", "active", "archived"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: "6px 14px",
              border: `1px solid ${filterStatus === status ? "#2563eb" : "#d1d5db"}`,
              borderRadius: 6,
              background: filterStatus === status ? "#2563eb" : "#ffffff",
              color: filterStatus === status ? "#ffffff" : "#374151",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
          <h2 style={{ marginBottom: 8, color: "#111827" }}>
            {filterStatus === "archived" ? "No archived projects" : "No projects yet"}
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>
            {filterStatus === "archived"
              ? "Archived projects will appear here."
              : "Create your first project to start organizing tasks."}
          </p>
          {filterStatus !== "archived" && (
            <button
              onClick={() => setCreating(true)}
              style={{
                padding: "10px 20px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#ffffff",
                cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
              onClick={() => navigate(`/w/${wsId}/projects/${p.id}`, { replace: true })}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#111827" }}>
                  {p.name}
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: p.status === "active" ? "#dcfce7" : "#fecaca",
                    color: p.status === "active" ? "#16a34a" : "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {p.status === "active" ? "Active" : "Archived"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12, lineHeight: 1.5 }}>
                {p.description || "No description yet."}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#94a3b8" }}>
                <span>Tasks: 0</span>
                <span>Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filterStatus === "archived" && projects.some((p) => p.status === "archived") && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, color: "#111827", marginBottom: 12 }}>Archived projects</h3>
          {projects
            .filter((p) => p.status === "archived")
            .map((p) => (
              <div
                key={p.id}
                style={{
                  padding: "10px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  background: "#f8fafc",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 13, color: "#6b7280" }}>{p.name}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(p.id);
                    }}
                    style={{
                      padding: "4px 10px",
                      background: "#ffffff",
                      border: "1px solid #16a34a",
                      color: "#16a34a",
                      borderRadius: 4,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Restore
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.id);
                    }}
                    style={{
                      padding: "4px 10px",
                      background: "#ffffff",
                      border: "1px solid #dc2626",
                      color: "#dc2626",
                      borderRadius: 4,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}