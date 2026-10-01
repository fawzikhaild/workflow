
import { supabase } from "@/lib/supabaseClient";

import {
  apiSlice,
} from "./apiBase";

import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";


const notificationsApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({

      // ======================================================
      // Get notifications
      // ======================================================

      getMyNotifications:
        builder.query({
          async queryFn(
            userId
          ) {
            if (!userId) {
              return {
                error: {
                  status:
                    "INVALID_USER",
                  message:
                    "User ID is required.",
                },
              };
            }

            const {
              user,
              error:
                authError,
            } =
              await getAuthenticatedUser(
                userId
              );

            if (authError) {
              return {
                error:
                  authError,
              };
            }

            if (!user) {
              return {
                error: {
                  status:
                    "UNAUTHORIZED",
                  message:
                    "You are not authenticated.",
                },
              };
            }

            const {
              data,
              error,
            } =
              await supabase
                .from(
                  "notifications"
                )
                .select(
                  `
                    id,
                    user_id,
                    actor_id,
                    title,
                    message,
                    notification_type,
                    task_id,
                    project_id,
                    is_read,
                    created_at
                  `
                )
                .eq(
                  "user_id",
                  user.id
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                );

            if (error) {
              return apiError(
                error,
                "NOTIFICATIONS_ERROR"
              );
            }

            return {
              data:
                data || [],
            };
          },

          providesTags: [
            {
              type:
                "Notifications",
              id: "LIST",
            },
          ],
        }),


      // ======================================================
      // Mark one as read
      // ======================================================

      markNotificationRead:
        builder.mutation({
          async queryFn(
            notificationId
          ) {
            if (
              !notificationId
            ) {
              return {
                error: {
                  status:
                    "INVALID_NOTIFICATION",
                  message:
                    "Notification ID is required.",
                },
              };
            }

            const {
              user,
              error:
                authError,
            } =
              await getAuthenticatedUser();

            if (authError) {
              return {
                error:
                  authError,
              };
            }

            if (!user) {
              return {
                error: {
                  status:
                    "UNAUTHORIZED",
                  message:
                    "You are not authenticated.",
                },
              };
            }

            const {
              data,
              error,
            } =
              await supabase
                .from(
                  "notifications"
                )
                .update({
                  is_read:
                    true,
                })
                .eq(
                  "id",
                  notificationId
                )
                .eq(
                  "user_id",
                  user.id
                )
                .select(
                  "*"
                )
                .single();

            if (error) {
              return apiError(
                error,
                "MARK_NOTIFICATION_ERROR"
              );
            }

            return {
              data,
            };
          },

          invalidatesTags: [
            {
              type:
                "Notifications",
              id: "LIST",
            },
          ],
        }),


      // ======================================================
      // Mark all as read
      // ======================================================

      markAllNotificationsRead:
        builder.mutation({
          async queryFn() {
            const {
              user,
              error:
                authError,
            } =
              await getAuthenticatedUser();

            if (authError) {
              return {
                error:
                  authError,
              };
            }

            if (!user) {
              return {
                error: {
                  status:
                    "UNAUTHORIZED",
                  message:
                    "You are not authenticated.",
                },
              };
            }

            const {
              error,
            } =
              await supabase
                .from(
                  "notifications"
                )
                .update({
                  is_read:
                    true,
                })
                .eq(
                  "user_id",
                  user.id
                )
                .eq(
                  "is_read",
                  false
                );

            if (error) {
              return apiError(
                error,
                "MARK_ALL_NOTIFICATIONS_ERROR"
              );
            }

            return {
              data: true,
            };
          },

          invalidatesTags: [
            {
              type:
                "Notifications",
              id: "LIST",
            },
          ],
        }),
    }),
  });


export const {
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;

