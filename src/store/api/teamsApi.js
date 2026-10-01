

import { supabase } from "@/lib/supabaseClient";

import { apiSlice } from "./apiBase";
import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";

const teamsApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      // -------------------------------------------------------
      // Get current user's teams
      // -------------------------------------------------------

      getMyTeams: builder.query({
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
            .from("team_members")
            .select(`
              role,
              created_at,
              teams (
                id,
                name,
                description,
                owner_id,
                created_at,
                updated_at
              )
            `)
            .eq(
              "user_id",
              userId
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

          if (error) {
            return apiError(
              error,
              "TEAMS_ERROR"
            );
          }

          return {
            data: (data || [])
              .filter(
                (item) =>
                  item.teams
              )
              .map(
                (item) => ({
                  ...item.teams,
                  memberRole:
                    item.role,
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
            type: "Teams",
            id: userId,
          },
        ],
      }),

      // -------------------------------------------------------
      // Create team
      // -------------------------------------------------------

      createTeam: builder.mutation({
        async queryFn({
          name,
          description = "",
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
            .from("teams")
            .insert({
              owner_id: user.id,
              name: name.trim(),
              description:
                description.trim() ||
                null,
            })
            .select()
            .single();

          if (error) {
            return apiError(
              error,
              "CREATE_TEAM_ERROR"
            );
          }

          return {
            data,
          };
        },

        invalidatesTags: [
          "Teams",
        ],
      }),

      // -------------------------------------------------------
      // Update team
      // -------------------------------------------------------

      updateTeam: builder.mutation({
        async queryFn({
          id,
          name,
          description = "",
        }) {
          const {
            data,
            error,
          } = await supabase
            .from("teams")
            .update({
              name: name.trim(),
              description:
                description.trim() ||
                null,
            })
            .eq("id", id)
            .select()
            .single();

          if (error) {
            return apiError(
              error,
              "UPDATE_TEAM_ERROR"
            );
          }

          return {
            data,
          };
        },

        invalidatesTags: [
          "Teams",
        ],
      }),

      // -------------------------------------------------------
      // Delete team
      // -------------------------------------------------------

      deleteTeam: builder.mutation({
        async queryFn(id) {
          const {
            error,
          } = await supabase
            .from("teams")
            .delete()
            .eq("id", id);

          if (error) {
            return apiError(
              error,
              "DELETE_TEAM_ERROR"
            );
          }

          return {
            data: id,
          };
        },

        invalidatesTags: [
          "Teams",
        ],
      }),
    }),
  });

export const {
  useGetMyTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
} = teamsApi;
