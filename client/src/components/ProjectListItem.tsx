import type { ProjectDto } from "@taskflow/shared";

export interface ProjectListItemProps {
  project: ProjectDto;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (project: ProjectDto) => void;
}

export function ProjectListItem({ project, onArchive, onDelete, onSelect }: ProjectListItemProps) {
  const isArchived = project.status === "archived";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        border: "1px solid #ddd",
        borderRadius: 6,
        marginBottom: 8,
        background: isArchived ? "#f2f2f2" : "#fff",
        cursor: "pointer",
      }}
      onClick={() => onSelect(project)}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, textDecoration: isArchived ? "line-through" : "none", color: isArchived ? "#888" : "#000" }}>
          {project.name}
        </div>
        <div style={{ fontSize: 12, color: "#666" }}>
          {project.status} &bull; created {new Date(project.createdAt).toLocaleDateString()}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onArchive(project.id); }}
        style={{ padding: "4 10", border: "1px solid #666", background: "none", borderRadius: 4, cursor: "pointer" }}
      >
        {isArchived ? "Restore" : "Archive"}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
        style={{ marginLeft: 6, padding: "4 10", color: "red", border: "1px solid red", background: "none", borderRadius: 4, cursor: "pointer" }}
      >
        Delete
      </button>
    </div>
  );
}
