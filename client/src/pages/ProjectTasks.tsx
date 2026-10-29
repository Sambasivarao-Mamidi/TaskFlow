import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectStore } from "../store/projects";
import { useTaskStore } from "../store/tasks";
import { useAuthStore } from "../store/auth";
import { CreateTaskForm } from "../components/CreateTaskForm";
import { TaskListItem } from "../components/TaskListItem";

export default function ProjectTasks() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { isAuthenticated } = useAuthStore();
  const { selectedProject } = useProjectStore();
  const {
    tasks,
    nextCursor,
    loading,
    error,
    clearError,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  } = useTaskStore();

  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (projectId) {
      fetchTasks(projectId);
      setHasMore(true);
    }
  }, [isAuthenticated, projectId, fetchTasks, navigate]);

  useEffect(() => {
    setHasMore(!!nextCursor);
  }, [nextCursor]);

  if (loading && tasks.length === 0) {
    return <div style={{ padding: 24 }}>Loading tasks...</div>;
  }

  const project = selectedProject || undefined;

  if (!projectId && !project) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Tasks</h1>
        <p>Select a project to view its tasks.</p>
      </div>
    );
  }

  const pid = projectId ?? project!.id;

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1>Tasks — {project?.name ?? "Project"}</h1>
        <button
          onClick={() => navigate(`/projects/${pid}/ai-breakdown`)}
          style={{ padding: "8px 14px", cursor: "pointer" }}
        >
          AI Task Breakdown
        </button>
      </div>
      {error && (
        <div style={{ color: "red", marginBottom: 12 }}>
          {error}
          <button onClick={clearError} style={{ marginLeft: 8 }}>dismiss</button>
        </div>
      )}
      <CreateTaskForm
        projectId={pid}
        onCreate={(input) => createTask(pid, input)}
        loading={loading}
      />
      <div style={{ marginBottom: 12 }}>
        {tasks.length === 0 ? (
          <div style={{ padding: "16px", border: "1px dashed #ccc", borderRadius: 6, textAlign: "center", background: "#fafafa" }}>
            <p style={{ margin: "0 0 8px 0" }}>No tasks yet.</p>
            <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Create your first task using the form above, or use AI Task Breakdown to generate subtasks.</p>
          </div>
        ) : (
          tasks.map((t) => (
            <TaskListItem
              key={t.id}
              task={t}
              onUpdate={updateTask}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>
      {hasMore && nextCursor && (
        <button
          onClick={() => fetchTasks(pid, nextCursor)}
          disabled={loading}
          style={{ padding: "6 14", cursor: "pointer", border: "1px solid #ccc", borderRadius: 4, background: "#fff" }}
        >
          Load more
        </button>
      )}
    </div>
  );
}
