import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../store/workspaces";
import { useDashboardStore } from "../store/dashboard";
import { useAuthStore } from "../store/auth";

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
  onClick?: () => void;
}

function StatCard({ label, value, color, highlight = false, onClick }: StatCardProps) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        border: `1px solid ${highlight ? color : "#ddd"}`,
        background: highlight ? "#fef2f2" : "#ffffff",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.1s",
      }}
      onClick={onClick}
    >
      <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: highlight ? "#dc2626" : color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { isAuthenticated } = useAuthStore();
  const { selectedWorkspace } = useWorkspaceStore();
  const { stats, loading, error, clearError, fetchDashboard } = useDashboardStore();

  const workspace = selectedWorkspace ?? undefined;
  const wsId = workspaceId ?? workspace?.id;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (wsId) {
      fetchDashboard(wsId);
    }
  }, [isAuthenticated, wsId, fetchDashboard, navigate]);

  if (loading && !stats) {
    return <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>Loading dashboard...</div>;
  }

  if (!wsId) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Dashboard</h1>
        <p>Select a workspace to view its dashboard.</p>
      </div>
    );
  }

  const workspaceName = workspace?.name ?? "Workspace";
  const overdueCount = stats?.overdue ?? 0;

  const goToTasks = (filter: string) => {
    navigate(`/w/${wsId}/my-tasks?${filter}`, { replace: true });
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#111827" }}>
          Dashboard — {workspaceName}
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate(`/w/${wsId}/projects`, { replace: true })}
            style={{
              padding: "8px 16px",
              border: "1px solid #2563eb",
              borderRadius: 6,
              background: "#ffffff",
              color: "#2563eb",
              fontSize: 14,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Projects
          </button>
          <button
            onClick={() => navigate("/workspaces", { replace: true })}
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
            Back to Workspaces
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Total tasks"
          value={stats?.total ?? 0}
          color="#2563eb"
          onClick={() => goToTasks("status=todo,in-progress,done")}
        />
        <StatCard
          label="To do"
          value={
            (stats?.total ?? 0) -
            (stats?.completed ?? 0) -
            (stats?.inProgress ?? 0) -
            (stats?.overdue ?? 0)
          }
          color="#6b7280"
          onClick={() => goToTasks("status=todo")}
        />
        <StatCard
          label="In progress"
          value={stats?.inProgress ?? 0}
          color="#f59e0b"
          onClick={() => goToTasks("status=in_progress")}
        />
        <StatCard
          label="Completed"
          value={stats?.completed ?? 0}
          color="#16a34a"
          onClick={() => goToTasks("status=done")}
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          color="#dc2626"
          highlight={overdueCount > 0}
          onClick={() => goToTasks("dueBefore=today&status=todo,in_progress")}
        />
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, padding: 20, border: "1px solid #e5e7eb", borderRadius: 8, background: "#ffffff" }}>
          <h3 style={{ marginTop: 0, fontSize: 16, color: "#111827" }}>Project progress</h3>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>
            Select a workspace with projects to see progress cards here.
          </p>
        </div>
        <div style={{ flex: 1, padding: 20, border: "1px solid #e5e7eb", borderRadius: 8, background: "#ffffff" }}>
          <h3 style={{ marginTop: 0, fontSize: 16, color: "#111827" }}>Quick actions</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => navigate(`/w/${wsId}/projects`, { replace: true })}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              New project
            </button>
            <button
              onClick={() => navigate(`/w/${wsId}/projects`, { replace: true })}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "#ffffff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              New task
            </button>
          </div>
        </div>
      </div>

      {overdueCount > 0 && (
        <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontWeight: 600, fontSize: 14 }}>
          ⚠ {overdueCount} overdue task{overdueCount !== 1 ? "s" : ""} require attention
        </div>
      )}
    </div>
  );
}