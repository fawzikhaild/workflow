
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import { LoaderCircle } from "lucide-react";

export default function GuestRoute() {
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

  if (user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}

