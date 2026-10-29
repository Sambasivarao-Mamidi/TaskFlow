import type { WorkspaceDto } from "@taskflow/shared";

export interface WorkspaceSelectorProps {
  workspaces: WorkspaceDto[];
  selected: WorkspaceDto | null;
  onSelect: (workspace: WorkspaceDto | null) => void;
}

export function WorkspaceSelector({ workspaces, selected, onSelect }: WorkspaceSelectorProps) {
  return (
    <div style={{ marginBottom: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Select workspace</h3>
      <select
        value={selected?.id ?? ""}
        onChange={(e) => {
          const id = e.target.value;
          const ws = workspaces.find((w) => w.id === id) ?? null;
          onSelect(ws);
        }}
        disabled={workspaces.length === 0}
        style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
      >
        <option value="">-- Select a workspace --</option>
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      {selected && (
        <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
          Selected: {selected.name}
        </p>
      )}
    </div>
  );
}
