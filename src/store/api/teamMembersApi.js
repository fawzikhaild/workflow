

import { supabase } from "@/lib/supabaseClient";

import { apiSlice } from "./apiBase";
import { apiError } from "./apiHelpers";

const teamMembersApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      // -------------------------------------------------------
      // Get team members
      // -------------------------------------------------------

      getTeamMembers: builder.query({
        async queryFn(teamId) {
          if (!teamId) {
            return {
              error: {
                status: "INVALID_TEAM",
                message:
                  "Team ID is required.",
              },
            };
          }

          const {
            data,
            error,
          } = await supabase
            .from("team_members")
            .select(`
              user_id,
              role,
              created_at,
              profiles (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq(
              "team_id",
              teamId
            )
            .order(
              "created_at",
              {
                ascending: true,
              }
            );

          if (error) {
            return apiError(
              error,
              "TEAM_MEMBERS_ERROR"
            );
          }

          return {
            data: (data || [])
              .map(
                (member) => ({
                  user_id:
                    member.user_id,
                  role:
                    member.role,
                  created_at:
                    member.created_at,
                  profile:
                    member.profiles,
                })
              ),
          };
        },

        providesTags: (
          _result,
          _error,
          teamId
        ) => [
          {
            type: "TeamMembers",
            id: teamId,
          },
        ],
      }),

      // -------------------------------------------------------
      // Add member
      // -------------------------------------------------------

      addTeamMember: builder.mutation({
        async queryFn({
          teamId,
          email,
          role = "member",
        }) {
          const {
            data,
            error,
          } = await supabase.rpc(
            "add_team_member_by_email",
            {
              p_team_id:
                teamId,

              p_email:
                email.trim(),

              p_role:
                role,
            }
          );

          if (error) {
            return apiError(
              error,
              "ADD_MEMBER_ERROR"
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
            type: "TeamMembers",
            id: arg.teamId,
          },

          "Teams",
        ],
      }),

      // -------------------------------------------------------
      // Update member role
      // -------------------------------------------------------

      updateTeamMemberRole:
        builder.mutation({
          async queryFn({
            teamId,
            userId,
            role,
          }) {
            const {
              data,
              error,
            } = await supabase.rpc(
              "update_team_member_role",
              {
                p_team_id:
                  teamId,

                p_user_id:
                  userId,

                p_role:
                  role,
              }
            );

            if (error) {
              return apiError(
                error,
                "UPDATE_MEMBER_ERROR"
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
              type: "TeamMembers",
              id: arg.teamId,
            },

            "Teams",
          ],
        }),

      // -------------------------------------------------------
      // Remove member
      // -------------------------------------------------------

      removeTeamMember:
        builder.mutation({
          async queryFn({
            teamId,
            userId,
          }) {
            const {
              data,
              error,
            } = await supabase.rpc(
              "remove_team_member",
              {
                p_team_id:
                  teamId,

                p_user_id:
                  userId,
              }
            );

            if (error) {
              return apiError(
                error,
                "REMOVE_MEMBER_ERROR"
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
              type: "TeamMembers",
              id: arg.teamId,
            },

            "Teams",
          ],
        }),
    }),
  });

export const {
  useGetTeamMembersQuery,
  useAddTeamMemberMutation,
  useUpdateTeamMemberRoleMutation,
  useRemoveTeamMemberMutation,
} = teamMembersApi;

