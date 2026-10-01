
import { supabase } from "@/lib/supabaseClient";

import {
  apiSlice,
} from "./apiBase";

import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";


const commentsApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({

      // ======================================================
      // Get task comments
      // ======================================================

      getTaskComments:
        builder.query({
          async queryFn({
            taskId,
            userId,
          }) {
            if (
              !taskId ||
              !userId
            ) {
              return {
                error: {
                  status:
                    "INVALID_COMMENT_QUERY",

                  message:
                    "Task ID and user ID are required.",
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
              await supabase
                .from("comments")
                .select(
                  "id, task_id, user_id, content, created_at"
                )
                .eq(
                  "task_id",
                  taskId
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      true,
                  }
                );


            if (error) {
              console.error(
                "Get task comments error:",
                error
              );

              return apiError(
                error,
                "COMMENTS_ERROR"
              );
            }


            return {
              data:
                data || [],
            };
          },


          providesTags: (
            _result,
            _error,
            arg
          ) => [
            {
              type:
                "Comments",
              id:
                arg?.taskId,
            },
          ],
        }),


      // ======================================================
      // Add comment
      // ======================================================

      addTaskComment:
        builder.mutation({
          async queryFn({
            taskId,
            content,
          }) {
            if (
              !taskId ||
              !content?.trim()
            ) {
              return {
                error: {
                  status:
                    "INVALID_COMMENT",

                  message:
                    "Task ID and comment content are required.",
                },
              };
            }


            const {
              user,
              error:
                authError,
            } =
              await getAuthenticatedUser();


            if (authError) {
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
              await supabase
                .from("comments")
                .insert({
                  task_id:
                    taskId,

                  user_id:
                    user.id,

                  content:
                    content.trim(),
                })
                .select(
                  "id, task_id, user_id, content, created_at"
                )
                .single();


            if (error) {
              console.error(
                "Add task comment error:",
                error
              );

              return apiError(
                error,
                "ADD_COMMENT_ERROR"
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
              type:
                "Comments",
              id:
                arg?.taskId,
            },

            {
              type:
                "ActivityLogs",
              id:
                arg?.taskId,
            },

            {
              type:
                "Notifications",
              id: "LIST",
            },
          ],
        }),


      // ======================================================
      // Delete comment
      // ======================================================

      deleteTaskComment:
        builder.mutation({
          async queryFn({
            id,
          }) {
            if (!id) {
              return {
                error: {
                  status:
                    "INVALID_COMMENT",

                  message:
                    "Comment ID is required.",
                },
              };
            }


            const {
              user,
              error:
                authError,
            } =
              await getAuthenticatedUser();


            if (authError) {
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
              data: existingComment,
              error:
                existingCommentError,
            } =
              await supabase
                .from("comments")
                .select(
                  "id, task_id, user_id"
                )
                .eq(
                  "id",
                  id
                )
                .single();


            if (
              existingCommentError
            ) {
              return apiError(
                existingCommentError,
                "COMMENT_LOOKUP_ERROR"
              );
            }


            const {
              error,
            } =
              await supabase
                .from("comments")
                .delete()
                .eq(
                  "id",
                  id
                );


            if (error) {
              console.error(
                "Delete task comment error:",
                error
              );

              return apiError(
                error,
                "DELETE_COMMENT_ERROR"
              );
            }


            return {
              data: {
                id,

                taskId:
                  existingComment
                    ?.task_id,

                userId:
                  existingComment
                    ?.user_id,
              },
            };
          },


          invalidatesTags: (
            _result,
            _error,
            arg
          ) => [
            {
              type:
                "Comments",
              id:
                arg?.taskId,
            },

            {
              type:
                "ActivityLogs",
              id:
                arg?.taskId,
            },

            {
              type:
                "Notifications",
              id: "LIST",
            },
          ],
        }),
    }),
  });


export const {
  useGetTaskCommentsQuery,
  useAddTaskCommentMutation,
  useDeleteTaskCommentMutation,
} = commentsApi;

