
import { supabase } from "@/lib/supabaseClient";

import { apiSlice } from "./apiBase";
import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";

const profileApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      getMyProfile: builder.query({
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
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (error) {
            return apiError(
              error,
              "PROFILE_ERROR"
            );
          }

          return {
            data,
          };
        },

        providesTags: (
          _result,
          _error,
          userId
        ) => [
          {
            type: "Profile",
            id: userId,
          },
        ],
      }),
    }),
  });

export const {
  useGetMyProfileQuery,
} = profileApi;



