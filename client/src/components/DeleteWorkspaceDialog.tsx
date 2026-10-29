import { useState } from "react";
import { useWorkspaceStore } from "../store/workspaces";

export function DeleteWorkspaceDialog() {
  const { deleteWorkspace, selectedWorkspace } = useWorkspaceStore();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!selectedWorkspace) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          marginTop: 16,
          padding: "8 16",
          color: "red",
          background: "none",
          border: "1px solid red",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Delete "{selectedWorkspace.name}"
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Delete workspace?</h3>
            <p>
              This will remove "{selectedWorkspace.name}" and all its projects
              and tasks. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setOpen(false)}
                style={{ padding: "8 16", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setConfirming(true);
                  await deleteWorkspace(selectedWorkspace.id);
                  setOpen(false);
                  setConfirming(false);
                }}
                disabled={confirming}
                style={{
                  padding: "8 16",
                  color: "red",
                  background: "none",
                  border: "1px solid red",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {confirming ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
