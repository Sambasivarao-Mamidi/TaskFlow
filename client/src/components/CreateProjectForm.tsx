import { useState } from "react";
import type { ProjectStatus } from "@taskflow/shared";

export interface CreateProjectFormProps {
  workspaceId: string;
  onCreate: (workspaceId: string, name: string, status: ProjectStatus) => void;
  loading: boolean;
}

export function CreateProjectForm({ workspaceId, onCreate, loading }: CreateProjectFormProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    onCreate(workspaceId, name.trim(), status);
  };

  return (
    <div style={{ marginBottom: 20, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Create project</h3>
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Project name</label>
          <input
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            disabled={loading}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button type="submit" disabled={loading || !name.trim()} style={{ padding: "8 16", cursor: "pointer" }}>
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
    </div>
  );
}
