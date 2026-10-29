import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAIStore } from "../store/ai";
import { useWorkspaceStore } from "../store/workspaces";

export default function AISettings() {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { selectedWorkspace } = useWorkspaceStore();
  const { hasKey, hint, loading, error, clearError, checkStatus, saveKey, deleteKey } =
    useAIStore();
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");

  const workspace = selectedWorkspace ?? undefined;
  const wsId = workspaceId ?? workspace?.id;

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const ALLOWED_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    saveKey(apiKey.trim());
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#111827" }}>
            AI Settings
          </h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
            Configure your BYOK (Bring Your Own Key) for AI task breakdown.
          </p>
        </div>
        <button
          onClick={() => navigate(`/w/${wsId}/dashboard`, { replace: true })}
          style={{
            padding: "8px 16px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#ffffff",
            color: "#374151",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      </div>
      {error && (
        <div style={{ color: "red", marginBottom: 16, padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6 }}>
          {error}
          <button onClick={clearError} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "red" }}>
            dismiss
          </button>
        </div>
      )}
      <div style={{ marginBottom: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0, fontSize: 16, color: "#111827" }}>
          API Key
        </h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            disabled={loading || hasKey}
            style={{
              width: "100%",
              padding: 8,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          >
            <option value="openai">OpenAI</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={loading || hasKey}
            style={{
              width: "100%",
              padding: 8,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          >
            {ALLOWED_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        {hasKey ? (
          <>
            <p>AI key is configured.</p>
            <p style={{ fontSize: 13, color: "#666", fontFamily: "monospace", marginBottom: 12 }}>
              Hint: {hint}
            </p>
            <button
              onClick={deleteKey}
              disabled={loading}
              style={{
                padding: "6px 14",
                color: "red",
                border: "1px solid red",
                background: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {loading ? "Removing..." : "Remove key"}
            </button>
          </>
        ) : (
          <>
            <p>
              No AI key configured. Add one to enable AI task breakdown.
            </p>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>
                  API Key
                </label>
                <input
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: 8,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !apiKey.trim()}
                style={{
                  padding: "8px 16",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {loading ? "Saving..." : "Save key"}
              </button>
            </form>
          </>
        )}
      </div>
      <div style={{ padding: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0, fontSize: 14, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          How it works
        </h3>
        <ul style={{ color: "#64748b", fontSize: 13, lineHeight: "1.6", margin: "8px 0 0 20px" }}>
          <li>
            Your OpenAI key is encrypted with AES-256-GCM before storage.
          </li>
          <li>
            Only a masked hint {hint ? hint : "********"} is ever shown in the UI.
          </li>
          <li>
            The decrypted key exists only in server memory during AI requests.
          </li>
          <li>
            Limited to 10 AI requests per hour per user.
          </li>
        </ul>
      </div>
    </div>
  );
}