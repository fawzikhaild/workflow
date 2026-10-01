
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useSelector,
} from "react-redux";

import {
  useNavigate,
} from "react-router-dom";

import {
  Bell,
  Check,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  UserPlus,
} from "lucide-react";

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
  type
) {
  switch (type) {
    case "task_assigned":
      return UserPlus;

    case "comment_created":
      return MessageCircle;

    case "task_status_changed":
      return CheckCircle2;

    default:
      return Bell;
  }
}

function formatTime(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
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

// ============================================================
// Component
// ============================================================

export default function NotificationBell() {
  const navigate =
    useNavigate();

  const containerRef =
    useRef(null);

  const userId =
    useSelector(
      (state) =>
        state.auth.user?.id
    );

  const [
    open,
    setOpen,
  ] = useState(false);

  const {
    data: notifications = [],
    isLoading,
  } =
    useGetMyNotificationsQuery(
      userId,
      {
        skip: !userId,
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
        markAllLoading,
    },
  ] =
    useMarkAllNotificationsReadMutation();

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (item) =>
            !item.is_read
        ).length,
      [notifications]
    );

  const latestNotifications =
    useMemo(
      () =>
        [...notifications]
          .sort(
            (a, b) =>
              new Date(
                b.created_at || 0
              ).getTime() -
              new Date(
                a.created_at || 0
              ).getTime()
          )
          .slice(0, 5),
      [notifications]
    );

  useEffect(() => {
    function handlePointerDown(
      event
    ) {
      if (
        !containerRef.current?.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(
      event
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener(
        "mousedown",
        handlePointerDown
      );

      document.addEventListener(
        "keydown",
        handleKeyDown
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);

  async function handleOpen(
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
    } catch (error) {
      console.error(
        "Notification read error:",
        error
      );
    }

    setOpen(false);

    if (notification.task_id) {
      navigate(
        `/tasks/${notification.task_id}`
      );
      return;
    }

    if (notification.project_id) {
      navigate(
        `/projects/${notification.project_id}`
      );
      return;
    }

    navigate(
      "/notifications"
    );
  }

  async function handleMarkAll() {
    if (
      unreadCount === 0 ||
      markAllLoading
    ) {
      return;
    }

    try {
      await markAllNotificationsRead().unwrap();
    } catch (error) {
      console.error(
        "Mark all notifications error:",
        error
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
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
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Notifications"
      >
        <Bell className="size-5" />

        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground ring-2 ring-background">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications preview"
          className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl"
        >
          {/* Header */}

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
                handleMarkAll
              }
              disabled={
                unreadCount === 0 ||
                markAllLoading
              }
            >
              <Check className="size-3.5" />
              Mark all read
            </Button>
          </div>

          {/* Content */}

          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({
                length: 3,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-xl p-2"
                  >
                    <div className="flex gap-3">
                      <div className="size-9 rounded-xl bg-muted" />

                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-28 rounded bg-muted" />
                        <div className="h-3 w-full rounded bg-muted" />
                        <div className="h-3 w-2/3 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : latestNotifications.length ===
            0 ? (
            <div className="flex min-h-44 flex-col items-center justify-center px-6 py-8 text-center">
              <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted">
                <Bell className="size-5 text-muted-foreground" />
              </div>

              <p className="text-sm font-medium">
                No notifications yet
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                New activity will appear here.
              </p>
            </div>
          ) : (
            <div className="max-h-[390px] overflow-y-auto p-2">
              {latestNotifications.map(
                (notification) => {
                  const Icon =
                    getNotificationIcon(
                      notification.notification_type
                    );

                  const isUnread =
                    !notification.is_read;

                  return (
                    <button
                      key={
                        notification.id
                      }
                      type="button"
                      onClick={() =>
                        handleOpen(
                          notification
                        )
                      }
                      className={[
                        "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                        "hover:bg-muted",
                        isUnread
                          ? "bg-primary/[0.04]"
                          : "",
                      ].join(
                        " "
                      )}
                    >
                      <div
                        className={[
                          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                          isUnread
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        ].join(
                          " "
                        )}
                      >
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={[
                              "truncate text-sm",
                              isUnread
                                ? "font-semibold"
                                : "font-medium",
                            ].join(
                              " "
                            )}
                          >
                            {notification.title ||
                              "Notification"}
                          </p>

                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatTime(
                              notification.created_at
                            )}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {notification.message ||
                            "You have a new notification."}
                        </p>

                        {isUnread && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-primary">
                            <span className="size-1.5 rounded-full bg-primary" />
                            Unread
                          </div>
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}

          {/* Footer */}

          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-center"
              onClick={() => {
                setOpen(false);
                navigate(
                  "/notifications"
                );
              }}
            >
              View all notifications
              <ExternalLink className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

