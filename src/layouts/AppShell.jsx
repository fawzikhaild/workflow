
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  CheckSquare,
  ChevronLeft,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import ThemeToggle from "@/components/theme-toggle";

import {
  supabase,
} from "@/lib/supabaseClient";

import {
  apiSlice,
  useGetMyProfileQuery,
} from "@/store/api/apiSlice";

import RealtimeSync from "@/components/RealtimeSync";
import NotificationBell from "@/components/NotificationBell";

export default function AppShell() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const dispatch =
    useDispatch();

  const user =
    useSelector(
      (state) =>
        state.auth.user
    );

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  // ==========================================================
  // Profile
  // ==========================================================

  const {
    data: profile,
  } =
    useGetMyProfileQuery(
      user?.id,
      {
        skip:
          !user?.id,
      }
    );

  // ==========================================================
  // Close mobile menu
  // ==========================================================

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleEscape(
      event
    ) {
      if (
        event.key === "Escape"
      ) {
        setMobileOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // ==========================================================
  // Navigation
  // ==========================================================

  const navigationItems =
    useMemo(
      () => [
        {
          label: "Overview",
          to: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: "Teams",
          to: "/teams",
          icon: Users,
        },
        {
          label: "Projects",
          to: "/projects",
          icon: FolderKanban,
        },
        {
          label: "Tasks",
          to: "/tasks",
          icon: CheckSquare,
        },
        {
          label: "Notifications",
          to: "/notifications",
          icon: ClipboardList,
        },
        {
          label: "Settings",
          to: "/settings",
          icon: Settings,
        },
      ],
      []
    );

  // ==========================================================
  // Logout
  // ==========================================================

  async function handleLogout() {
    try {
      await supabase.auth.signOut({
        scope: "local",
      });

      dispatch(
        apiSlice.util.resetApiState()
      );

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  }

  // ==========================================================
  // User display
  // ==========================================================

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.email ||
    "User";

  const displayEmail =
    user?.email ||
    "";

  // ==========================================================
  // Sidebar
  // ==========================================================

  function SidebarContent({
    mobile = false,
  }) {
    return (
      <div className="flex h-full flex-col">
        {/* Logo */}

        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link
            to="/dashboard"
            className="flex items-center gap-2"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ClipboardList className="size-5" />
            </div>

            <div className="leading-none">
              <div className="font-semibold tracking-tight">
                WorkFlow
              </div>

              <div className="mt-1 text-[11px] text-muted-foreground">
                Workspace
              </div>
            </div>
          </Link>

          {mobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}

        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {navigationItems.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({
                      isActive,
                    }) =>
                      [
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      ].join(" ")
                    }
                  >
                    {({
                      isActive,
                    }) => (
                      <>
                        <Icon
                          className={[
                            "size-4 shrink-0",
                            isActive
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-foreground",
                          ].join(" ")}
                        />

                        <span>
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              }
            )}
          </div>
        </nav>

        {/* User */}

        <div className="border-t p-3">
          <div className="rounded-xl bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {displayName}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {displayEmail}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Realtime */}

      <RealtimeSync />

      {/* Desktop Sidebar */}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background md:block">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setMobileOpen(
              false
            )
          }
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* Mobile Sidebar */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-72 border-r bg-background shadow-xl transition-transform duration-200 md:hidden",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        <SidebarContent
          mobile
        />
      </aside>

      {/* Main Area */}

      <div className="md:pl-64">
        {/* Header */}

        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            {/* Left */}

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() =>
                  setMobileOpen(
                    true
                  )
                }
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>

              <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <span>
                  Workspace
                </span>

                <ChevronLeft className="size-4 rotate-180" />

                <span className="text-foreground">
                  {location.pathname ===
                  "/dashboard"
                    ? "Overview"
                    : navigationItems.find(
                        (item) =>
                          location.pathname.startsWith(
                            item.to
                          )
                      )?.label ||
                      "Workspace"}
                </span>
              </div>

              <div className="text-sm font-medium sm:hidden">
                WorkFlow
              </div>
            </div>

            {/* Right */}

            <div className="flex items-center gap-1">
              {/* Theme */}

              <ThemeToggle />

              {/* Notifications */}

              <NotificationBell />

              {/* User */}

              <div className="ml-2 hidden items-center gap-3 sm:flex">
                <div className="text-right">
                  <p className="max-w-40 truncate text-sm font-medium">
                    {displayName}
                  </p>

                  <p className="max-w-40 truncate text-xs text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>

                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {displayName
                    .charAt(0)
                    .toUpperCase()}
                </div>
              </div>

              {/* Mobile logout */}

              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={
                  handleLogout
                }
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="size-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page */}

        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

