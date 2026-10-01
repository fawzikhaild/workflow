
import { supabase } from "@/lib/supabaseClient";

import {
  apiSlice,
} from "./apiBase";

import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";


const projectPermissionsApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      getMyProjectAccess:
        builder.query({
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
                    "INVALID_PROJECT_PERMISSION_QUERY",

                  message:
                    "Project ID and user ID are required.",
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
              console.error(
                "Project permissions auth error:",
                authError
              );

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
              await supabase.rpc(
                "get_my_project_access",
                {
                  p_project_id:
                    projectId,
                }
              );


            if (error) {
              console.error(
                "Project permissions RPC error:",
                error
              );

              return apiError(
                error,
                "PROJECT_PERMISSION_ERROR"
              );
            }


            const access =
              Array.isArray(data)
                ? data[0] || null
                : data || null;


            if (!access) {
              return {
                error: {
                  status:
                    "NO_PROJECT_ACCESS",

                  message:
                    "You do not have access to this project.",
                },
              };
            }


            return {
              data: access,
            };
          },


          providesTags: (
            _result,
            _error,
            arg
          ) => [
            {
              type:
                "ProjectPermissions",

              id: `${arg?.projectId}:${arg?.userId}`,
            },
          ],
        }),
    }),
  });


export const {
  useGetMyProjectAccessQuery,
} =
  projectPermissionsApi;

