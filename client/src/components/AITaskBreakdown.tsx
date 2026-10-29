import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectStore } from "../store/projects";
import { useAIStore } from "../store/ai";
import type { AIModel } from "@taskflow/shared";
import { AI_MODELS } from "@taskflow/shared";
import { apiJson } from "../lib/api";

export default function AITaskBreakdown() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedProject } = useProjectStore();
  const {
    hasKey,
    breakdown,
    loading: aiLoading,
    error,
    clearError,
  } = useAIStore();

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [model, setModel] = useState<AIModel>("gpt-4o-mini");
  const [subtasks, setSubtasks] = useState<Array<{ title: string; description?: string; status: string; priority: string; selected: boolean }>>([]);
  const [generating, setGenerating] = useState(false);

  const project = selectedProject ?? undefined;
  const pid = projectId ?? project?.id ?? "";

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!taskTitle.trim()) return;
    setGenerating(true);
    try {
      const result = await breakdown({
        projectId: pid,
        taskTitle: taskTitle.trim(),
        taskDescription: taskDescription.trim() || undefined,
        model,
      });
      setSubtasks(
        result.subtasks.map((s) => ({
          title: s.title,
          description: s.description,
          status: s.status ?? "todo",
          priority: s.priority ?? "medium",
          selected: false,
        }))
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to generate subtasks");
    } finally {
      setGenerating(false);
    }
  };

  const [errorMsg, setErrorMsg] = useState("");

  const handleToggle = (index: number) => {
    setSubtasks((prev) =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleSelectAll = () => {
    setSubtasks((prev) => prev.map((s) => ({ ...s, selected: true })));
  };

  const handleAccept = async () => {
    const selected = subtasks.filter((s) => s.selected);
    if (selected.length === 0) return;
    for (const s of selected) {
      try {
        await apiJson(`/api/projects/${pid}/tasks`, {
          method: "POST",
          body: JSON.stringify({
            title: s.title,
            description: s.description,
            status: s.status,
            priority: s.priority,
          }),
        });
      } catch {
        // ignore individual failures
      }
    }
    setSubtasks([]);
    navigate(`/projects/${pid}/tasks`);
  };

  if (!hasKey) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>AI Task Breakdown</h1>
        <p>No AI key configured. <a style={{ color: "#2563eb", cursor: "pointer" }} onClick={() => navigate("/ai/settings")}>Go to AI Settings</a> to add one.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 700 }}>
      <h1>AI Task Breakdown — {project?.name ?? "Project"}</h1>
      {errorMsg && (
        <div style={{ color: "red", marginBottom: 12 }}>
          {errorMsg}
          <button onClick={clearError} style={{ marginLeft: 8 }}>dismiss</button>
        </div>
      )}
      <form onSubmit={handleGenerate}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Task title</label>
          <input
            required
            maxLength={200}
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            disabled={generating}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Description</label>
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            disabled={generating}
            rows={3}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </div>
        <div style={{ marginBottom: 12, display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ fontSize: 14, marginBottom: 0 }}>Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as AIModel)}
            disabled={generating}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          >
            {AI_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={generating || !taskTitle.trim()} style={{ padding: "8 16", cursor: "pointer" }}>
          {generating ? "Generating..." : "Generate subtasks"}
        </button>
      </form>

      {subtasks.length > 0 && (
        <div style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Suggested subtasks
            <button
              onClick={handleSelectAll}
              disabled={subtasks.every((s) => s.selected)}
              style={{ padding: "4 10", fontSize: 12, cursor: "pointer", border: "1px solid #ccc", borderRadius: 4 }}
            >
              Select all
            </button>
          </h3>
          {subtasks.map((s, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8 0", borderBottom: "1px solid #eee" }}
            >
              <input type="checkbox" checked={s.selected} onChange={() => handleToggle(i)} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{s.title}</div>
                {s.description && <div style={{ fontSize: 13, color: "#666" }}>{s.description}</div>}
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                  {s.priority} &bull; {s.status}
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              onClick={handleAccept}
              disabled={!subtasks.some((s) => s.selected) || aiLoading}
              style={{ padding: "8 16", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
            >
              {aiLoading ? "Creating..." : "Accept selected as tasks"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
