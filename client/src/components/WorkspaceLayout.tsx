import { Outlet, useLocation, useParams } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuthStore } from "../store/auth";
import { useWorkspaceStore } from "../store/workspaces";

export default function WorkspaceLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { workspaces, selectedWorkspace, selectWorkspace, fetchWorkspaces } =
    useWorkspaceStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    clearAuth();
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>
      <TopBar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        selectWorkspace={selectWorkspace}
        currentWorkspaceId={workspaceId ?? ""}
        fetchWorkspaces={fetchWorkspaces}
      />
      <div style={{ display: "flex" }}>
        {sidebarOpen && (
          <Sidebar
            workspaces={workspaces}
            selectedWorkspace={selectedWorkspace}
            selectWorkspace={selectWorkspace}
            currentWorkspaceId={workspaceId ?? ""}
            fetchWorkspaces={fetchWorkspaces}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        <main
          style={{
            flex: 1,
            padding: 24,
            background: "#f8fafc",
            minHeight: "100vh",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}