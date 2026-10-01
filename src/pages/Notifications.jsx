
import {
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ListTodo,
  MessageCircle,
  RefreshCw,
  UserPlus,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useSelector,
} from "react-redux";

import {
  Button,
} from "@/components/ui/button";

import {
  useGetMyNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/store/api/apiSlice";

// =========================
// Helpers
// =========================

function getNotificationIcon(
  notificationType
) {
  switch (notificationType) {
    case "task_assigned":
      return UserPlus;

    case "task_status_changed":
      return CheckCircle2;

    case "comment_created":
      return MessageCircle;

    case "task_updated":
      return ListTodo;

    default:
      return Bell;
  }
}

function getNotificationLabel(
  notificationType
) {
  switch (notificationType) {
    case "task_assigned":
      return "Task Assignment";

    case "task_status_changed":
      return "Task Update";

    case "comment_created":
      return "New Comment";

    case "task_updated":
      return "Task Update";

    default:
      return "Notification";
  }
}

function formatNotificationTime(
  createdAt
) {
  if (!createdAt) {
    return "";
  }

  const date =
    new Date(createdAt);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function getDateGroup(
  createdAt
) {
  if (!createdAt) {
    return "Earlier";
  }

  const date =
    new Date(createdAt);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Earlier";
  }

  const now = new Date();

  const todayStart =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  const yesterdayStart =
    new Date(
      todayStart
        .getTime() -
        24 * 60 * 60 * 1000
    );

  if (date >= todayStart) {
    return "Today";
  }

  if (date >= yesterdayStart) {
    return "Yesterday";
  }

  return "Earlier";
}

function sortNotifications(
  notifications
) {
  return [...notifications].sort(
    (a, b) => {
      const first = new Date(
        a.created_at || 0
      ).getTime();

      const second = new Date(
        b.created_at || 0
      ).getTime();

      return second - first;
    }
  );
}

// =========================
// Component
// =========================

export default function Notifications() {
  const navigate = useNavigate();

  const userId = useSelector(
    (state) =>
      state.auth.user?.id
  );

  const [
    activeTab,
    setActiveTab,
  ] = useState("all");

  // =========================
  // Notifications Query
  // =========================

  const {
    data: notifications = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetMyNotificationsQuery(
      userId,
      {
        skip: !userId,
      }
    );

  // =========================
  // Mutations
  // =========================

  const [
    markNotificationRead,
    {
      isLoading:
        isMarkingRead,
    },
  ] =
    useMarkNotificationReadMutation();

  const [
    markAllNotificationsRead,
    {
      isLoading:
        isMarkingAllRead,
    },
  ] =
    useMarkAllNotificationsReadMutation();

  // =========================
  // Sorted notifications
  // =========================

  const sortedNotifications =
    useMemo(() => {
      return sortNotifications(
        notifications
      );
    }, [notifications]);

  // =========================
  // Unread count
  // =========================

  const unreadCount =
    useMemo(() => {
      return sortedNotifications.filter(
        (notification) =>
          !notification.is_read
      ).length;
    }, [sortedNotifications]);

  // =========================
  // Filter
  // =========================

  const filteredNotifications =
    useMemo(() => {
      if (
        activeTab ===
        "unread"
      ) {
        return sortedNotifications.filter(
          (notification) =>
            !notification.is_read
        );
      }

      return sortedNotifications;
    }, [
      activeTab,
      sortedNotifications,
    ]);

  // =========================
  // Group
  // =========================

  const groupedNotifications =
    useMemo(() => {
      const groups = {
        Today: [],
        Yesterday: [],
        Earlier: [],
      };

      filteredNotifications.forEach(
        (notification) => {
          const group =
            getDateGroup(
              notification.created_at
            );

          groups[group].push(
            notification
          );
        }
      );

      return groups;
    }, [
      filteredNotifications,
    ]);

  // =========================
  // Mark one as read
  // =========================

  async function handleMarkAsRead(
    notification
  ) {
    if (
      notification.is_read ||
      !notification.id
    ) {
      return;
    }

    try {
      await markNotificationRead(
        notification.id
      ).unwrap();
    } catch (error) {
      console.error(
        "Unable to mark notification as read:",
        error
      );
    }
  }

  // =========================
  // Open notification
  // =========================

  async function handleOpenNotification(
    notification
  ) {
    await handleMarkAsRead(
      notification
    );

    if (notification.task_id) {
      navigate(
        `/tasks/${notification.task_id}`
      );

      return;
    }

    if (
      notification.project_id
    ) {
      navigate(
        `/projects/${notification.project_id}`
      );

      return;
    }
  }

  // =========================
  // Mark all as read
  // =========================

  async function handleMarkAllAsRead() {
    if (
      unreadCount === 0 ||
      isMarkingAllRead
    ) {
      return;
    }

    try {
      await markAllNotificationsRead().unwrap();
    } catch (error) {
      console.error(
        "Unable to mark all notifications as read:",
        error
      );
    }
  }

  // =========================
  // Render notification
  // =========================

  function renderNotification(
    notification
  ) {
    const Icon =
      getNotificationIcon(
        notification.notification_type
      );

    const label =
      getNotificationLabel(
        notification.notification_type
      );

    const isUnread =
      !notification.is_read;

    const hasDestination =
      Boolean(
        notification.task_id ||
        notification.project_id
      );

    return (
      <div
        key={notification.id}
        className={[
          "group rounded-2xl border p-4 transition-all",
          isUnread
            ? "border-primary/20 bg-primary/[0.04] shadow-sm"
            : "border-border bg-card",
          "hover:border-primary/30",
        ].join(" ")}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}

          <div
            className={[
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              isUnread
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            ].join(" ")}
          >
            <Icon className="size-5" />
          </div>

          {/* Content */}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </span>

                  {isUnread && (
                    <span className="size-2 rounded-full bg-primary" />
                  )}
                </div>

                <h3
                  className={[
                    "text-sm font-semibold",
                    isUnread
                      ? "text-foreground"
                      : "text-foreground/85",
                  ].join(" ")}
                >
                  {notification.title ||
                    "Notification"}
                </h3>
              </div>

              <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" />

                <span>
                  {formatNotificationTime(
                    notification.created_at
                  )}
                </span>
              </div>
            </div>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {notification.message ||
                "You have a new notification."}
            </p>

            {/* Actions */}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {hasDestination && (
                <Button
                  type="button"
                  size="sm"
                  variant={
                    isUnread
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    handleOpenNotification(
                      notification
                    )
                  }
                >
                  Open
                  <ExternalLink className="size-3.5" />
                </Button>
              )}

              {!isUnread && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="size-3.5" />
                  Read
                </span>
              )}

              {isUnread && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={
                    isMarkingRead
                  }
                  onClick={() =>
                    handleMarkAsRead(
                      notification
                    )
                  }
                >
                  <Check className="size-3.5" />
                  Mark as read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // Page
  // =========================

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
      {/* Header */}

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="size-5" />
            </div>

            <span className="text-sm font-medium text-muted-foreground">
              Activity Center
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Notifications
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Stay updated with task assignments,
            comments, and project activity.
          </p>
        </div>

        {/* Header actions */}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              refetch()
            }
            disabled={
              isFetching
            }
            aria-label="Refresh notifications"
            title="Refresh notifications"
          >
            <RefreshCw
              className={[
                "size-4",
                isFetching
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={
              handleMarkAllAsRead
            }
            disabled={
              unreadCount === 0 ||
              isMarkingAllRead
            }
          >
            <CheckCircle2 className="size-4" />
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Stats */}

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            Total notifications
          </div>

          <div className="mt-1 text-2xl font-semibold">
            {sortedNotifications.length}
          </div>
        </div>

        <div className="rounded-2xl border bg-primary/[0.04] p-4">
          <div className="text-sm text-muted-foreground">
            Unread
          </div>

          <div className="mt-1 text-2xl font-semibold text-primary">
            {unreadCount}
          </div>
        </div>
      </div>

      {/* Tabs */}

      <div className="mb-6 flex rounded-xl border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() =>
            setActiveTab("all")
          }
          className={[
            "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === "all"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          All

          <span className="ml-2 text-xs text-muted-foreground">
            {sortedNotifications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab("unread")
          }
          className={[
            "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === "unread"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Unread

          <span
            className={[
              "ml-2 text-xs",
              unreadCount > 0
                ? "font-semibold text-primary"
                : "text-muted-foreground",
            ].join(" ")}
          >
            {unreadCount}
          </span>
        </button>
      </div>

      {/* Error */}

      {isError && (
        <div className="mb-6">
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

            <div className="flex-1">
              <p className="text-sm font-medium">
                Unable to load notifications.
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Please try again.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                refetch()
              }
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}

      {isLoading && (
        <div className="space-y-4">
          {Array.from({
            length: 4,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border bg-card p-5"
              >
                <div className="flex gap-4">
                  <div className="size-10 rounded-xl bg-muted" />

                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-40 rounded bg-muted" />

                    <div className="h-3 w-full rounded bg-muted" />

                    <div className="h-3 w-2/3 rounded bg-muted" />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Empty */}

      {!isLoading &&
        !isError &&
        filteredNotifications.length === 0 && (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed bg-card/50 p-8 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
              <Bell className="size-6 text-muted-foreground" />
            </div>

            <h2 className="text-lg font-semibold">
              {activeTab ===
              "unread"
                ? "You're all caught up"
                : "No notifications yet"}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {activeTab ===
              "unread"
                ? "There are no unread notifications right now."
                : "New activity related to your tasks and projects will appear here."}
            </p>
          </div>
        )}

      {/* Groups */}

      {!isLoading &&
        !isError &&
        filteredNotifications.length >
          0 && (
          <div className="space-y-8">
            {[
              "Today",
              "Yesterday",
              "Earlier",
            ].map((group) => {
              const items =
                groupedNotifications[
                  group
                ];

              if (!items.length) {
                return null;
              }

              return (
                <section
                  key={group}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <h2 className="text-sm font-semibold">
                      {group}
                    </h2>

                    <div className="h-px flex-1 bg-border" />

                    <span className="text-xs text-muted-foreground">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {items.map(
                      renderNotification
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
    </div>
  );
}
