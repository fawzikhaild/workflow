
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  useSelector,
} from "react-redux";

import {
  ArrowLeft,
  AtSign,
  Check,
  CheckCheck,
  Download,
  Edit3,
  FileText,
  MessageCircle,
  Paperclip,
  Reply,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Textarea,
} from "@/components/ui/textarea";

import {
  cn,
} from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  useGetMyTeamsQuery,
  useGetTeamMembersQuery,
  useGetTeamChatMessagesQuery,
  useSendTeamChatMessageMutation,
  useUpdateTeamChatMessageMutation,
  useDeleteTeamChatMessageMutation,
  useGetTeamChatAttachmentUrlMutation,
} from "@/store/api/apiSlice";

import useTeamChatRealtime from "@/hooks/useTeamChatRealtime";

const MAX_FILES = 5;
const MAX_FILE_SIZE =
  10 * 1024 * 1024;

// ============================================================
// Helpers
// ============================================================

function formatFileSize(size) {
  if (!size || size <= 0) {
    return "0 KB";
  }

  if (size < 1024 * 1024) {
    return `${Math.ceil(
      size / 1024
    )} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getInitial(name = "") {
  return (
    name
      .trim()
      .charAt(0)
      .toUpperCase() || "U"
  );
}

function getSenderName(
  message,
  userId
) {
  if (
    message.sender_id ===
    userId
  ) {
    return "You";
  }

  return (
    message.sender?.full_name ||
    message.sender?.username ||
    message.sender?.email ||
    "Team member"
  );
}

// ============================================================
// Component
// ============================================================

export default function TeamChat() {
  const { teamId } =
    useParams();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const user =
    useSelector(
      (state) => state.auth.user
    );

  const userId =
    user?.id;

  // ==========================================================
  // Notification target
  // ==========================================================

  const targetMessageId =
    searchParams.get(
      "message"
    );

  const [
    highlightedMessageId,
    setHighlightedMessageId,
  ] = useState(null);

  const messageRefs =
    useRef(new Map());

  // ==========================================================
  // Teams
  // ==========================================================

  const {
    data: teams = [],
    isLoading: teamsLoading,
  } =
    useGetMyTeamsQuery(
      userId,
      {
        skip: !userId,
      }
    );

  const currentTeam =
    useMemo(
      () =>
        teams.find(
          (team) =>
            String(team.id) ===
            String(teamId)
        ),
      [
        teams,
        teamId,
      ]
    );

  const currentRole =
    currentTeam?.memberRole ||
    null;

  const canManage =
    currentRole ===
      "owner" ||
    currentRole ===
      "admin";

  // ==========================================================
  // Team Members
  // ==========================================================

  const {
    data: teamMembers = [],
  } =
    useGetTeamMembersQuery(
      teamId,
      {
        skip: !teamId,
      }
    );

  const mentionableMembers =
    useMemo(
      () =>
        teamMembers
          .filter(
            (member) =>
              member.profile
                ?.username
          )
          .map(
            (member) => ({
              userId:
                member.user_id,

              username:
                member.profile
                  .username,

              name:
                member.profile
                  ?.full_name ||
                member.profile
                  ?.username ||
                "Team member",
            })
          ),
      [teamMembers]
    );

  // ==========================================================
  // Messages
  // ==========================================================

  const {
    data: messages = [],
    isLoading:
      messagesLoading,
    isFetching,
    isError:
      messagesError,
    refetch:
      refetchMessages,
  } =
    useGetTeamChatMessagesQuery(
      {
        teamId,
        userId,
      },
      {
        skip:
          !teamId ||
          !userId,
      }
    );

  // ==========================================================
  // Mutations
  // ==========================================================

  const [
    sendMessage,
    {
      isLoading:
        sendingMessage,
    },
  ] =
    useSendTeamChatMessageMutation();

  const [
    updateMessage,
    {
      isLoading:
        updatingMessage,
    },
  ] =
    useUpdateTeamChatMessageMutation();

  const [
    deleteMessage,
    {
      isLoading:
        deletingMessage,
    },
  ] =
    useDeleteTeamChatMessageMutation();

  const [
    getAttachmentUrl,
  ] =
    useGetTeamChatAttachmentUrlMutation();

  // ==========================================================
  // State
  // ==========================================================

  const [
    text,
    setText,
  ] = useState("");

  const [
    editingMessageId,
    setEditingMessageId,
  ] = useState(null);

  const [
    editingText,
    setEditingText,
  ] = useState("");

  const [
    replyTo,
    setReplyTo,
  ] = useState(null);

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState([]);

  const [
    mentionSuggestions,
    setMentionSuggestions,
  ] = useState([]);

  const [
    composerError,
    setComposerError,
  ] = useState("");

  const [
    deleteDialogOpen,
    setDeleteDialogOpen,
  ] = useState(false);

  const [
    messageToDelete,
    setMessageToDelete,
  ] = useState(null);

  const bottomRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  const typingTimeoutRef =
    useRef(null);

  // ==========================================================
  // Display name
  // ==========================================================

  const displayName =
    user?.user_metadata
      ?.full_name ||
    user?.user_metadata
      ?.username ||
    user?.email ||
    "User";

  // ==========================================================
  // Realtime
  // ==========================================================

  const {
    onlineCount,
    typingUsers,
    setTyping,
  } =
    useTeamChatRealtime({
      teamId,
      userId,
      displayName,
    });

  // ==========================================================
  // Normal auto scroll
  // ==========================================================

  useEffect(() => {
    if (
      !targetMessageId
    ) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [
    messages.length,
    targetMessageId,
  ]);

  // ==========================================================
  // Open specific message from notification
  // ==========================================================

  useEffect(() => {
    if (
      !targetMessageId ||
      messages.length === 0
    ) {
      return;
    }

    const targetElement =
      messageRefs.current.get(
        targetMessageId
      );

    if (!targetElement) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        setHighlightedMessageId(
          targetMessageId
        );

        const highlightTimeout =
          window.setTimeout(() => {
            setHighlightedMessageId(
              null
            );
          }, 2800);

        return () => {
          window.clearTimeout(
            highlightTimeout
          );
        };
      }, 150);

    /*
     * Remove the query parameter after opening
     * so the same notification can be opened
     * again later.
     */

    setSearchParams(
      {},
      {
        replace: true,
      }
    );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    targetMessageId,
    messages,
    setSearchParams,
  ]);

  // ==========================================================
  // Cleanup
  // ==========================================================

  useEffect(() => {
    return () => {
      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );
      }
    };
  }, []);

  // ==========================================================
  // Mention detection
  // ==========================================================

  function updateMentionSuggestions(
    value
  ) {
    const match =
      value.match(
        /@([^\s@]*)$/u
      );

    if (!match) {
      setMentionSuggestions(
        []
      );
      return;
    }

    const query =
      match[1].toLowerCase();

    const suggestions =
      mentionableMembers
        .filter(
          (member) =>
            member.username
              .toLowerCase()
              .startsWith(query)
        )
        .slice(0, 6);

    setMentionSuggestions(
      suggestions
    );
  }

  function handleTextChange(
    event
  ) {
    const value =
      event.target.value;

    setText(value);

    updateMentionSuggestions(
      value
    );

    if (
      !value.trim()
    ) {
      setTyping(false);

      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );
      }

      return;
    }

    setTyping(true);

    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );
    }

    typingTimeoutRef.current =
      setTimeout(() => {
        setTyping(false);
      }, 1200);
  }

  function selectMention(
    member
  ) {
    const match =
      text.match(
        /@([^\s@]*)$/u
      );

    if (!match) {
      return;
    }

    const start =
      match.index;

    const before =
      text.slice(
        0,
        start
      );

    setText(
      `${before}@${member.username} `
    );

    setMentionSuggestions(
      []
    );
  }

  function extractMentionedUserIds(
    content
  ) {
    const ids = [];

    const regex =
      /@([^\s@]+)/gu;

    const matches =
      content.matchAll(
        regex
      );

    for (
      const match of matches
    ) {
      const username =
        match[1].toLowerCase();

      const member =
        mentionableMembers.find(
          (item) =>
            item.username
              .toLowerCase() ===
            username
        );

      if (
        member &&
        member.userId !==
          userId
      ) {
        ids.push(
          member.userId
        );
      }
    }

    return [
      ...new Set(ids),
    ];
  }

  // ==========================================================
  // Attachments
  // ==========================================================

  function handleFilesSelected(
    event
  ) {
    const files =
      Array.from(
        event.target.files ||
          []
      );

    if (
      files.length === 0
    ) {
      return;
    }

    setComposerError("");

    const combined = [
      ...selectedFiles,
      ...files,
    ];

    if (
      combined.length >
      MAX_FILES
    ) {
      setComposerError(
        `You can attach up to ${MAX_FILES} files.`
      );

      event.target.value =
        "";

      return;
    }

    const oversized =
      combined.find(
        (file) =>
          file.size >
          MAX_FILE_SIZE
      );

    if (
      oversized
    ) {
      setComposerError(
        `"${oversized.name}" is larger than 10 MB.`
      );

      event.target.value =
        "";

      return;
    }

    setSelectedFiles(
      combined
    );

    event.target.value =
      "";
  }

  function removeSelectedFile(
    index
  ) {
    setSelectedFiles(
      (current) =>
        current.filter(
          (
            _file,
            fileIndex
          ) =>
            fileIndex !==
            index
        )
    );
  }

  // ==========================================================
  // Send
  // ==========================================================

  async function handleSend(
    event
  ) {
    event.preventDefault();

    const content =
      text.trim();

    if (
      !content ||
      !teamId ||
      !userId ||
      sendingMessage
    ) {
      return;
    }

    setComposerError("");

    try {
      const mentionedUserIds =
        extractMentionedUserIds(
          content
        );

      await sendMessage({
        teamId,
        userId,
        content,
        replyToId:
          replyTo?.id ||
          null,
        mentionedUserIds,
        attachments:
          selectedFiles,
      }).unwrap();

      setText("");

      setSelectedFiles(
        []
      );

      setReplyTo(
        null
      );

      setMentionSuggestions(
        []
      );

      setTyping(
        false
      );

      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );
      }
    } catch (
      error
    ) {
      console.error(
        "Send chat message error:",
        error
      );

      setComposerError(
        error?.data
          ?.message ||
          error?.message ||
          "Unable to send the message."
      );
    }
  }

  // ==========================================================
  // Keyboard
  // ==========================================================

  function handleKeyDown(
    event
  ) {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSend(event);
    }

    if (
      event.key ===
      "Escape"
    ) {
      setMentionSuggestions(
        []
      );
    }
  }

  // ==========================================================
  // Reply
  // ==========================================================

  function startReply(
    message
  ) {
    setReplyTo(
      message
    );

    setComposerError("");
  }

  function cancelReply() {
    setReplyTo(
      null
    );
  }

  // ==========================================================
  // Edit
  // ==========================================================

  function startEdit(
    message
  ) {
    setEditingMessageId(
      message.id
    );

    setEditingText(
      message.content
    );
  }

  function cancelEdit() {
    setEditingMessageId(
      null
    );

    setEditingText(
      ""
    );
  }

  async function handleUpdate(
    message
  ) {
    const content =
      editingText.trim();

    if (
      !content ||
      updatingMessage
    ) {
      return;
    }

    try {
      await updateMessage({
        messageId:
          message.id,
        teamId,
        userId,
        content,
        mentionedUserIds:
          extractMentionedUserIds(
            content
          ),
      }).unwrap();

      cancelEdit();
    } catch (
      error
    ) {
      console.error(
        "Update chat message error:",
        error
      );
    }
  }

  // ==========================================================
  // Delete dialog
  // ==========================================================

  function openDeleteDialog(
    message
  ) {
    setMessageToDelete(
      message
    );

    setDeleteDialogOpen(
      true
    );
  }

  function closeDeleteDialog() {
    if (
      deletingMessage
    ) {
      return;
    }

    setDeleteDialogOpen(
      false
    );

    setMessageToDelete(
      null
    );
  }

  async function confirmDelete() {
    if (
      !messageToDelete ||
      deletingMessage
    ) {
      return;
    }

    try {
      await deleteMessage({
        messageId:
          messageToDelete.id,
        teamId,
        userId,
      }).unwrap();

      closeDeleteDialog();
    } catch (
      error
    ) {
      console.error(
        "Delete chat message error:",
        error
      );
    }
  }

  // ==========================================================
  // Download attachment
  // ==========================================================

  async function handleDownload(
    attachment
  ) {
    try {
      const result =
        await getAttachmentUrl({
          teamId,
          userId,
          storagePath:
            attachment.storage_path,
        }).unwrap();

      if (
        result?.url
      ) {
        window.open(
          result.url,
          "_blank",
          "noopener,noreferrer"
        );
      }
    } catch (
      error
    ) {
      console.error(
        "Download attachment error:",
        error
      );
    }
  }

  // ==========================================================
  // Message content
  // ==========================================================

  function renderMessageContent(
    content
  ) {
    const parts =
      content.split(
        /(@[^\s@]+)/gu
      );

    return parts.map(
      (part, index) => {
        if (
          !part.startsWith("@")
        ) {
          return (
            <span
              key={index}
            >
              {part}
            </span>
          );
        }

        const username =
          part
            .slice(1)
            .toLowerCase();

        const isMention =
          mentionableMembers.some(
            (member) =>
              member.username
                .toLowerCase() ===
              username
          );

        return (
          <span
            key={index}
            className={
              isMention
                ? "font-semibold underline decoration-primary/50 underline-offset-2"
                : undefined
            }
          >
            {part}
          </span>
        );
      }
    );
  }

  // ==========================================================
  // Loading
  // ==========================================================

  if (
    teamsLoading ||
    messagesLoading
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <MessageCircle className="size-8 animate-pulse text-primary" />

          <p>
            Loading team chat...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // Team not found
  // ==========================================================

  if (!currentTeam) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
        <Users className="mb-5 size-8 text-muted-foreground" />

        <h1 className="text-2xl font-semibold tracking-tight">
          Team not found
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          You may no longer have access to this team.
        </p>

        <Button
          asChild
          className="mt-6"
        >
          <Link to="/teams">
            Back to Teams
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
      {/* ==================================================== */}
      {/* Header */}
      {/* ==================================================== */}

      <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border bg-card px-4 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
          >
            <Link
              to={`/teams/${teamId}`}
              aria-label="Back to team"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>

          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageCircle className="size-5" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {currentTeam.name}
            </h1>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                Team Chat
              </span>

              <span>
                •
              </span>

              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />

                {onlineCount} online
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {isFetching
            ? "Updating..."
            : `${messages.length} messages`}
        </div>
      </div>

      {/* ==================================================== */}
      {/* Chat */}
      {/* ==================================================== */}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Messages */}

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {messagesError ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
              <MessageCircle className="mb-4 size-8 text-destructive" />

              <h2 className="text-lg font-semibold">
                Unable to load messages
              </h2>

              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={
                  refetchMessages
                }
              >
                Try Again
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-[300px] items-center justify-center">
              <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
                  <MessageCircle className="size-7 text-muted-foreground" />
                </div>

                <h2 className="text-lg font-semibold">
                  Start the conversation
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Send the first message to your team.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col gap-5">
              {messages.map(
                (message) => {
                  const isOwn =
                    message.sender_id ===
                    userId;

                  const senderName =
                    getSenderName(
                      message,
                      userId
                    );

                  const canModify =
                    isOwn ||
                    canManage;

                  const isEditing =
                    editingMessageId ===
                    message.id;

                  const isHighlighted =
                    highlightedMessageId ===
                    message.id;

                  return (
                    <div
                      key={message.id}
                      ref={(node) => {
                        if (node) {
                          messageRefs.current.set(
                            message.id,
                            node
                          );
                        } else {
                          messageRefs.current.delete(
                            message.id
                          );
                        }
                      }}
                      className={cn(
                        "group flex gap-3 rounded-2xl p-1 transition-all duration-500",
                        isOwn &&
                          "flex-row-reverse",
                        isHighlighted &&
                          "bg-primary/10 ring-2 ring-primary/30"
                      )}
                    >
                      {/* Avatar */}

                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {getInitial(
                          senderName
                        )}
                      </div>

                      {/* Body */}

                      <div
                        className={cn(
                          "min-w-0 max-w-[90%] sm:max-w-[72%]",
                          isOwn &&
                            "items-end"
                        )}
                      >
                        {/* Header */}

                        <div
                          className={cn(
                            "mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
                            isOwn &&
                              "justify-end"
                          )}
                        >
                          <span className="font-medium text-foreground">
                            {senderName}
                          </span>

                          <span>
                            {new Date(
                              message.created_at
                            ).toLocaleTimeString(
                              [],
                              {
                                hour:
                                  "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}
                          </span>

                          {message.edited_at && (
                            <span>
                              edited
                            </span>
                          )}
                        </div>

                        {/* Reply preview */}

                        {message.replyTo && (
                          <div
                            className={cn(
                              "mb-1 rounded-xl border-l-2 border-primary/50 bg-muted/60 px-3 py-2 text-xs",
                              isOwn &&
                                "ml-auto"
                            )}
                          >
                            <div className="flex items-center gap-1 font-medium text-primary">
                              <Reply className="size-3" />

                              Replying to{" "}
                              {getSenderName(
                                message.replyTo,
                                userId
                              )}
                            </div>

                            <p className="mt-1 max-w-[300px] truncate text-muted-foreground">
                              {
                                message
                                  .replyTo
                                  .content
                              }
                            </p>
                          </div>
                        )}

                        {/* Message */}

                        {isEditing ? (
                          <div className="min-w-[280px] rounded-2xl border bg-background p-3 shadow-sm">
                            <Textarea
                              value={
                                editingText
                              }
                              onChange={(
                                event
                              ) =>
                                setEditingText(
                                  event.target
                                    .value
                                )
                              }
                              rows={3}
                              autoFocus
                            />

                            <div className="mt-2 flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={
                                  cancelEdit
                                }
                              >
                                <X className="mr-1 size-4" />
                                Cancel
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                disabled={
                                  updatingMessage ||
                                  !editingText.trim()
                                }
                                onClick={() =>
                                  handleUpdate(
                                    message
                                  )
                                }
                              >
                                <Check className="mr-1 size-4" />
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "relative rounded-2xl px-4 py-3 text-sm leading-6",
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {renderMessageContent(
                                message.content
                              )}
                            </p>

                            {/* Actions */}

                            <div
                              className={cn(
                                "absolute -top-3 hidden items-center gap-1 rounded-lg border bg-background p-1 shadow-sm group-hover:flex",
                                isOwn
                                  ? "left-0"
                                  : "right-0"
                              )}
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                  startReply(
                                    message
                                  )
                                }
                                title="Reply"
                                aria-label="Reply"
                              >
                                <Reply className="size-3.5" />
                              </Button>

                              {canModify && (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    onClick={() =>
                                      startEdit(
                                        message
                                      )
                                    }
                                    title="Edit"
                                    aria-label="Edit"
                                  >
                                    <Edit3 className="size-3.5" />
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-destructive hover:text-destructive"
                                    disabled={
                                      deletingMessage
                                    }
                                    onClick={() =>
                                      openDeleteDialog(
                                        message
                                      )
                                    }
                                    title="Delete"
                                    aria-label="Delete"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Attachments */}

                        {!isEditing &&
                          message.attachments
                            ?.length >
                            0 && (
                            <div
                              className={cn(
                                "mt-2 flex flex-col gap-2",
                                isOwn &&
                                  "items-end"
                              )}
                            >
                              {message.attachments.map(
                                (
                                  attachment
                                ) => (
                                  <button
                                    key={
                                      attachment.id
                                    }
                                    type="button"
                                    onClick={() =>
                                      handleDownload(
                                        attachment
                                      )
                                    }
                                    className="flex max-w-full items-center gap-3 rounded-xl border bg-background px-3 py-2 text-left text-xs transition hover:border-primary/40 hover:bg-muted"
                                  >
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                      {attachment.isImage ? (
                                        <Paperclip className="size-4" />
                                      ) : (
                                        <FileText className="size-4" />
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="max-w-[240px] truncate font-medium">
                                        {
                                          attachment.file_name
                                        }
                                      </p>

                                      <p className="text-muted-foreground">
                                        {formatFileSize(
                                          attachment.file_size
                                        )}
                                      </p>
                                    </div>

                                    <Download className="ml-auto size-4 shrink-0 text-muted-foreground" />
                                  </button>
                                )
                              )}
                            </div>
                          )}

                        {/* Status */}

                        {isOwn &&
                          !isEditing && (
                            <div className="mt-1 flex justify-end text-muted-foreground">
                              <CheckCheck className="size-3.5" />
                            </div>
                          )}
                      </div>
                    </div>
                  );
                }
              )}

              <div
                ref={bottomRef}
              />
            </div>
          )}
        </div>

        {/* Typing */}

        <div className="border-t px-4 py-2">
          <div className="min-h-5 text-xs text-muted-foreground">
            {typingUsers.length >
              0 && (
              <span>
                {typingUsers
                  .slice(0, 3)
                  .map(
                    (
                      typingUser
                    ) =>
                      typingUser.name
                  )
                  .join(", ")}{" "}
                {typingUsers.length ===
                1
                  ? "is"
                  : "are"}{" "}
                typing...
              </span>
            )}
          </div>
        </div>

        {/* Composer */}

        <div className="border-t bg-muted/20 p-3 sm:p-4">
          <form
            onSubmit={
              handleSend
            }
            className="mx-auto max-w-4xl"
          >
            {/* Reply */}

            {replyTo && (
              <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Reply className="size-3.5" />

                    Replying to{" "}
                    {getSenderName(
                      replyTo,
                      userId
                    )}
                  </div>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {
                      replyTo.content
                    }
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={
                    cancelReply
                  }
                  aria-label="Cancel reply"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}

            {/* Files */}

            {selectedFiles.length >
              0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedFiles.map(
                  (
                    file,
                    index
                  ) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex min-w-0 items-center gap-2 rounded-xl border bg-background px-3 py-2"
                    >
                      <Paperclip className="size-3.5 shrink-0 text-primary" />

                      <span className="max-w-[180px] truncate text-xs font-medium">
                        {file.name}
                      </span>

                      <span className="text-[10px] text-muted-foreground">
                        {formatFileSize(
                          file.size
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeSelectedFile(
                            index
                          )
                        }
                        className="ml-1 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            {composerError && (
              <div className="mb-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {composerError}
              </div>
            )}

            {/* Mention suggestions */}

            <div className="relative flex items-end gap-2">
              {mentionSuggestions.length >
                0 && (
                <div className="absolute bottom-full left-0 mb-2 w-72 overflow-hidden rounded-xl border bg-background p-1 shadow-lg">
                  {mentionSuggestions.map(
                    (
                      member
                    ) => (
                      <button
                        key={
                          member.userId
                        }
                        type="button"
                        onClick={() =>
                          selectMention(
                            member
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-muted"
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {getInitial(
                            member.name
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {member.name}
                          </p>

                          <p className="truncate text-xs text-muted-foreground">
                            @{member.username}
                          </p>
                        </div>

                        <AtSign className="ml-auto size-4 text-muted-foreground" />
                      </button>
                    )
                  )}
                </div>
              )}

              <input
                ref={
                  fileInputRef
                }
                type="file"
                multiple
                className="hidden"
                onChange={
                  handleFilesSelected
                }
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 shrink-0 rounded-xl"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  sendingMessage ||
                  selectedFiles.length >=
                    MAX_FILES
                }
                title="Attach files"
                aria-label="Attach files"
              >
                <Paperclip className="size-4" />
              </Button>

              <div className="flex-1">
                <Textarea
                  value={text}
                  onChange={
                    handleTextChange
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                  placeholder="Write a message... Use @ to mention someone"
                  rows={1}
                  className="max-h-32 min-h-11 resize-none"
                />
              </div>

              <Button
                type="submit"
                size="icon"
                className="size-11 shrink-0 rounded-xl"
                disabled={
                  sendingMessage ||
                  !text.trim()
                }
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
              <span>
                Enter to send • Shift + Enter for new line
              </span>

              <span className="flex items-center gap-1">
                <Paperclip className="size-3" />
                Max {MAX_FILES} files • 10 MB each
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* ==================================================== */}
      {/* Delete Confirmation */}
      {/* ==================================================== */}

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={
          (nextOpen) => {
            if (
              deletingMessage
            ) {
              return;
            }

            setDeleteDialogOpen(
              nextOpen
            );

            if (!nextOpen) {
              setMessageToDelete(
                null
              );
            }
          }
        }
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>

            <AlertDialogTitle>
              Delete message?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This message and its attachments
              will be permanently removed from
              the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {messageToDelete && (
            <div className="rounded-xl border bg-muted/40 px-3 py-2.5">
              <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {messageToDelete.content}
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={
                deletingMessage
              }
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={
                deletingMessage
              }
              onClick={(
                event
              ) => {
                event.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingMessage ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete message
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

