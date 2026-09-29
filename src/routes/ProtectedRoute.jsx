
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import { LoaderCircle } from "lucide-react";

export default function ProtectedRoute() {
  const location = useLocation();

  const {
    user,
    initialized,
  } = useSelector(
    (state) => state.auth
  );

  if (!initialized) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <LoaderCircle className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return <Outlet />;
}
