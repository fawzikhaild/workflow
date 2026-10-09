
import { supabase } from "@/lib/supabaseClient";

import { apiSlice } from "./apiBase";

import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";

const MAX_IMPORT_ROWS = 500;

const ALLOWED_STATUSES = new Set([
  "todo",
  "in_progress",
  "review",
  "done",
]);

const ALLOWED_PRIORITIES = new Set([
  "low",
  "medium",
  "high",
  "urgent",
]);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidDateOnly(value) {
  if (value === null) {
    return true;
  }

  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const parsed = new Date(
    `${value}T00:00:00.000Z`
  );

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validateTasks(tasks) {
  if (!Array.isArray(tasks)) {
    return "The task list is invalid.";
  }

  if (
    tasks.length === 0 ||
    tasks.length > MAX_IMPORT_ROWS
  ) {
    return `Import between 1 and ${MAX_IMPORT_ROWS} valid tasks per batch.`;
  }

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    const rowNumber = index + 1;

    if (
      !task ||
      typeof task.title !== "string" ||
      !task.title.trim()
    ) {
      return `Task ${rowNumber} has no valid title.`;
    }

    if (task.title.trim().length > 500) {
      return `Task ${rowNumber} has a title that is too long.`;
    }

    if (
      task.description !== null &&
      task.description !== undefined &&
      (
        typeof task.description !== "string" ||
        task.description.length > 10000
      )
    ) {
      return `Task ${rowNumber} has an invalid description.`;
    }

    if (
      !ALLOWED_STATUSES.has(task.status)
    ) {
      return `Task ${rowNumber} has an unsupported status.`;
    }

    if (
      !ALLOWED_PRIORITIES.has(task.priority)
    ) {
      return `Task ${rowNumber} has an unsupported priority.`;
    }

    if (!isValidDateOnly(task.due_date ?? null)) {
      return `Task ${rowNumber} has an invalid due date.`;
    }

    if (
      task.assignee_id &&
      (
        typeof task.assignee_id !== "string" ||
        !UUID_REGEX.test(task.assignee_id)
      )
    ) {
      return `Task ${rowNumber} has an invalid assignee ID.`;
    }
  }

  return null;
}

export const taskImportApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      bulkImportTasks: builder.mutation({
        async queryFn({
          projectId,
          tasks,
        }) {
          // Always verify the actual Supabase session.
          const {
            user,
            error: authError,
          } = await getAuthenticatedUser();

          if (authError) {
            return {
              error: authError,
            };
          }

          if (!user) {
            return {
              error: {
                status: "UNAUTHORIZED",
                message: "You are not authenticated.",
              },
            };
          }

          if (
            typeof projectId !== "string" ||
            !UUID_REGEX.test(projectId)
          ) {
            return {
              error: {
                status: "VALIDATION_ERROR",
                message: "Select a valid project.",
              },
            };
          }

          const validationError =
            validateTasks(tasks);

          if (validationError) {
            return {
              error: {
                status: "VALIDATION_ERROR",
                message: validationError,
              },
            };
          }

          // Select only a project visible under the current
          // user's RLS policies.
          const {
            data: project,
            error: projectError,
          } = await supabase
            .from("projects")
            .select("id, team_id")
            .eq("id", projectId)
            .maybeSingle();

          if (projectError) {
            return apiError(
              projectError,
              "PROJECT_ACCESS_ERROR"
            );
          }

          if (!project) {
            return {
              error: {
                status: "PROJECT_NOT_FOUND",
                message: "The selected project is unavailable.",
              },
            };
          }

          const assigneeIds = [
            ...new Set(
              tasks
                .map((task) => task.assignee_id)
                .filter(Boolean)
            ),
          ];

          // An assignee must belong to the selected project's team.
          if (assigneeIds.length > 0) {
            if (!project.team_id) {
              return {
                error: {
                  status: "INVALID_ASSIGNEE",
                  message: "Task assignees could not be verified.",
                },
              };
            }

            const {
              data: memberships,
              error: membershipsError,
            } = await supabase
              .from("team_members")
              .select("user_id")
              .eq("team_id", project.team_id)
              .in("user_id", assigneeIds);

            // Fail closed if membership cannot be verified.
            if (membershipsError) {
              return {
                error: {
                  status: "MEMBER_VALIDATION_FAILED",
                  message: "Unable to verify task assignees.",
                },
              };
            }

            const allowedAssignees = new Set(
              (memberships || []).map(
                (membership) => membership.user_id
              )
            );

            const hasInvalidAssignee =
              assigneeIds.some(
                (assigneeId) =>
                  !allowedAssignees.has(assigneeId)
              );

            if (hasInvalidAssignee) {
              return {
                error: {
                  status: "INVALID_ASSIGNEE",
                  message:
                    "Every assignee must be a member of the selected project's team.",
                },
              };
            }
          }

          // Construct database rows explicitly. Never trust
          // created_by, project_id, or any extra file columns.
          const insertRows = tasks.map((task) => ({
            project_id: project.id,
            created_by: user.id,
            title: task.title.trim(),
            description:
              task.description?.trim() || null,
            status: task.status,
            priority: task.priority,
            assignee_id: task.assignee_id || null,
            due_date: task.due_date || null,
          }));

          // One INSERT statement: the batch is not split
          // into independently committed partial batches.
          const {
            error: insertError,
          } = await supabase
            .from("tasks")
            .insert(insertRows);

          if (insertError) {
            return apiError(
              insertError,
              "TASK_IMPORT_FAILED"
            );
          }

          return {
            data: {
              importedCount: insertRows.length,
              projectId: project.id,
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
          "Tasks",
        ],
      }),
    }),
  });

export const {
  useBulkImportTasksMutation,
} = taskImportApi;

