
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { supabase } from "@/lib/supabaseClient";
import { useGetMyProfileQuery } from "@/store/api/apiSlice";

import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const navigation = [
  {
    label: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Teams",
    path: "/teams",
    icon: Users,
  },
  {
    label: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Tasks",
    path: "/tasks",
    icon: ListTodo,
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
  },
];

const secondaryNavigation = [
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function SidebarLink({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        ].join(" ")
      }
    >
      <Icon className="size-4.5 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-sm">
            W
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              WorkFlow
            </p>

            <p className="truncate text-xs text-muted-foreground">
              Project management
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-muted/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Current workspace
          </p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-xs font-semibold">
                W
              </div>

              <span className="truncate text-sm font-medium">
                My Workspace
              </span>
            </div>

            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-5">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map((item) => (
            <SidebarLink
              key={item.path}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </p>

        <nav className="space-y-1">
          {secondaryNavigation.map((item) => (
            <SidebarLink
              key={item.path}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>

      <div className="p-4">
        <div className="rounded-2xl bg-muted/50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              W
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                Your workspace
              </p>

              <p className="truncate text-xs text-muted-foreground">
                Stay organized
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user } = useSelector((state) => state.auth);

  const { data: profile } = useGetMyProfileQuery();

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const username =
    profile?.username ||
    user?.user_metadata?.username ||
    "user";

  const initials = getInitials(displayName);

  async function handleLogout() {
    await supabase.auth.signOut();

    setMobileOpen(false);
    navigate("/login", { replace: true });
  }

  function goToNotifications() {
    navigate("/notifications");
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-background md:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 w-[290px] bg-background shadow-2xl md:hidden">
            <SidebarContent
              onNavigate={() => setMobileOpen(false)}
            />

            <button
              type="button"
              aria-label="Close navigation"
              className="absolute right-4 top-5 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-5" />
            </button>
          </aside>
        </>
      )}

      <div className="md:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
                className="rounded-xl md:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </Button>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Workspace
                </p>

                <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                  My Workspace
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <ThemeToggle />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={goToNotifications}
              >
                <Bell className="size-4.5" />
              </Button>

              <div className="mx-2 hidden h-7 w-px bg-border sm:block" />

              <div className="hidden items-center gap-3 sm:flex">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {displayName}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    @{username}
                  </p>
                </div>

                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Log out"
                title="Log out"
                className="ml-1 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="size-4.5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="min-h-[calc(100svh-72px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}