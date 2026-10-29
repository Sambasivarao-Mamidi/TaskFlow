import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useWorkspaceStore } from "../store/workspaces";

interface TopBarProps {
  user: any;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
  workspaces: any[];
  selectedWorkspace: any | null;
  selectWorkspace: (workspace: any | null) => void;
  currentWorkspaceId: string;
  fetchWorkspaces: () => void;
}

export default function TopBar({
  user,
  sidebarOpen,
  setSidebarOpen,
  onLogout,
  workspaces,
  selectedWorkspace,
  selectWorkspace,
  currentWorkspaceId,
  fetchWorkspaces,
}: TopBarProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  const activeWorkspaceId = workspaceId || currentWorkspaceId;
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const handleWorkspaceSelect = (workspace: any) => {
    selectWorkspace(workspace);
    setWorkspaceDropdownOpen(false);
    navigate(`/w/${workspace.id}/dashboard`, { replace: true });
  };

  const handleCreateWorkspace = () => {
    setWorkspaceDropdownOpen(false);
    navigate("/workspaces");
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#2563eb",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          onClick={() => {
            if (activeWorkspaceId) {
              navigate(`/w/${activeWorkspaceId}/dashboard`, { replace: true });
            }
          }}
        >
          <span style={{ fontSize: 20 }}>✓</span> TaskFlow
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            position: "relative",
            display: "inline-block",
          }}
        >
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              background: "#ffffff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {activeWorkspace ? (
              <>
                <span style={{ fontWeight: 500 }}>{activeWorkspace.name}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </>
            ) : (
              <span style={{ fontWeight: 500, color: "#6b7280" }}>Workspace</span>
            )}
          </button>
          {workspaceDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: 40,
                right: 0,
                width: 240,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                zIndex: 50,
              }}
            >
              <div style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>
                  Switch workspace
                </div>
                {workspaces.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontSize: 14,
                      color: "#374151",
                      background: w.id === activeWorkspaceId ? "#f8fafc" : "#ffffff",
                      borderBottom: w.id !== workspaces[workspaces.length - 1].id ? "1px solid #f1f5f9" : "none",
                    }}
                    onClick={() => handleWorkspaceSelect(w)}
                  >
                    {w.name}
                  </div>
                ))}
                <div
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontSize: 14,
                    color: "#2563eb",
                    fontWeight: 500,
                    borderTop: "1px solid #f1f5f9",
                    marginTop: 4,
                  }}
                  onClick={handleCreateWorkspace}
                >
                  + Create new workspace
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: "#374151",
              }}
            >
              <span>{user.name}</span>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            style={{
              padding: "6px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              background: "#ffffff",
              color: "#374151",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}