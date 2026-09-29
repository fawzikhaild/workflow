
import {
  createApi,
  fakeBaseQuery,
} from "@reduxjs/toolkit/query/react";

import { supabase } from "@/lib/supabaseClient";

export const apiSlice = createApi({
  reducerPath: "api",

  baseQuery: fakeBaseQuery(),

  tagTypes: [
    "Profile",
    "Teams",
    "Projects",
    "Tasks",
    "Comments",
    "Notifications",
  ],

  endpoints: (builder) => ({
    // =========================================================
    // PROFILE
    // =========================================================

    getMyProfile: builder.query({
      async queryFn() {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          return {
            error: {
              status: "AUTH_ERROR",
              message: userError.message,
            },
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

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          return {
            error: {
              status: error.code || "PROFILE_ERROR",
              message: error.message,
            },
          };
        }

        return {
          data,
        };
      },

      providesTags: ["Profile"],
    }),

    // =========================================================
    // TEAMS
    // =========================================================

    getMyTeams: builder.query({
      async queryFn() {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          return {
            error: {
              status: "AUTH_ERROR",
              message: userError.message,
            },
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

        const { data, error } = await supabase
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
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          return {
            error: {
              status: error.code || "TEAMS_ERROR",
              message: error.message,
            },
          };
        }

        return {
          data: (data || [])
            .filter((item) => item.teams)
            .map((item) => ({
              ...item.teams,
              memberRole: item.role,
            })),
        };
      },

      providesTags: ["Teams"],
    }),

    createTeam: builder.mutation({
      async queryFn({
        name,
        description = "",
      }) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          return {
            error: {
              status: "AUTH_ERROR",
              message: userError.message,
            },
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

        const { data, error } = await supabase
          .from("teams")
          .insert({
            owner_id: user.id,
            name: name.trim(),
            description:
              description.trim() || null,
          })
          .select()
          .single();

        if (error) {
          return {
            error: {
              status: error.code || "CREATE_TEAM_ERROR",
              message: error.message,
            },
          };
        }

        return {
          data,
        };
      },

      invalidatesTags: ["Teams"],
    }),

    updateTeam: builder.mutation({
      async queryFn({
        id,
        name,
        description = "",
      }) {
        const { data, error } = await supabase
          .from("teams")
          .update({
            name: name.trim(),
            description:
              description.trim() || null,
          })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          return {
            error: {
              status: error.code || "UPDATE_TEAM_ERROR",
              message: error.message,
            },
          };
        }

        return {
          data,
        };
      },

      invalidatesTags: ["Teams"],
    }),

    deleteTeam: builder.mutation({
      async queryFn(id) {
        const { error } = await supabase
          .from("teams")
          .delete()
          .eq("id", id);

        if (error) {
          return {
            error: {
              status: error.code || "DELETE_TEAM_ERROR",
              message: error.message,
            },
          };
        }

        return {
          data: id,
        };
      },

      invalidatesTags: ["Teams"],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useGetMyTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
} = apiSlice;

