
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppToast from "@/components/AppToast";

import AppShell from "@/layouts/AppShell";

import ComingSoon from "@/pages/ComingSoon";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Meetings from "@/pages/Meetings";
import MeetingDetails from "@/pages/MeetingDetails";
import Notifications from "@/pages/Notifications";
import ProjectDetails from "@/pages/ProjectDetails";
import Projects from "@/pages/Projects";
import Register from "@/pages/Register";
import Settings from "@/pages/Settings";
import TaskDetails from "@/pages/TaskDetails";
import Tasks from "@/pages/Tasks";
import TeamChat from "@/pages/TeamChat";
import TeamDetails from "@/pages/TeamDetails";
import Teams from "@/pages/Teams";

import GuestRoute from "@/routes/GuestRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";

import {
  ThemeProvider,
} from "@/components/theme-provider";

// ============================================================
// Not Found
// ============================================================

function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6">
      <div className="text-center">
        <p className="text-sm font-medium text-primary">
          WorkFlow
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          404
        </h1>

        <p className="mt-2 text-muted-foreground">
          The page you are looking for does not exist.
        </p>
      </div>
    </main>
  );
}

// ============================================================
// App
// ============================================================

export default function App() {
  return (
    <ThemeProvider
      defaultTheme="dark"
      storageKey="workflow-theme"
    >
      <Routes>
        {/* ================================================== */}
        {/* Guest Routes */}
        {/* ================================================== */}

        <Route element={<GuestRoute />}>
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />
        </Route>

        {/* ================================================== */}
        {/* Protected Routes */}
        {/* ================================================== */}

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            {/* Dashboard */}

            <Route
              path="/"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            {/* Teams */}

            <Route
              path="/teams"
              element={<Teams />}
            />

            <Route
              path="/teams/:teamId"
              element={<TeamDetails />}
            />

            <Route
              path="/teams/:teamId/chat"
              element={<TeamChat />}
            />

            {/* Projects */}

            <Route
              path="/projects"
              element={<Projects />}
            />

            <Route
              path="/projects/:projectId"
              element={<ProjectDetails />}
            />

            <Route
              path="/projects/:projectId/edit"
              element={
                <ComingSoon
                  title="Edit Project"
                />
              }
            />

            {/* Meetings */}

            <Route
              path="/meetings"
              element={<Meetings />}
            />

            <Route
              path="/meetings/:meetingId"
              element={<MeetingDetails />}
            />

            {/* Tasks */}

            <Route
              path="/tasks"
              element={<Tasks />}
            />

            <Route
              path="/tasks/:taskId"
              element={<TaskDetails />}
            />

            {/* Notifications */}

            <Route
              path="/notifications"
              element={<Notifications />}
            />

            {/* Settings */}

            <Route
              path="/settings"
              element={
                <Settings
                  title="Settings"
                />
              }
            />
          </Route>
        </Route>

        {/* ================================================== */}
        {/* Not Found */}
        {/* ================================================== */}

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>

      {/* ================================================== */}
      {/* Global Toast */}
      {/* ================================================== */}

      <AppToast />
    </ThemeProvider>
  );
}

