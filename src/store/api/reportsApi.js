import { supabase } from "@/lib/supabaseClient";

import { apiSlice } from "./apiBase";

import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";

export const reportsApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      getReportsData: builder.query({
        async queryFn() {
          // Always derive identity from the
          // authenticated Supabase session.
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

          // RLS determines which projects
          // the current user is allowed to read.
          const {
            data: projects,
            error: projectsError,
          } = await supabase
            .from("projects")
            .select(`
              id,
              team_id,
              owner_id,
              name,
              status,
              start_date,
              due_date,
              created_at,
              teams (
                id,
                name
              )
            `)
            .order("created_at", {
              ascending: false,
            });

          if (projectsError) {
            return apiError(
              projectsError,
              "REPORT_PROJECTS_ERROR"
            );
          }

          const visibleProjects =
            projects || [];

          const projectIds = [
            ...new Set(
              visibleProjects.map(
                (project) => project.id
              )
            ),
          ];

          const teamIds = [
            ...new Set(
              visibleProjects
                .map((project) => project.team_id)
                .filter(Boolean)
            ),
          ];

          // Keep a stable response shape when
          // the user has no visible projects.
          if (projectIds.length === 0) {
            return {
              data: {
                projects: [],
                tasks: [],
                members: [],
              },
            };
          }

          // Both queries remain subject to RLS.
          const [
            tasksResult,
            membersResult,
          ] = await Promise.all([
            supabase
              .from("tasks")
              .select(`
                id,
                project_id,
                created_by,
                title,
                status,
                priority,
                assignee_id,
                due_date,
                created_at,
                updated_at
              `)
              .in("project_id", projectIds)
              .order("created_at", {
                ascending: false,
              }),

            supabase
              .from("team_members")
              .select(`
                team_id,
                user_id,
                role,
                created_at
              `)
              .in("team_id", teamIds),
          ]);

          if (tasksResult.error) {
            return apiError(
              tasksResult.error,
              "REPORT_TASKS_ERROR"
            );
          }

          if (membersResult.error) {
            return apiError(
              membersResult.error,
              "REPORT_MEMBERS_ERROR"
            );
          }

          return {
            data: {
              projects: visibleProjects.map(
                (project) => ({
                  ...project,
                  team: project.teams || null,
                })
              ),
              tasks: tasksResult.data || [],
              members: membersResult.data || [],
            },
          };
        },

        providesTags: [
          "Projects",
          "Tasks",
          "TeamMembers",
        ],
      }),
    }),
  });

export const {
  useGetReportsDataQuery,
} = reportsApi;