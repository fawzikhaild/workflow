
import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "@/layouts/AppShell";

import ComingSoon from "@/pages/ComingSoon";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Teams from "@/pages/Teams";

import GuestRoute from "@/routes/GuestRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";

import { ThemeProvider } from "@/components/theme-provider";

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

export default function App() {
  return (
    <ThemeProvider
      defaultTheme="dark"
      storageKey="workflow-theme"
    >
      <Routes>
        {/* Guest */}
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

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
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

            <Route
              path="/teams"
              element={<Teams />}
            />

            <Route
              path="/projects"
              element={
                <ComingSoon title="Projects" />
              }
            />

            <Route
              path="/tasks"
              element={
                <ComingSoon title="Tasks" />
              }
            />

            <Route
              path="/notifications"
              element={
                <ComingSoon title="Notifications" />
              }
            />

            <Route
              path="/settings"
              element={
                <ComingSoon title="Settings" />
              }
            />
          </Route>
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </ThemeProvider>
  );
}
