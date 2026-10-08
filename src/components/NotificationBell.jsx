
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MessageCircle,
} from "lucide-react";

import {
  Link,
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

// ============================================================
// Helpers
// ============================================================

function getNotificationIcon(
  notification
) {
  if (
    notification.notification_type ===
    "chat_message"
  ) {
    return MessageCircle;
  }

  return Bell;
}

function getNotificationLabel(
  notification
) {
  if (
    notification.notification_type ===
    "chat_message"
  ) {
    return "Team Chat";
  }

  return "Notification";
}

function getNotificationDestination(
  notification
) {
  if (
    notification.notification_type ===
      "chat_message" &&
    notification.team_id
  ) {
    const query =
      notification.chat_message_id
        ? `?message=${notification.chat_message_id}`
        : "";

    return `/teams/${notification.team_id}/chat${query}`;
  }

  if (
    notification.task_id
  ) {
    return `/tasks/${notification.task_id}`;
  }

  if (
    notification.project_id
  ) {
    return `/projects/${notification.project_id}`;
  }

  return "/notifications";
}

function formatRelativeTime(
  createdAt
) {
  if (!createdAt) {
    return "";
  }

  const date =
    new Date(createdAt);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const diff =
    Math.max(
      0,
      Date.now() -
        date.getTime()
    );

  const seconds =
    Math.floor(
      diff / 1000
    );

  if (
    seconds < 60
  ) {
    return "Just now";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (
    minutes < 60
  ) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (
    hours < 24
  ) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (
    days < 7
  ) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    }
  );
}

// ============================================================
// Component
// ============================================================

export default function NotificationBell() {
  const navigate =
    useNavigate();

  const userId =
    useSelector(
      (state) =>
        state.auth.user?.id
    );

  const [
    open,
    setOpen,
  ] = useState(false);

  const containerRef =
    useRef(null);

  // ==========================================================
  // Notifications
  // ==========================================================

  const {
    data: notifications = [],
    isLoading,
  } =
    useGetMyNotificationsQuery(
      userId,
      {
        skip:
          !userId,
      }
    );

  const [
    markNotificationRead,
  ] =
    useMarkNotificationReadMutation();

  const [
    markAllNotificationsRead,
    {
      isLoading:
        markingAllRead,
    },
  ] =
    useMarkAllNotificationsReadMutation();

  // ==========================================================
  // Derived data
  // ==========================================================

  const unreadCount =
    useMemo(() => {
      return notifications.filter(
        (
          notification
        ) =>
          !notification.is_read
      ).length;
    }, [
      notifications,
    ]);

  const latestNotifications =
    useMemo(() => {
      return [
        ...notifications,
      ]
        .sort(
          (a, b) =>
            new Date(
              b.created_at ||
                0
            ).getTime() -
            new Date(
              a.created_at ||
                0
            ).getTime()
        )
        .slice(0, 5);
    }, [
      notifications,
    ]);

  // ==========================================================
  // Outside click + Escape
  // ==========================================================

  useEffect(() => {
    function handleOutsideClick(
      event
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    }

    function handleEscape(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // ==========================================================
  // Open notification
  // ==========================================================

  async function handleOpenNotification(
    notification
  ) {
    try {
      if (
        !notification.is_read
      ) {
        await markNotificationRead(
          notification.id
        ).unwrap();
      }
    } catch (
      error
    ) {
      console.error(
        "Unable to mark notification as read:",
        error
      );
    }

    setOpen(false);

    navigate(
      getNotificationDestination(
        notification
      )
    );
  }

  // ==========================================================
  // Mark all
  // ==========================================================

  async function handleMarkAllAsRead() {
    if (
      unreadCount === 0 ||
      markingAllRead
    ) {
      return;
    }

    try {
      await markAllNotificationsRead().unwrap();
    } catch (
      error
    ) {
      console.error(
        "Unable to mark all notifications as read:",
        error
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {/* ==================================================== */}
      {/* Bell */}
      {/* ==================================================== */}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="size-5" />

        {!isLoading &&
          unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground">
              {unreadCount > 99
                ? "99+"
                : unreadCount}
            </span>
          )}
      </Button>

      {/* ==================================================== */}
      {/* Dropdown */}
      {/* ==================================================== */}

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border bg-background shadow-2xl">
          {/* ------------------------------------------------ */}
          {/* Header */}
          {/* ------------------------------------------------ */}

          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">
                Notifications
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={
                handleMarkAllAsRead
              }
              disabled={
                unreadCount === 0 ||
                markingAllRead
              }
            >
              <CheckCircle2 className="size-3.5" />
              Mark all
            </Button>
          </div>

          {/* ------------------------------------------------ */}
          {/* Loading */}
          {/* ------------------------------------------------ */}

          {isLoading && (
            <div className="space-y-2 p-3">
              {Array.from({
                length: 4,
              }).map(
                (
                  _,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="animate-pulse rounded-xl border p-3"
                  >
                    <div className="flex gap-3">
                      <div className="size-9 rounded-lg bg-muted" />

                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 rounded bg-muted" />

                        <div className="h-3 w-full rounded bg-muted" />

                        <div className="h-2 w-20 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* ------------------------------------------------ */}
          {/* Empty */}
          {/* ------------------------------------------------ */}

          {!isLoading &&
            latestNotifications.length ===
              0 && (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted">
                  <Bell className="size-5 text-muted-foreground" />
                </div>

                <p className="text-sm font-medium">
                  No notifications
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  New activity will appear here.
                </p>
              </div>
            )}

          {/* ------------------------------------------------ */}
          {/* Notification list */}
          {/* ------------------------------------------------ */}

          {!isLoading &&
            latestNotifications.length >
              0 && (
              <div className="max-h-[420px] overflow-y-auto p-2">
                {latestNotifications.map(
                  (
                    notification
                  ) => {
                    const Icon =
                      getNotificationIcon(
                        notification
                      );

                    const unread =
                      !notification.is_read;

                    const isChat =
                      notification.notification_type ===
                      "chat_message";

                    return (
                      <button
                        key={
                          notification.id
                        }
                        type="button"
                        onClick={() =>
                          handleOpenNotification(
                            notification
                          )
                        }
                        className={[
                          "flex w-full gap-3 rounded-xl p-3 text-left transition-colors",

                          unread
                            ? "bg-primary/[0.05] hover:bg-primary/[0.10]"
                            : "hover:bg-muted",
                        ].join(
                          " "
                        )}
                      >
                        {/* Icon */}

                        <div
                          className={[
                            "flex size-9 shrink-0 items-center justify-center rounded-lg",

                            unread
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                          ].join(
                            " "
                          )}
                        >
                          <Icon className="size-4" />
                        </div>

                        {/* Content */}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={[
                                "truncate text-sm",

                                unread
                                  ? "font-semibold text-foreground"
                                  : "font-medium text-foreground/85",
                              ].join(
                                " "
                              )}
                            >
                              {notification.title ||
                                "Notification"}
                            </p>

                            {unread && (
                              <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {notification.message ||
                              "You have a new notification."}
                          </p>

                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock3 className="size-3" />

                              {formatRelativeTime(
                                notification.created_at
                              )}
                            </span>

                            {isChat && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                                <MessageCircle className="size-3" />

                                Team Chat
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}

          {/* ------------------------------------------------ */}
          {/* Footer */}
          {/* ------------------------------------------------ */}

          <div className="border-t p-2">
            <Button
              asChild
              variant="ghost"
              className="w-full justify-center"
              onClick={() =>
                setOpen(false)
              }
            >
              <Link to="/notifications">
                View all notifications
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

