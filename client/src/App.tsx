import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WorkspaceLayout from "./components/WorkspaceLayout";
import WorkspaceSelectorPage from "./pages/WorkspaceSelectorPage";
import Dashboard from "./pages/Dashboard";
import ProjectsList from "./pages/ProjectsList";
import ProjectDetail from "./pages/ProjectDetail";
import MyTasks from "./pages/MyTasks";
import AISettings from "./pages/AISettings";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/workspaces" replace />} />
        <Route
          path="/workspaces"
          element={
            <ProtectedRoute>
              <WorkspaceSelectorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/w/:workspaceId/*"
          element={
            <ProtectedRoute>
              <WorkspaceLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<ProjectsList />} />
          <Route path="projects/:projectId" element={<ProjectDetail />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="ai" element={<AISettings />} />
          <Route path="settings" element={<WorkspaceSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}