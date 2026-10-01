import { supabase } from "@/lib/supabaseClient";

import { apiSlice } from "./apiBase";

import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";

const taskDetailsApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      getTaskById: builder.query({
        async queryFn({
          taskId,
          userId,
        }) {
          if (!taskId || !userId) {
            return {
              error: {
                status: "INVALID_TASK",
                message:
                  "Task ID and user ID are required.",
              },
            };
          }

          const {
            user,
            error: authError,
          } =
            await getAuthenticatedUser(
              userId
            );

          if (authError) {
            return {
              error: authError,
            };
          }

          if (!user) {
            return {
              error: {
                status: "UNAUTHORIZED",
                message:
                  "You are not authenticated.",
              },
            };
          }

          const {
            data,
            error,
          } = await supabase
            .from("tasks")
            .select("*")
            .eq("id", taskId)
            .single();

          if (error) {
            return apiError(
              error,
              "TASK_ERROR"
            );
          }

          return {
            data,
          };
        },

        providesTags: (
          _result,
          _error,
          arg
        ) => [
          {
            type: "Tasks",
            id: arg?.taskId,
          },
        ],
      }),
    }),
  });

export const {
  useGetTaskByIdQuery,
} = taskDetailsApi;