import { useState } from "react";

export interface CreateWorkspaceFormProps {
  onCreate: (name: string) => void;
  loading: boolean;
}

export function CreateWorkspaceForm({ onCreate, loading }: CreateWorkspaceFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    onCreate(name.trim());
  };

  return (
    <div style={{ marginBottom: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Create workspace</h3>
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>
            Workspace name
          </label>
          <input
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </div>
        <button type="submit" disabled={loading || !name.trim()} style={{ padding: "8 16", cursor: "pointer" }}>
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
    </div>
  );
}
