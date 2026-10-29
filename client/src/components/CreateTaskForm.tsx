import { useState } from "react";
import type { TaskStatus, TaskPriority } from "@taskflow/shared";
import { useWorkspaceStore } from "../store/workspaces";

export interface CreateTaskFormProps {
  projectId: string;
  onCreate: (input: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | null;
    assigneeId?: string | null;
  }) => void;
  loading: boolean;
}

export function CreateTaskForm({ projectId, onCreate, loading }: CreateTaskFormProps) {
  const { selectedWorkspace } = useWorkspaceStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState("");

  const members = selectedWorkspace?.members || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: dueDate || null,
      assigneeId: assigneeId || null,
    });
  };

  return (
    <div style={{ marginBottom: 20, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Create task</h3>
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Title</label>
          <input
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={2}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13 }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} disabled={loading} style={{ padding: 6, border: "1px solid #ccc", borderRadius: 4 }}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13 }}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} disabled={loading} style={{ padding: 6, border: "1px solid #ccc", borderRadius: 4 }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Due date</label>
          <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={loading} style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Assignee ID</label>
          <input value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} disabled={loading} style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }} />
        </div>
        <button type="submit" disabled={loading || !title.trim()} style={{ padding: "8 16", cursor: "pointer" }}>
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
    </div>
  );
}
