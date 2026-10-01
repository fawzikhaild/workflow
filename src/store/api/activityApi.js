
import { supabase } from "@/lib/supabaseClient";

import { apiSlice } from "./apiBase";

import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";


const activityApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      getTaskActivity:
        builder.query({
          async queryFn({
            taskId,
            userId,
          }) {
            if (
              !taskId ||
              !userId
            ) {
              return {
                error: {
                  status:
                    "INVALID_ACTIVITY_QUERY",

                  message:
                    "Task ID and user ID are required.",
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
                  "activity_logs"
                )
                .select(
                  "id, user_id, team_id, project_id, task_id, action, metadata, created_at"
                )
                .eq(
                  "task_id",
                  taskId
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
                "ACTIVITY_ERROR"
              );
            }

            return {
              data:
                data || [],
            };
          },

          providesTags: (
            _result,
            _error,
            arg
          ) => [
            {
              type:
                "ActivityLogs",
              id:
                arg?.taskId,
            },
          ],
        }),
    }),
  });


export const {
  useGetTaskActivityQuery,
} = activityApi;

