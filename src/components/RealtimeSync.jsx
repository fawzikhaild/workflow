
import { useEffect } from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  supabase,
} from "@/lib/supabaseClient";

import {
  apiSlice,
} from "@/store/api/apiSlice";

export default function RealtimeSync() {
  const dispatch = useDispatch();

  const userId = useSelector(
    (state) => state.auth.user?.id
  );

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    /*
     * Important:
     * Supabase reuses a channel when the same
     * topic/name is requested more than once.
     *
     * React StrictMode can run effects more than
     * once in development, so use a unique topic
     * for every mounted RealtimeSync instance.
     */
    const channelName =
      `workflow-db-${userId}-${crypto.randomUUID()}`;

    const invalidateNotifications = () => {
      dispatch(
        apiSlice.util.invalidateTags([
          "Notifications",
        ])
      );
    };

    const invalidateTasks = () => {
      dispatch(
        apiSlice.util.invalidateTags([
          "Tasks",
          "ActivityLogs",
          "Notifications",
        ])
      );
    };

    const invalidateComments = () => {
      dispatch(
        apiSlice.util.invalidateTags([
          "Comments",
          "ActivityLogs",
          "Notifications",
        ])
      );
    };

    const invalidateProjects = () => {
      dispatch(
        apiSlice.util.invalidateTags([
          "Projects",
          "ActivityLogs",
        ])
      );
    };

    const invalidateActivity = () => {
      dispatch(
        apiSlice.util.invalidateTags([
          "ActivityLogs",
        ])
      );
    };

    /*
     * Register ALL postgres_changes listeners
     * BEFORE subscribe().
     */
    const channel =
      supabase
        .channel(channelName)

        // =========================
        // Tasks
        // =========================

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks",
          },
          invalidateTasks
        )

        // =========================
        // Comments
        // =========================

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "comments",
          },
          invalidateComments
        )

        // =========================
        // Projects
        // =========================

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
          },
          invalidateProjects
        )

        // =========================
        // Activity Logs
        // =========================

        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activity_logs",
          },
          invalidateActivity
        )

        // =========================
        // Notifications
        // =========================

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          invalidateNotifications
        );

    // =========================
    // Subscribe
    // =========================

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.info(
          "WorkFlow Realtime connected."
        );
      }

      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT"
      ) {
        console.error(
          "WorkFlow Realtime connection error:",
          status
        );
      }

      if (status === "CLOSED") {
        console.info(
          "WorkFlow Realtime channel closed."
        );
      }
    });

    // =========================
    // Cleanup
    // =========================

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [dispatch, userId]);

  return null;
}

