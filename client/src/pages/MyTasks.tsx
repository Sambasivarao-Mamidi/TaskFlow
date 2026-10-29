import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTaskStore } from "../store/tasks";
import { useProjectStore } from "../store/projects";
import { useWorkspaceStore } from "../store/workspaces";
import { useAuthStore } from "../store/auth";
import TaskDetailDrawer from "../components/TaskDetailDrawer";

export default function MyTasks() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { isAuthenticated } = useAuthStore();
  const { selectedWorkspace } = useWorkspaceStore();
  const {
    tasks,
    nextCursor,
    loading,
    error,
    clearError,
    fetchTasks,
    updateTask,
    deleteTask,
  } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterDue, setFilterDue] = useState("all");
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const workspace = selectedWorkspace ?? undefined;
  const wsId = workspaceId ?? workspace?.id;

  const loadTasks = useCallback(() => {
    if (!wsId) return;
    const status = searchParams.get("status") || "all";
    const dueBefore = searchParams.get("dueBefore") || "";
    const project = searchParams.get("project") || "all";

    setFilterStatus(status === "all" ? "all" : status);
    setFilterProject(project === "all" ? "all" : project);
    if (dueBefore) setFilterDue(dueBefore);
    setOffset(0);
    setHasMore(true);

    const params: Record<string, string> = {};
    if (status && status !== "all") params.status = status;
    if (project && project !== "all") params.project = project;
    if (dueBefore) params.dueBefore = dueBefore;

    fetchTasks(wsId, undefined, params);
  }, [searchParams, wsId, fetchTasks]);

  useEffect(() => {
    loadTasks();

    const handleSubtasksCreated = () => {
      loadTasks();
    };
    window.addEventListener("taskflow:subtasks-created", handleSubtasksCreated as any);
    return () => {
      window.removeEventListener("taskflow:subtasks-created", handleSubtasksCreated as any);
    };
  }, [loadTasks]);

  if (loading && tasks.length === 0) {
    return <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>Loading tasks...</div>;
  }

  if (!wsId) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>My Tasks</h1>
        <p>Select a workspace to view your tasks.</p>
      </div>
    );
  }

  const workspaceName = workspace?.name ?? "Workspace";
  const myTasks = tasks.filter((t) => t.assigneeId === useAuthStore.getState().user?.id);

  const statusCounts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = tasks.filter(
    (t) =>
      t.dueDate && new Date(t.dueDate) < today && t.status !== "done"
  ).length;
  const dueToday = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate).toDateString() === today.toDateString() &&
      t.status !== "done"
  ).length;

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await updateTask(taskId, { status: newStatus as any });
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    await deleteTask(taskId);
    if (openTaskId === taskId) {
      setOpenTaskId(null);
    }
  };

  const handleLoadMore = () => {
    setOffset((prev) => prev + 1);
  };

  const updateUrlFilters = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "all" || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  const activeFilterCount =
    (filterStatus !== "all" ? 1 : 0) +
    (filterPriority !== "all" ? 1 : 0) +
    (filterProject !== "all" ? 1 : 0) +
    (filterDue !== "all" ? 1 : 0);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#111827" }}>
            My Tasks — {workspaceName}
          </h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
            Tasks assigned to you across all projects in this workspace.
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

      <div style={{ marginBottom: 20, padding: 16, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>
            Status
          </div>
          {[
            { label: "All", value: "all", count: tasks.length },
            { label: "To do", value: "todo", count: statusCounts.todo },
            { label: "In progress", value: "in_progress", count: statusCounts.in_progress },
            { label: "Done", value: "done", count: statusCounts.done },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilterStatus(f.value);
                updateUrlFilters({ status: f.value });
              }}
              style={{
                padding: "6px 12px",
                border: `1px solid ${filterStatus === f.value ? "#2563eb" : "#d1d5db"}`,
                borderRadius: 6,
                background: filterStatus === f.value ? "#2563eb" : "#ffffff",
                color: filterStatus === f.value ? "#ffffff" : "#374151",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>
            Quick filters
          </div>
          <button
            onClick={() => {
              setFilterDue("today");
              updateUrlFilters({ dueBefore: today.toISOString().split("T")[0], status: "todo,in_progress" });
            }}
            style={{
              padding: "6px 12px",
              border: `1px solid ${filterDue === "today" ? "#dc2626" : "#d1d5db"}`,
              borderRadius: 6,
              background: filterDue === "today" ? "#fef2f2" : "#ffffff",
              color: filterDue === "today" ? "#dc2626" : "#374151",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Due today ({dueToday})
          </button>
          <button
            onClick={() => {
              setFilterDue("overdue");
              updateUrlFilters({ dueBefore: today.toISOString().split("T")[0], status: "todo,in_progress" });
            }}
            style={{
              padding: "6px 12px",
              border: `1px solid ${filterDue === "overdue" ? "#dc2626" : "#d1d5db"}`,
              borderRadius: 6,
              background: filterDue === "overdue" ? "#fef2f2" : "#ffffff",
              color: filterDue === "overdue" ? "#dc2626" : "#374151",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Overdue ({overdue})
          </button>
          <button
            onClick={() => {
              setFilterDue("no-due");
              updateUrlFilters({});
            }}
            style={{
              padding: "6px 12px",
              border: `1px solid ${filterDue === "no-due" ? "#6b7280" : "#d1d5db"}`,
              borderRadius: 6,
              background: filterDue === "no-due" ? "#f3f4f6" : "#ffffff",
              color: filterDue === "no-due" ? "#6b7280" : "#374151",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            No due date
          </button>
          <button
            onClick={() => {
              setFilterDue("unassigned");
              updateUrlFilters({});
            }}
            style={{
              padding: "6px 12px",
              border: `1px solid ${filterDue === "unassigned" ? "#6b7280" : "#d1d5db"}`,
              borderRadius: 6,
              background: filterDue === "unassigned" ? "#f3f4f6" : "#ffffff",
              color: filterDue === "unassigned" ? "#6b7280" : "#374151",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Unassigned
          </button>
        </div>

        {activeFilterCount > 0 && (
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {filterStatus !== "all" && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  background: "#fef3c7",
                  color: "#d97706",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {filterStatus} <span onClick={() => { setFilterStatus("all"); updateUrlFilters({}); }} style={{ cursor: "pointer", marginLeft: 4 }}>×</span>
              </span>
            )}
            {filterDue === "today" && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Due today <span onClick={() => { setFilterDue("all"); updateUrlFilters({}); }} style={{ cursor: "pointer", marginLeft: 4 }}>×</span>
              </span>
            )}
            {filterDue === "overdue" && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Overdue <span onClick={() => { setFilterDue("all"); updateUrlFilters({}); }} style={{ cursor: "pointer", marginLeft: 4 }}>×</span>
              </span>
            )}
            <button
              onClick={() => {
                setFilterStatus("all");
                setFilterPriority("all");
                setFilterProject("all");
                setFilterDue("all");
                updateUrlFilters({});
              }}
              style={{
                padding: "4px 10px",
                background: "#ffffff",
                border: "1px solid #d1d5db",
                color: "#374151",
                borderRadius: 4,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {myTasks.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
            <h2 style={{ marginBottom: 8, color: "#111827" }}>No tasks assigned to you</h2>
            <p style={{ color: "#6b7280", marginBottom: 16 }}>
              Tasks assigned to you will appear here. Create tasks in a project or ask to be assigned.
            </p>
            <button
              onClick={() => navigate(`/w/${wsId}/projects`, { replace: true })}
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
              Go to Projects
            </button>
          </div>
        ) : (
          myTasks.map((t) => (
            <button
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#ffffff",
                marginBottom: 8,
                cursor: "pointer",
                textAlign: "left",
              }}
              onClick={() => {
                useTaskStore.getState().openTaskDrawer(t);
                setOpenTaskId(t.id);
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "#111827", fontSize: 15, marginBottom: 2 }}>
                  {t.title}
                </div>
                {t.description && (
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                    {t.description}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "#f3f4f6",
                      color: "#374151",
                      fontSize: 11,
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {t.priority}
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    Status: {t.status.replace("_", " ")}
                  </span>
                  {t.dueDate && (
                    <span
                      style={{
                        fontSize: 11,
                        color:
                          new Date(t.dueDate) < today && t.status !== "done"
                            ? "#dc2626"
                            : "#94a3b8",
                        fontWeight:
                          new Date(t.dueDate) < today && t.status !== "done"
                            ? 600
                            : 400,
                      }}
                    >
                      Due {new Date(t.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(
                      t.id,
                      t.status === "done" ? "todo" : "done"
                    );
                  }}
                  style={{
                    padding: "6px 12px",
                    background: t.status === "done" ? "#dcfce7" : "#ffffff",
                    border: `1px solid ${t.status === "done" ? "#16a34a" : "#d1d5db"}`,
                    color: t.status === "done" ? "#16a34a" : "#374151",
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {t.status === "done" ? "Reopen" : "Done"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(t.id);
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "#ffffff",
                    border: "1px solid #d1d5db",
                    color: "#374151",
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </button>
          ))
        )}
        {hasMore && nextCursor && (
          <button
            onClick={handleLoadMore}
            disabled={loading}
            style={{
              padding: "8px 16px",
              border: "1px solid #2563eb",
              borderRadius: 6,
              background: "#ffffff",
              color: "#2563eb",
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 500,
            }}
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
      {openTaskId && (
        <TaskDetailDrawer
          task={tasks.find((t) => t.id === openTaskId)!}
          onClose={() => setOpenTaskId(null)}
          onRefresh={loadTasks}
        />
      )}
    </div>
  );
}