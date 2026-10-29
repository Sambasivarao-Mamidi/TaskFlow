import type { TaskDto } from "@taskflow/shared";
import type { TaskStatus, TaskPriority } from "@taskflow/shared";

export interface TaskListItemProps {
  task: TaskDto;
  onUpdate: (id: string, updates: Partial<TaskDto>) => void;
  onDelete: (id: string) => void;
}

export function TaskListItem({ task, onUpdate, onDelete }: TaskListItemProps) {
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(task.title);
  const [status, setStatus] = React.useState<TaskStatus>(task.status);
  const [priority, setPriority] = React.useState<TaskPriority>(task.priority);

  const statusColor: Record<TaskStatus, string> = {
    todo: "#666",
    in_progress: "#2563eb",
    done: "#16a34a",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, marginBottom: 8, background: task.status === "done" ? "#f0fdf4" : "#fff" }}>
      {!editing ? (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{task.description}</div>
          </div>
          <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "#eee", color: "#333" }}>{task.priority}</span>
          <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "#e5e7eb", color: statusColor[task.status] }}>{task.status.replace("_", " ")}</span>
          <span style={{ fontSize: 11, color: "#888" }}>{task.assigneeId || "unassigned"}</span>
          <span style={{ fontSize: 11, color: "#888" }}>{task.dueDate || "-"}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setEditing(true)} style={{ padding: "4 8", border: "1px solid #ccc", background: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Edit</button>
            <button onClick={() => onDelete(task.id)} style={{ marginLeft: 4, padding: "4 8", color: "red", border: "1px solid red", background: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Delete</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 6, alignItems: "center" }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: 4, border: "1px solid #ccc", borderRadius: 4 }} />
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} style={{ padding: 4, border: "1px solid #ccc", borderRadius: 4 }}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} style={{ padding: 4, border: "1px solid #ccc", borderRadius: 4 }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button onClick={() => { onUpdate(task.id, { title, status, priority }); setEditing(false); }} style={{ padding: "4 10", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Save</button>
          <button onClick={() => setEditing(false)} style={{ marginLeft: 6, padding: "4 10", border: "1px solid #ccc", background: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Cancel</button>
        </>
      )}
    </div>
  );
}

import React from "react";
