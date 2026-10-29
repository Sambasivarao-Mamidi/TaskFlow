import { Link, useParams, useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../store/workspaces";

interface SidebarProps {
  workspaces: any[];
  selectedWorkspace: any | null;
  selectWorkspace: (workspace: any | null) => void;
  currentWorkspaceId: string;
  fetchWorkspaces: () => void;
  onClose: () => void;
}

export default function Sidebar({
  workspaces,
  selectedWorkspace,
  selectWorkspace,
  currentWorkspaceId,
  fetchWorkspaces,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const activeWorkspaceId = workspaceId || currentWorkspaceId;

  const isActive = (path: string) => {
    if (!activeWorkspaceId) return false;
    return window.location.pathname === `/w/${activeWorkspaceId}${path}`;
  };

  return (
    <aside
      style={{
        width: 260,
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        position: "fixed",
        left: 0,
        top: 60,
        bottom: 0,
        zIndex: 50,
      }}
    >
      <div style={{ padding: 20, borderBottom: "1px solid #e5e7eb" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#2563eb",
            cursor: "pointer",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          onClick={() => navigate(`/w/${activeWorkspaceId}/dashboard`, { replace: true })}
        >
          <span style={{ fontSize: 20 }}>✓</span> TaskFlow
        </div>

        <div style={{ marginBottom: 16, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 600 }}>
          Workspaces
        </div>
        {workspaces.map((w) => (
          <div
            key={w.id}
            style={{
              padding: 10,
              borderRadius: 6,
              marginBottom: 6,
              cursor: "pointer",
              background:
                w.id === selectedWorkspace?.id || w.id === activeWorkspaceId
                  ? "#dbeafe"
                  : "#ffffff",
              border: `1px solid ${
                w.id === selectedWorkspace?.id || w.id === activeWorkspaceId
                  ? "#2563eb"
                  : "#e5e7eb"
              }`,
              color: "#111827",
              fontSize: 14,
              fontWeight: 500,
            }}
            onClick={() => {
              selectWorkspace(w);
              navigate(`/w/${w.id}/dashboard`, { replace: true });
            }}
          >
            {w.name}
          </div>
        ))}
        {workspaces.length === 0 && (
          <div style={{ padding: 10, fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>
            No workspaces yet
          </div>
        )}
        <button
          onClick={() => {
            fetchWorkspaces();
            navigate("/workspaces");
          }}
          style={{
            padding: "8px 16px",
            margin: "auto 16px 16px 16px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#ffffff",
            color: "#374151",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Manage workspaces
        </button>
      </div>

      <nav style={{ padding: 12, flex: 1 }}>
        <div style={{ marginBottom: 12, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 600 }}>
          Navigation
        </div>
        {[
          { label: "Dashboard", path: "dashboard", icon: "📊" },
          { label: "My Tasks", path: "my-tasks", icon: "✅" },
          { label: "Projects", path: "projects", icon: "📁" },
          { label: "AI", path: "ai", icon: "🤖" },
          { label: "Settings", path: "settings", icon: "⚙️" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              marginBottom: 6,
              cursor: "pointer",
              background: isActive(`/${item.path}`) ? "#dbeafe" : "#ffffff",
              border: `1px solid ${
                isActive(`/${item.path}`) ? "#2563eb" : "#e5e7eb"
              }`,
              color: isActive(`/${item.path}`) ? "#2563eb" : "#374151",
              fontSize: 14,
              fontWeight: isActive(`/${item.path}`) ? 600 : 400,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
            onClick={() => {
              if (activeWorkspaceId) {
                navigate(`/w/${activeWorkspaceId}/${item.path}`, { replace: true });
              }
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}