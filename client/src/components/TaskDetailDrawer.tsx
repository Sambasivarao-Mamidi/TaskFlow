import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTaskStore } from "../store/tasks";
import AIBreakdownPanel from "./AIBreakdownPanel";
import SubtaskProgress from "./SubtaskProgress";

interface TaskDetailDrawerProps {
  task: any;
  onClose: () => void;
  onRefresh: () => void;
}

export default function TaskDetailDrawer({
  task,
  onClose,
  onRefresh,
}: TaskDetailDrawerProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { selectedTask, subtasks, drawerOpen, aiLoading, aiError, closeTaskDrawer, clearError } =
    useTaskStore();
  const wsId = workspaceId ?? "";

  const [tab, setTab] = useState<"details" | "comments" | "ai">("details");
  const [isParent, setIsParent] = useState(false);
  const [subtaskCount, setSubtaskCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    // Load subtask info for this task
    const loadSubtaskInfo = async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}/subtasks`);
        if (res.ok) {
          const data = await res.json();
          setIsParent(data.isParent ?? false);
          setSubtaskCount(data.subtaskCount ?? 0);
          setCompletedCount(data.completedCount ?? 0);
        }
      } catch {
        // Subtask endpoint may not exist yet, that's OK
      }
    };
    loadSubtaskInfo();
  }, [task.id]);

  const handleStatusChange = async (newStatus: string) => {
    await useTaskStore.getState().updateTask(task.id, {
      status: newStatus as any,
    });
    onRefresh();
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    await useTaskStore.getState().deleteTask(task.id);
    onClose();
    onRefresh();
  };

  const priorityColors: Record<string, string> = {
    low: "#6b7280",
    medium: "#f59e0b",
    high: "#dc2626",
    urgent: "#7c2d12",
  };

  const isDone = task.status === "done";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "420px",
        background: "#ffffff",
        borderLeft: "1px solid #e5e7eb",
        boxShadow: "-4px 0 12px -4px rgba(0, 0, 0, 0.1)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        animation: "slideIn 0.2s ease-out",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
          Task details
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            color: "#6b7280",
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
        {[
          { id: "details" as const, label: "Details" },
          { id: "comments" as const, label: "Comments" },
          { id: "ai" as const, label: "AI Breakdown" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderBottom: `2px solid ${tab === t.id ? "#2563eb" : "transparent"}`,
              background: tab === t.id ? "#f8fafc" : "#ffffff",
              color: tab === t.id ? "#2563eb" : "#6b7280",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {tab === "details" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>
                Title
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{task.title}</div>
            </div>

            {task.description && (
              <div>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>
                  Description
                </div>
                <div style={{ fontSize: 14, color: "#374151", whiteSpace: "pre-wrap" }}>{task.description}</div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>
                  Status
                </div>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    background: "#ffffff",
                  }}
                >
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>
                  Priority
                </div>
                <select
                  value={task.priority}
                  onChange={(e) => {
                    useTaskStore.getState().updateTask(task.id, { priority: e.target.value as any });
                    onRefresh();
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    background: "#ffffff",
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {task.dueDate && (
              <div>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>
                  Due date
                </div>
                <div style={{ fontSize: 14, color: "#374151", fontWeight: isDone ? "normal" : "600" }}>
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              </div>
            )}

            {task.assigneeId && (
              <div>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>
                  Assignee
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                    {String(task.assigneeId).charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14, color: "#374151" }}>Assigned</span>
                </div>
              </div>
            )}

            {isParent && (
              <SubtaskProgress
                taskId={task.id}
                subtaskCount={subtaskCount}
                completedCount={completedCount}
              />
            )}
          </div>
        )}

        {tab === "comments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 600, marginBottom: 12 }}>
              Activity
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 200 }}>
              <div style={{ display: "flex", gap: 10, padding: 12, background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>
                  Y
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>You</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>{new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="Add a comment…"
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              />
              <button
                disabled
                style={{
                  padding: "10px 20px",
                  background: "#94a3b8",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "not-allowed",
                  fontSize: 13,
                }}
              >
                Post
              </button>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
              Comments coming soon — task activity will appear here.
            </p>
          </div>
        )}

        {tab === "ai" && (
          <AIBreakdownPanel
            taskId={task.id}
            projectId={task.projectId}
            taskTitle={task.title}
            taskDescription={task.description}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: 16, borderTop: "1px solid #e5e7eb", display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={handleDelete}
          disabled={aiLoading}
          style={{
            padding: "8px 16px",
            background: "#ffffff",
            border: "1px solid #dc2626",
            color: "#dc2626",
            borderRadius: 6,
            fontSize: 13,
            cursor: aiLoading ? "not-allowed" : "pointer",
          }}
        >
          Delete task
        </button>
      </div>
    </div>
  );
}