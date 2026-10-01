
import { supabase } from "@/lib/supabaseClient";

import { apiSlice } from "./apiBase";
import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";

const projectsApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      // =======================================================
      // Get all projects visible to the current user
      // =======================================================

      getMyProjects: builder.query({
        async queryFn(userId) {
          if (!userId) {
            return {
              error: {
                status: "INVALID_USER",
                message:
                  "User ID is required.",
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
            .from("projects")
            .select(`
              id,
              team_id,
              owner_id,
              name,
              description,
              status,
              start_date,
              due_date,
              created_at,
              updated_at,
              teams (
                id,
                name
              )
            `)
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

          if (error) {
            return apiError(
              error,
              "PROJECTS_ERROR"
            );
          }

          return {
            data: (data || [])
              .map(
                (project) => ({
                  ...project,
                  team:
                    project.teams,
                })
              ),
          };
        },

        providesTags: (
          _result,
          _error,
          userId
        ) => [
          {
            type: "Projects",
            id: userId,
          },
        ],
      }),

      // =======================================================
      // Get single project
      // =======================================================

      getProjectById: builder.query({
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
                  "INVALID_PROJECT",
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
            data,
            error,
          } = await supabase
            .from("projects")
            .select(`
              id,
              team_id,
              owner_id,
              name,
              description,
              status,
              start_date,
              due_date,
              created_at,
              updated_at,
              teams (
                id,
                name,
                description
              )
            `)
            .eq(
              "id",
              projectId
            )
            .single();

          if (error) {
            return apiError(
              error,
              "PROJECT_ERROR"
            );
          }

          return {
            data: {
              ...data,
              team:
                data.teams,
            },
          };
        },

        providesTags: (
          _result,
          _error,
          arg
        ) => [
          {
            type: "Projects",
            id: arg.projectId,
          },
        ],
      }),

      // =======================================================
      // Create project
      // =======================================================

      createProject:
        builder.mutation({
          async queryFn({
            teamId,
            name,
            description = "",
            status = "planning",
            startDate = null,
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
              .from("projects")
              .insert({
                team_id:
                  teamId,

                owner_id:
                  user.id,

                name:
                  name.trim(),

                description:
                  description.trim() ||
                  null,

                status,

                start_date:
                  startDate ||
                  null,

                due_date:
                  dueDate ||
                  null,
              })
              .select(`
                id,
                team_id,
                owner_id,
                name,
                description,
                status,
                start_date,
                due_date,
                created_at,
                updated_at,
                teams (
                  id,
                  name
                )
              `)
              .single();

            if (error) {
              return apiError(
                error,
                "CREATE_PROJECT_ERROR"
              );
            }

            return {
              data: {
                ...data,
                team:
                  data.teams,
              },
            };
          },

          invalidatesTags: [
            "Projects",
          ],
        }),

      // =======================================================
      // Update project
      // =======================================================

      updateProject:
        builder.mutation({
          async queryFn({
            id,
            name,
            description = "",
            status,
            startDate = null,
            dueDate = null,
          }) {
            const {
              data,
              error,
            } = await supabase
              .from("projects")
              .update({
                name:
                  name.trim(),

                description:
                  description.trim() ||
                  null,

                status,

                start_date:
                  startDate ||
                  null,

                due_date:
                  dueDate ||
                  null,
              })
              .eq(
                "id",
                id
              )
              .select(`
                id,
                team_id,
                owner_id,
                name,
                description,
                status,
                start_date,
                due_date,
                created_at,
                updated_at,
                teams (
                  id,
                  name
                )
              `)
              .single();

            if (error) {
              return apiError(
                error,
                "UPDATE_PROJECT_ERROR"
              );
            }

            return {
              data: {
                ...data,
                team:
                  data.teams,
              },
            };
          },

          invalidatesTags: [
            "Projects",
          ],
        }),

      // =======================================================
      // Delete project
      // =======================================================

      deleteProject:
        builder.mutation({
          async queryFn(id) {
            const {
              error,
            } = await supabase
              .from("projects")
              .delete()
              .eq(
                "id",
                id
              );

            if (error) {
              return apiError(
                error,
                "DELETE_PROJECT_ERROR"
              );
            }

            return {
              data: id,
            };
          },

          invalidatesTags: [
            "Projects",
          ],
        }),
    }),
  });

export const {
  useGetMyProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectsApi;
