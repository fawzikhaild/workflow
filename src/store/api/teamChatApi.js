
import {
  apiSlice,
} from "@/store/api/apiBase";

import {
  supabase,
} from "@/lib/supabaseClient";

import {
  apiError,
  getAuthenticatedUser,
} from "@/store/api/apiHelpers";

const CHAT_BUCKET =
  "team-chat";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const MAX_FILES =
  5;

function sanitizeFileName(
  fileName = "file"
) {
  const cleaned =
    fileName
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .slice(0, 120);

  return (
    cleaned ||
    "file"
  );
}

async function getTeamMemberIds(
  teamId
) {
  const {
    data,
    error,
  } =
    await supabase
      .from("team_members")
      .select("user_id")
      .eq(
        "team_id",
        teamId
      );

  if (error) {
    throw error;
  }

  return (
    data || []
  ).map(
    (member) =>
      member.user_id
  );
}

async function createMentionRows({
  messageId,
  teamId,
  userId,
  mentionedUserIds,
}) {
  const uniqueIds = [
    ...new Set(
      (mentionedUserIds || [])
        .filter(Boolean)
    ),
  ];

  if (
    uniqueIds.length ===
    0
  ) {
    return null;
  }

  const memberIds =
    await getTeamMemberIds(
      teamId
    );

  const validIds =
    uniqueIds.filter(
      (id) =>
        memberIds.includes(id) &&
        id !== userId
    );

  if (
    validIds.length ===
    0
  ) {
    return null;
  }

  const rows =
    validIds.map(
      (mentionedUserId) => ({
        message_id:
          messageId,

        team_id:
          teamId,

        mentioned_user_id:
          mentionedUserId,

        created_by:
          userId,
      })
    );

  const {
    error,
  } =
    await supabase
      .from(
        "chat_message_mentions"
      )
      .insert(rows);

  if (error) {
    throw error;
  }

  return rows;
}

async function uploadChatFiles({
  teamId,
  userId,
  messageId,
  files,
}) {
  if (
    !files ||
    files.length ===
      0
  ) {
    return [];
  }

  if (
    files.length >
    MAX_FILES
  ) {
    throw new Error(
      `You can attach up to ${MAX_FILES} files.`
    );
  }

  const uploadedPaths =
    [];

  const attachmentRows =
    [];

  try {
    for (
      const file of files
    ) {
      if (
        !(file instanceof File)
      ) {
        throw new Error(
          "Invalid attachment."
        );
      }

      if (
        file.size <= 0
      ) {
        throw new Error(
          `"${file.name}" is empty.`
        );
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        throw new Error(
          `"${file.name}" is larger than 10 MB.`
        );
      }

      const safeName =
        sanitizeFileName(
          file.name
        );

      const path =
        `${teamId}/${userId}/${crypto.randomUUID()}-${safeName}`;

      const {
        error,
      } =
        await supabase
          .storage
          .from(
            CHAT_BUCKET
          )
          .upload(
            path,
            file,
            {
              cacheControl:
                "3600",

              contentType:
                file.type ||
                "application/octet-stream",

              upsert:
                false,
            }
          );

      if (error) {
        throw error;
      }

      uploadedPaths.push(
        path
      );

      attachmentRows.push({
        message_id:
          messageId,

        team_id:
          teamId,

        uploaded_by:
          userId,

        storage_path:
          path,

        file_name:
          file.name,

        mime_type:
          file.type ||
          null,

        file_size:
          file.size,
      });
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "chat_message_attachments"
        )
        .insert(
          attachmentRows
        )
        .select("*");

    if (error) {
      throw error;
    }

    return data || [];
  } catch (
    error
  ) {
    if (
      uploadedPaths.length >
      0
    ) {
      await supabase
        .storage
        .from(
          CHAT_BUCKET
        )
        .remove(
          uploadedPaths
        );
    }

    throw error;
  }
}

const teamChatApi =
  apiSlice.injectEndpoints({
    endpoints: (
      builder
    ) => ({
      // ========================================================
      // Get messages
      // ========================================================

      getTeamChatMessages:
        builder.query({
          async queryFn({
            teamId,
            userId,
          }) {
            if (
              !teamId ||
              !userId
            ) {
              return {
                error: {
                  status:
                    "INVALID_CHAT_REQUEST",

                  message:
                    "Team ID and user ID are required.",
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

            if (
              authError
            ) {
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
              data:
                messagesData,
              error:
                messagesError,
            } =
              await supabase
                .from(
                  "chat_messages"
                )
                .select(
                  [
                    "id",
                    "team_id",
                    "sender_id",
                    "content",
                    "reply_to_id",
                    "created_at",
                    "updated_at",
                    "edited_at",
                  ].join(",")
                )
                .eq(
                  "team_id",
                  teamId
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      true,
                  }
                );

            if (
              messagesError
            ) {
              return apiError(
                messagesError,
                "CHAT_MESSAGES_ERROR"
              );
            }

            const messages =
              messagesData ||
              [];

            const {
              data:
                attachmentsData,
              error:
                attachmentsError,
            } =
              await supabase
                .from(
                  "chat_message_attachments"
                )
                .select("*")
                .eq(
                  "team_id",
                  teamId
                );

            if (
              attachmentsError
            ) {
              return apiError(
                attachmentsError,
                "CHAT_ATTACHMENTS_ERROR"
              );
            }

            const {
              data:
                mentionsData,
              error:
                mentionsError,
            } =
              await supabase
                .from(
                  "chat_message_mentions"
                )
                .select("*")
                .eq(
                  "team_id",
                  teamId
                );

            if (
              mentionsError
            ) {
              return apiError(
                mentionsError,
                "CHAT_MENTIONS_ERROR"
              );
            }

            const senderIds = [
              ...new Set(
                messages
                  .map(
                    (message) =>
                      message.sender_id
                  )
                  .filter(Boolean)
              ),
            ];

            const mentionedUserIds = [
              ...new Set(
                (
                  mentionsData ||
                  []
                )
                  .map(
                    (mention) =>
                      mention.mentioned_user_id
                  )
                  .filter(Boolean)
              ),
            ];

            const profileIds = [
              ...new Set([
                ...senderIds,
                ...mentionedUserIds,
              ]),
            ];

            let profiles = [];

            if (
              profileIds.length >
              0
            ) {
              const {
                data:
                  profileData,
              } =
                await supabase
                  .from(
                    "profiles"
                  )
                  .select(
                    "id, username, full_name"
                  )
                  .in(
                    "id",
                    profileIds
                  );

              profiles =
                profileData ||
                [];
            }

            const profileMap =
              Object.fromEntries(
                profiles.map(
                  (profile) => [
                    profile.id,
                    profile,
                  ]
                )
              );

            const attachmentMap =
              {};

            (
              attachmentsData ||
              []
            ).forEach(
              (attachment) => {
                if (
                  !attachmentMap[
                    attachment.message_id
                  ]
                ) {
                  attachmentMap[
                    attachment.message_id
                  ] = [];
                }

                attachmentMap[
                  attachment.message_id
                ].push({
                  ...attachment,

                  isImage:
                    Boolean(
                      attachment.mime_type?.startsWith(
                        "image/"
                      )
                    ),
                });
              }
            );

            const mentionMap =
              {};

            (
              mentionsData ||
              []
            ).forEach(
              (mention) => {
                if (
                  !mentionMap[
                    mention.message_id
                  ]
                ) {
                  mentionMap[
                    mention.message_id
                  ] = [];
                }

                mentionMap[
                  mention.message_id
                ].push({
                  ...mention,

                  user:
                    profileMap[
                      mention.mentioned_user_id
                    ] || null,
                });
              }
            );

            const normalizedMessages =
              messages.map(
                (message) => ({
                  ...message,

                  sender:
                    profileMap[
                      message.sender_id
                    ] || null,

                  attachments:
                    attachmentMap[
                      message.id
                    ] || [],

                  mentions:
                    mentionMap[
                      message.id
                    ] || [],
                })
              );

            const messageMap =
              Object.fromEntries(
                normalizedMessages.map(
                  (message) => [
                    message.id,
                    message,
                  ]
                )
              );

            const result =
              normalizedMessages.map(
                (message) => ({
                  ...message,

                  replyTo:
                    message.reply_to_id
                      ? messageMap[
                          message.reply_to_id
                        ] || null
                      : null,
                })
              );

            return {
              data: result,
            };
          },

          providesTags: (
            _result,
            _error,
            arg
          ) => [
            {
              type:
                "TeamChat",

              id:
                arg?.teamId,
            },
          ],

          refetchOnMountOrArgChange:
            true,
        }),

      // ========================================================
      // Send
      // ========================================================

      sendTeamChatMessage:
        builder.mutation({
          async queryFn({
            teamId,
            userId,
            content,
            replyToId = null,
            mentionedUserIds = [],
            attachments = [],
          }) {
            if (
              !teamId ||
              !userId
            ) {
              return {
                error: {
                  status:
                    "INVALID_CHAT_REQUEST",

                  message:
                    "Team ID and user ID are required.",
                },
              };
            }

            if (
              !content?.trim()
            ) {
              return {
                error: {
                  status:
                    "INVALID_CHAT_MESSAGE",

                  message:
                    "Message content is required.",
                },
              };
            }

            if (
              attachments.length >
              MAX_FILES
            ) {
              return {
                error: {
                  status:
                    "TOO_MANY_ATTACHMENTS",

                  message:
                    `You can attach up to ${MAX_FILES} files.`,
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

            if (
              authError
            ) {
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

            if (
              replyToId
            ) {
              const {
                data:
                  replyTarget,
                error:
                  replyError,
              } =
                await supabase
                  .from(
                    "chat_messages"
                  )
                  .select(
                    "id"
                  )
                  .eq(
                    "id",
                    replyToId
                  )
                  .eq(
                    "team_id",
                    teamId
                  )
                  .maybeSingle();

              if (
                replyError
              ) {
                return apiError(
                  replyError,
                  "REPLY_TARGET_ERROR"
                );
              }

              if (
                !replyTarget
              ) {
                return {
                  error: {
                    status:
                      "INVALID_REPLY_TARGET",

                    message:
                      "The reply target does not belong to this team.",
                  },
                };
              }
            }

            const {
              data:
                message,
              error:
                messageError,
            } =
              await supabase
                .from(
                  "chat_messages"
                )
                .insert({
                  team_id:
                    teamId,

                  sender_id:
                    userId,

                  content:
                    content.trim(),

                  reply_to_id:
                    replyToId ||
                    null,
                })
                .select("*")
                .single();

            if (
              messageError
            ) {
              return apiError(
                messageError,
                "SEND_CHAT_MESSAGE_ERROR"
              );
            }

            try {
              await createMentionRows({
                messageId:
                  message.id,

                teamId,

                userId,

                mentionedUserIds,
              });

              await uploadChatFiles({
                teamId,
                userId,
                messageId:
                  message.id,
                files:
                  attachments,
              });

              return {
                data: message,
              };
            } catch (
              error
            ) {
              /*
               * Roll back the message if
               * mentions or files fail.
               */
              await supabase
                .from(
                  "chat_messages"
                )
                .delete()
                .eq(
                  "id",
                  message.id
                );

              return apiError(
                error,
                "CHAT_MESSAGE_ATTACHMENTS_ERROR"
              );
            }
          },

          invalidatesTags: (
            _result,
            _error,
            arg
          ) => [
            {
              type:
                "TeamChat",

              id:
                arg?.teamId,
            },
          ],
        }),

      // ========================================================
      // Update message
      // ========================================================

      updateTeamChatMessage:
        builder.mutation({
          async queryFn({
            messageId,
            teamId,
            userId,
            content,
            mentionedUserIds = [],
          }) {
            if (
              !messageId ||
              !teamId ||
              !userId ||
              !content?.trim()
            ) {
              return {
                error: {
                  status:
                    "INVALID_CHAT_UPDATE",

                  message:
                    "Message ID, team ID, user ID and content are required.",
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

            if (
              authError
            ) {
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
              data:
                updatedMessage,
              error:
                updateError,
            } =
              await supabase
                .from(
                  "chat_messages"
                )
                .update({
                  content:
                    content.trim(),

                  edited_at:
                    new Date().toISOString(),
                })
                .eq(
                  "id",
                  messageId
                )
                .eq(
                  "team_id",
                  teamId
                )
                .select("*")
                .single();

            if (
              updateError
            ) {
              return apiError(
                updateError,
                "UPDATE_CHAT_MESSAGE_ERROR"
              );
            }

            const {
              error:
                deleteMentionError,
            } =
              await supabase
                .from(
                  "chat_message_mentions"
                )
                .delete()
                .eq(
                  "message_id",
                  messageId
                );

            if (
              deleteMentionError
            ) {
              console.error(
                "Unable to reset chat mentions:",
                deleteMentionError
              );
            }

            try {
              await createMentionRows({
                messageId,
                teamId,
                userId,
                mentionedUserIds,
              });
            } catch (
              error
            ) {
              console.error(
                "Unable to save new chat mentions:",
                error
              );
            }

            return {
              data:
                updatedMessage,
            };
          },

          invalidatesTags: (
            _result,
            _error,
            arg
          ) => [
            {
              type:
                "TeamChat",

              id:
                arg?.teamId,
            },
          ],
        }),

      // ========================================================
      // Delete message
      // ========================================================

      deleteTeamChatMessage:
        builder.mutation({
          async queryFn({
            messageId,
            teamId,
            userId,
          }) {
            if (
              !messageId ||
              !teamId ||
              !userId
            ) {
              return {
                error: {
                  status:
                    "INVALID_CHAT_DELETE",

                  message:
                    "Message ID, team ID and user ID are required.",
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

            if (
              authError
            ) {
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
              data:
                attachments,
              error:
                attachmentsError,
            } =
              await supabase
                .from(
                  "chat_message_attachments"
                )
                .select(
                  "storage_path"
                )
                .eq(
                  "message_id",
                  messageId
                )
                .eq(
                  "team_id",
                  teamId
                );

            if (
              attachmentsError
            ) {
              return apiError(
                attachmentsError,
                "DELETE_CHAT_ATTACHMENTS_ERROR"
              );
            }

            const paths =
              (
                attachments ||
                []
              )
                .map(
                  (item) =>
                    item.storage_path
                )
                .filter(Boolean);

            if (
              paths.length >
              0
            ) {
              const {
                error:
                  storageError,
              } =
                await supabase
                  .storage
                  .from(
                    CHAT_BUCKET
                  )
                  .remove(
                    paths
                  );

              if (
                storageError
              ) {
                return apiError(
                  storageError,
                  "DELETE_CHAT_FILES_ERROR"
                );
              }
            }

            const {
              error:
                deleteError,
            } =
              await supabase
                .from(
                  "chat_messages"
                )
                .delete()
                .eq(
                  "id",
                  messageId
                )
                .eq(
                  "team_id",
                  teamId
                );

            if (
              deleteError
            ) {
              return apiError(
                deleteError,
                "DELETE_CHAT_MESSAGE_ERROR"
              );
            }

            return {
              data: {
                success:
                  true,
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
                "TeamChat",

              id:
                arg?.teamId,
            },
          ],
        }),

      // ========================================================
      // Signed attachment URL
      // ========================================================

      getTeamChatAttachmentUrl:
        builder.mutation({
          async queryFn({
            teamId,
            userId,
            storagePath,
          }) {
            if (
              !teamId ||
              !userId ||
              !storagePath
            ) {
              return {
                error: {
                  status:
                    "INVALID_ATTACHMENT",

                  message:
                    "Team ID, user ID and file path are required.",
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

            if (
              authError
            ) {
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
                .storage
                .from(
                  CHAT_BUCKET
                )
                .createSignedUrl(
                  storagePath,
                  3600,
                  {
                    download:
                      false,
                  }
                );

            if (error) {
              return apiError(
                error,
                "CREATE_CHAT_FILE_URL_ERROR"
              );
            }

            return {
              data: {
                url:
                  data?.signedUrl ||
                  null,
              },
            };
          },
        }),
    }),
  });

export const {
  useGetTeamChatMessagesQuery,
  useSendTeamChatMessageMutation,
  useUpdateTeamChatMessageMutation,
  useDeleteTeamChatMessageMutation,
  useGetTeamChatAttachmentUrlMutation,
} = teamChatApi;
