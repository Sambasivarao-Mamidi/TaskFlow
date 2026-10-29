import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          borderBottom: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{ fontWeight: 700, fontSize: 18, cursor: "pointer" }}
            onClick={() => navigate("/workspaces")}
          >
            TaskFlow
          </div>
          <nav style={{ display: "flex", gap: 16 }}>
            <button
              onClick={() => navigate("/workspaces")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#111827",
                fontSize: 14,
              }}
            >
              Workspaces
            </button>
            <button
              onClick={() => navigate("/ai/settings")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#111827",
                fontSize: 14,
              }}
            >
              AI Settings
            </button>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user && (
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              {user.name} ({user.email})
            </span>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              background: "#ffffff",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Log out
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}