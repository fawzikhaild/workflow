
import { supabase } from "@/lib/supabaseClient";

import { apiSlice } from "./apiBase";

import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";

const taskSelect = `
  id,
  project_id,
  created_by,
  title,
  description,
  status,
  priority,
  assignee_id,
  due_date,
  created_at,
  updated_at
`;

const tasksApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      // =======================================================
      // Get project tasks
      // =======================================================

      getProjectTasks: builder.query({
        async queryFn({
          projectId,
          userId,
        }) {
          if (
            !projectId ||
            !userId
          ) {
            return {
              error: {
                status:
                  "INVALID_TASK_QUERY",
                message:
                  "Project ID and User ID are required.",
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
                status:
                  "UNAUTHORIZED",
                message:
                  "You are not authenticated.",
              },
            };
          }

          const {
            data: tasks,
            error: tasksError,
          } = await supabase
            .from("tasks")
            .select(taskSelect)
            .eq(
              "project_id",
              projectId
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

          if (tasksError) {
            return apiError(
              tasksError,
              "TASKS_ERROR"
            );
          }

          const assigneeIds = [
            ...new Set(
              (tasks || [])
                .map(
                  (task) =>
                    task.assignee_id
                )
                .filter(Boolean)
            ),
          ];

          let profilesById = {};

          if (
            assigneeIds.length > 0
          ) {
            const {
              data: profiles,
              error: profilesError,
            } = await supabase
              .from("profiles")
              .select(`
                id,
                username,
                full_name,
                avatar_url
              `)
              .in(
                "id",
                assigneeIds
              );

            if (profilesError) {
              return apiError(
                profilesError,
                "TASK_PROFILES_ERROR"
              );
            }

            profilesById = (
              profiles || []
            ).reduce(
              (accumulator, profile) => {
                accumulator[
                  profile.id
                ] = profile;

                return accumulator;
              },
              {}
            );
          }

          return {
            data: (
              tasks || []
            ).map((task) => ({
              ...task,

              assignee:
                task.assignee_id
                  ? profilesById[
                      task.assignee_id
                    ] || null
                  : null,
            })),
          };
        },

        providesTags: (
          _result,
          _error,
          arg
        ) => [
          {
            type: "Tasks",
            id: arg.projectId,
          },
        ],
      }),

      // =======================================================
      // Create task
      // =======================================================

      createTask: builder.mutation({
        async queryFn({
          projectId,
          title,
          description = "",
          status = "todo",
          priority = "medium",
          assigneeId = null,
          dueDate = null,
        }) {
          const {
            user,
            error: authError,
          } =
            await getAuthenticatedUser();

          if (authError) {
            return {
              error: authError,
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
          } = await supabase
            .from("tasks")
            .insert({
              project_id:
                projectId,

              created_by:
                user.id,

              title:
                title.trim(),

              description:
                description.trim() ||
                null,

              status,

              priority,

              assignee_id:
                assigneeId || null,

              due_date:
                dueDate || null,
            })
            .select(taskSelect)
            .single();

          if (error) {
            return apiError(
              error,
              "CREATE_TASK_ERROR"
            );
          }

          return {
            data,
          };
        },

        invalidatesTags: (
          _result,
          _error,
          arg
        ) => [
          {
            type: "Tasks",
            id: arg.projectId,
          },
        ],
      }),

      // =======================================================
      // Update task
      // =======================================================

      updateTask: builder.mutation({
        async queryFn({
          id,
          projectId,
          title,
          description,
          status,
          priority,
          assigneeId,
          dueDate,
        }) {
          const updateData = {};

          if (
            title !== undefined
          ) {
            updateData.title =
              title.trim();
          }

          if (
            description !== undefined
          ) {
            updateData.description =
              description.trim() ||
              null;
          }

          if (
            status !== undefined
          ) {
            updateData.status =
              status;
          }

          if (
            priority !== undefined
          ) {
            updateData.priority =
              priority;
          }

          if (
            assigneeId !== undefined
          ) {
            updateData.assignee_id =
              assigneeId || null;
          }

          if (
            dueDate !== undefined
          ) {
            updateData.due_date =
              dueDate || null;
          }

          const {
            data,
            error,
          } = await supabase
            .from("tasks")
            .update(updateData)
            .eq("id", id)
            .select(taskSelect)
            .single();

          if (error) {
            return apiError(
              error,
              "UPDATE_TASK_ERROR"
            );
          }

          return {
            data,
          };
        },

        invalidatesTags: (
          _result,
          _error,
          arg
        ) =>
          arg.projectId
            ? [
                {
                  type: "Tasks",
                  id: arg.projectId,
                },
              ]
            : ["Tasks"],
      }),

      // =======================================================
      // Delete task
      // =======================================================

      deleteTask: builder.mutation({
        async queryFn({
          id,
          projectId,
        }) {
          const {
            error,
          } = await supabase
            .from("tasks")
            .delete()
            .eq("id", id);

          if (error) {
            return apiError(
              error,
              "DELETE_TASK_ERROR"
            );
          }

          return {
            data: {
              id,
              projectId,
            },
          };
        },

        invalidatesTags: (
          _result,
          _error,
          arg
        ) => [
          {
            type: "Tasks",
            id: arg.projectId,
          },
        ],
      }),
    }),
  });

export const {
  useGetProjectTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = tasksApi;


