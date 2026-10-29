import { useParams } from "react-router-dom";
import { useTaskStore } from "../store/tasks";

interface SubtaskProgressProps {
  taskId: string;
  subtaskCount: number;
  completedCount: number;
}

export default function SubtaskProgress({
  taskId,
  subtaskCount,
  completedCount,
}: SubtaskProgressProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { selectedTask, subtasks } = useTaskStore();
  const wsId = workspaceId ?? "";
  const pid = selectedTask?.projectId ?? "";
  const isParent = subtaskCount > 0;
  const progress = subtaskCount > 0 ? Math.round((completedCount / subtaskCount) * 100) : 0;

  if (!isParent) return null;

  return (
    <div style={{ marginTop: 12, padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
          Subtasks ({completedCount}/{subtaskCount})
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>
          {progress}%
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: 8,
          background: "#e5e7eb",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#2563eb",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#6b7280" }}>
        <span>
          <span style={{ fontWeight: 600 }}>{completedCount}</span> of {subtaskCount} complete
        </span>
        <button
          onClick={() => {
            if (wsId && pid) {
              window.location.href = `/w/${wsId}/projects/${pid}`;
            }
          }}
          style={{
            background: "none",
            border: "none",
            color: "#2563eb",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          View project board
        </button>
      </div>
    </div>
  );
}