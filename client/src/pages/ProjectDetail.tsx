import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectStore } from "../store/projects";
import { useTaskStore } from "../store/tasks";
import { useWorkspaceStore } from "../store/workspaces";
import { useAuthStore } from "../store/auth";
import TaskDetailDrawer from "../components/TaskDetailDrawer";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const { isAuthenticated } = useAuthStore();
  const { selectedWorkspace } = useWorkspaceStore();
  const { selectedProject, fetchProjects, selectProject, loading: projectsLoading } =
    useProjectStore();
  const { tasks, loading: tasksLoading, fetchTasks, createTask } = useTaskStore();

  const [view, setView] = useState<"board" | "list">("board");
  const [creating, setCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const workspace = selectedWorkspace ?? undefined;
  const project = selectedProject ?? undefined;
  const wsId = workspaceId ?? workspace?.id;
  const pid = projectId ?? project?.id;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (wsId && !projectsLoading) {
      fetchProjects(wsId);
    }
  }, [isAuthenticated, wsId, fetchProjects, projectsLoading, navigate]);

  useEffect(() => {
    if (!pid) return;
    if (!tasksLoading) {
      fetchTasks(pid);
    }

    const handleSubtasksCreated = () => {
      if (pid) {
        fetchTasks(pid);
      }
    };
    window.addEventListener("taskflow:subtasks-created", handleSubtasksCreated as any);
    return () => {
      window.removeEventListener("taskflow:subtasks-created", handleSubtasksCreated as any);
    };
  }, [pid, fetchTasks, tasksLoading]);

  if (projectsLoading || tasksLoading) {
    return <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>Loading...</div>;
  }

  if (!wsId) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Project</h1>
        <p>Select a workspace to view its projects.</p>
      </div>
    );
  }

  if (!pid || !project) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Project</h1>
        <p>Project not found.</p>
        <button
          onClick={() => navigate(`/w/${wsId}/projects`, { replace: true })}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const projectName = project.name;
  const projectDesc = project.description;
  const projectStatus = project.status;

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const handleStatusChange = async (taskId: string, newStatus: "todo" | "in_progress" | "done") => {
    await useTaskStore.getState().updateTask(taskId, { status: newStatus });
  };

  const onRefresh = () => {
    if (pid) {
      fetchTasks(pid);
    }
  };
  const [error, setError] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    await useTaskStore.getState().deleteTask(taskId);
    if (openTaskId === taskId) {
      setOpenTaskId(null);
    }
    onRefresh();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setCreating(true);
    try {
      await createTask(pid, {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim() || undefined,
      });
      setNewTaskTitle("");
      setNewTaskDesc("");
      setCreating(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create task");
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#111827" }}>
            {projectName}
          </h1>
          {projectDesc && (
            <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>{projectDesc}</p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate(`/w/${wsId}/projects`, { replace: true })}
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
            Back to Projects
          </button>
          <button
            onClick={() => setCreating(!creating)}
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
            New task
          </button>
        </div>
      </div>
      {error && (
        <div style={{ color: "red", marginBottom: 16, padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6 }}>
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "red" }}>
            dismiss
          </button>
        </div>
      )}

      {creating && (
        <div style={{ marginBottom: 20, padding: 16, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <form onSubmit={handleCreateTask} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              placeholder="Task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
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
              disabled={!newTaskTitle.trim()}
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

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => setView("board")}
          style={{
            padding: "8px 16px",
            border: `1px solid ${view === "board" ? "#2563eb" : "#d1d5db"}`,
            borderRadius: 6,
            background: view === "board" ? "#2563eb" : "#ffffff",
            color: view === "board" ? "#ffffff" : "#374151",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          📋 Board
        </button>
        <button
          onClick={() => setView("list")}
          style={{
            padding: "8px 16px",
            border: `1px solid ${view === "list" ? "#2563eb" : "#d1d5db"}`,
            borderRadius: 6,
            background: view === "list" ? "#2563eb" : "#ffffff",
            color: view === "list" ? "#ffffff" : "#374151",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          📄 List
        </button>
      </div>

      {view === "board" ? (
        <div style={{ display: "flex", gap: 16 }}>
          <BoardColumn
            title="To do"
            tasks={todoTasks}
            color="#6b7280"
            onStatusChange={(id) => handleStatusChange(id, "todo")}
            projectId={pid}
            workspaceId={wsId}
            onTaskClick={(t) => {
              useTaskStore.getState().openTaskDrawer(t);
              setOpenTaskId(t.id);
            }}
          />
          <BoardColumn
            title="In progress"
            tasks={inProgressTasks}
            color="#f59e0b"
            onStatusChange={(id) => handleStatusChange(id, "in_progress")}
            projectId={pid}
            workspaceId={wsId}
            onTaskClick={(t) => {
              useTaskStore.getState().openTaskDrawer(t);
              setOpenTaskId(t.id);
            }}
          />
          <BoardColumn
            title="Done"
            tasks={doneTasks}
            color="#16a34a"
            onStatusChange={(id) => handleStatusChange(id, "done")}
            projectId={pid}
            workspaceId={wsId}
            onTaskClick={(t) => {
              useTaskStore.getState().openTaskDrawer(t);
              setOpenTaskId(t.id);
            }}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
              No tasks yet. Create your first task above.
            </div>
          ) : (
            tasks.map((t) => (
              <button
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  background: "#ffffff",
                  marginBottom: 8,
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
                onClick={() => {
                  useTaskStore.getState().openTaskDrawer(t);
                  setOpenTaskId(t.id);
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "#111827" }}>{t.title}</div>
                  {t.description && (
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                      {t.description}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#94a3b8" }}>
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
                  <button
                    onClick={() => handleStatusChange(t.id, t.status === "done" ? "todo" : "done")}
                    style={{
                      padding: "4px 10px",
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
                </div>
              </button>
            ))
          )}
        </div>
      )}
      {openTaskId && (
        <TaskDetailDrawer
          task={tasks.find((t) => t.id === openTaskId)!}
          onClose={() => setOpenTaskId(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

interface BoardColumnProps {
  title: string;
  tasks: any[];
  color: string;
  onStatusChange: (taskId: string, status: string) => void;
  projectId: string;
  workspaceId: string;
  onTaskClick: (task: any) => void;
}

function BoardColumn({
  title,
  tasks,
  color,
  onStatusChange,
  projectId,
  workspaceId,
  onTaskClick,
}: BoardColumnProps) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        flex: 1,
        minWidth: 260,
        background: "#f1f5f9",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: 12, background: "#ffffff", borderBottom: "1px solid #e5e7eb", borderRadius: "8px 8px 0 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#111827" }}>
            {title}
          </h3>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: color,
              background: `${color}1a`,
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            {tasks.length}
          </span>
        </div>
      </div>
      <div style={{ flex: 1, padding: 8, overflowY: "auto" }}>
        {tasks.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
            No tasks
          </div>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              style={{
                padding: 12,
                marginBottom: 8,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
              onClick={() => onTaskClick(t)}
            >
              <div style={{ fontWeight: 600, color: "#111827", fontSize: 14, marginBottom: 4 }}>
                {t.title}
              </div>
              {t.priority && (
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    padding: "1px 6px",
                    borderRadius: 3,
                    background:
                      t.priority === "high"
                        ? "#fecaca"
                        : t.priority === "medium"
                        ? "#fef3c7"
                        : "#dbeafe",
                    color:
                      t.priority === "high"
                        ? "#dc2626"
                        : t.priority === "medium"
                        ? "#d97706"
                        : "#2563eb",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  {t.priority}
                </div>
              )}
              {t.assigneeId && (
                <div style={{ fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#2563eb",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                    }}
                  >
                    {t.assigneeId.charAt(0).toUpperCase()}
                  </div>
                  Assigned
                </div>
              )}
              {t.dueDate && (
                <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>
                  Due {new Date(t.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}