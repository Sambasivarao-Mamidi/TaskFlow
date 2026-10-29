import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTaskStore } from "../store/tasks";
import { apiJson } from "../lib/api";

interface AIBreakdownPanelProps {
  taskId: string;
  projectId: string;
  taskTitle: string;
  taskDescription?: string;
}

export default function AIBreakdownPanel({
  taskId,
  projectId,
  taskTitle,
  taskDescription,
}: AIBreakdownPanelProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { subtasks, aiLoading, aiError, setSubtasks, toggleSubtask, updateSubtaskDraft } =
    useTaskStore();
  const wsId = workspaceId ?? "";

  const [instruction, setInstruction] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [generationStage, setGenerationStage] = useState<"idle" | "generating" | "review">("idle");

  const ALLOWED_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"];

  const selectedCount = subtasks.filter((s) => s.selected).length;

  const handleGenerate = async () => {
    setGenerationStage("generating");
    try {
      const res = await apiJson<{
        suggestions: Array<{
          title: string;
          description?: string;
          priority?: "low" | "medium" | "high";
          estimatedHours?: number;
        }>;
      }>(
        `/api/projects/${projectId}/tasks/${taskId}/ai/breakdown`,
        {
          method: "POST",
          body: JSON.stringify({
            model,
            instruction: instruction.trim() || undefined,
          }),
        }
      );

      const drafts = res.suggestions.map((s, i) => ({
        id: `subtask-${i}-${Date.now()}`,
        title: s.title,
        description: s.description,
        priority: s.priority,
        estimatedHours: s.estimatedHours,
        selected: true,
      }));
      setSubtasks(drafts);
      setGenerationStage("review");
    } catch (err: unknown) {
      setGenerationStage("idle");
      // Error will be shown via store
    }
  };

  const handleAccept = async () => {
    const selected = subtasks.filter((s) => s.selected);
    if (selected.length === 0) return;

    try {
      await apiJson<{ createdTaskIds: string[] }>(
        `/api/projects/${projectId}/tasks/${taskId}/ai/accept`,
        {
          method: "POST",
          body: JSON.stringify({
            subtasks: selected.map((s) => ({
              title: s.title,
              description: s.description,
              priority: s.priority,
              estimatedHours: s.estimatedHours,
            })),
          }),
        }
      );
      setSubtasks([]);
      setGenerationStage("idle");
      // The parent page should refresh tasks after this
      window.dispatchEvent(new CustomEvent("taskflow:subtasks-created", { detail: { taskId } }));
    } catch (err: unknown) {
      // Error handling
    }
  };

  const handleRegenerate = () => {
    setGenerationStage("generating");
    handleGenerate();
  };

  const renderIdle = () => (
    <div style={{ padding: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
        AI Task Breakdown
      </div>
      <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280" }}>
        Turn "{taskTitle}" into a structured execution plan. AI will suggest subtasks you can
        review and create as real tasks.
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#374151" }}>
          Model
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as any)}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {ALLOWED_MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#374151" }}>
          Optional instruction
        </label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. Break this into frontend and testing tasks"
          rows={3}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
      </div>
      <button
        onClick={handleGenerate}
        disabled={aiLoading}
        style={{
          padding: "10px 20px",
          background: "#2563eb",
          color: "#ffffff",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: aiLoading ? "not-allowed" : "pointer",
        }}
      >
        {aiLoading ? "Generating plan…" : "Generate breakdown"}
      </button>
    </div>
  );

  const renderReview = () => (
    <div style={{ padding: 16, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            Suggested subtasks ({selectedCount}/{subtasks.length} selected)
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Edit any suggestion, then create the ones you want.
          </div>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={aiLoading}
          style={{
            padding: "6px 12px",
            background: "#f1f5f9",
            border: "1px solid #cbd5e1",
            color: "#475569",
            borderRadius: 6,
            fontSize: 12,
            cursor: aiLoading ? "not-allowed" : "pointer",
          }}
        >
          Regenerate
        </button>
      </div>

      <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16, border: "1px solid #e2e8f0", borderRadius: 6 }}>
        {subtasks.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: 10,
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <input
              type="checkbox"
              checked={s.selected}
              onChange={() => toggleSubtask(s.id)}
              style={{ marginTop: 2 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <input
                  value={s.title}
                  onChange={(e) => updateSubtaskDraft(s.id, { title: e.target.value })}
                  style={{
                    flex: 1,
                    fontWeight: 600,
                    color: s.selected ? "#111827" : "#9ca3af",
                    textDecoration: s.selected ? "none" : "line-through",
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                  }}
                />
                {s.estimatedHours && (
                  <span style={{ fontSize: 11, color: "#6b7280", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>
                    ~{s.estimatedHours}h
                  </span>
                )}
              </div>
              {s.description && (
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                  {s.description}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#94a3b8" }}>
                <span
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: 600,
                    padding: "1px 6px",
                    borderRadius: 4,
                    background:
                      s.priority === "high"
                        ? "#fecaca"
                        : s.priority === "medium"
                        ? "#fef3c7"
                        : "#dbeafe",
                    color:
                      s.priority === "high"
                        ? "#dc2626"
                        : s.priority === "medium"
                        ? "#d97706"
                        : "#2563eb",
                  }}
                >
                  {s.priority}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          onClick={() => setGenerationStage("idle")}
          style={{
            padding: "8px 16px",
            background: "#ffffff",
            border: "1px solid #d1d5db",
            color: "#374151",
            borderRadius: 6,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleAccept}
          disabled={selectedCount === 0 || aiLoading}
          style={{
            padding: "8px 16px",
            background: selectedCount === 0 ? "#94a3b8" : "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: selectedCount === 0 || aiLoading ? "not-allowed" : "pointer",
          }}
        >
          {aiLoading ? "Creating…" : `Create ${selectedCount} subtask${selectedCount !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {generationStage === "idle" ? renderIdle() : renderReview()}
      {aiError && (
        <div style={{ marginTop: 12, padding: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 6, fontSize: 13 }}>
          {aiError}
        </div>
      )}
    </div>
  );
}