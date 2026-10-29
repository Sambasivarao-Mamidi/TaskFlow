import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export default function Home() {
  const { isAuthenticated, clearAuth, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      navigate("/workspaces");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>TaskFlow</h1>
      <p>Redirecting to workspaces...</p>
      {user && <p>Welcome, {user.name}!</p>}
      <button
        onClick={() => {
          clearAuth();
          navigate("/login");
        }}
        style={{ padding: "8px 16px" }}
      >
        Log out
      </button>
    </div>
  );
}
