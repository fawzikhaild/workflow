
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useDispatch,
} from "react-redux";

import {
  supabase,
} from "@/lib/supabaseClient";

import {
  apiSlice,
} from "@/store/api/apiBase";

export default function useTeamChatRealtime({
  teamId,
  userId,
  displayName,
}) {
  const dispatch = useDispatch();

  const channelRef =
    useRef(null);

  const typingStateRef =
    useRef(false);

  const typingTimeoutsRef =
    useRef(new Map());

  const [
    onlineUsers,
    setOnlineUsers,
  ] = useState([]);

  const [
    typingUsers,
    setTypingUsers,
  ] = useState([]);

  // ==========================================================
  // Presence
  // ==========================================================

  const refreshPresence =
    useCallback(
      (channel) => {
        if (!channel) {
          return;
        }

        const state =
          channel.presenceState();

        const users = [];

        Object.entries(
          state || {}
        ).forEach(
          ([
            presenceKey,
            presences,
          ]) => {
            const latest =
              Array.isArray(
                presences
              )
                ? presences[
                    presences.length - 1
                  ]
                : null;

            users.push({
              userId:
                latest?.user_id ||
                presenceKey,

              name:
                latest?.name ||
                "User",

              onlineAt:
                latest?.online_at ||
                null,
            });
          }
        );

        setOnlineUsers(users);
      },
      []
    );

  // ==========================================================
  // Typing
  // ==========================================================

  const handleTypingEvent =
    useCallback(
      (payload) => {
        const typingUserId =
          payload?.user_id;

        if (
          !typingUserId ||
          typingUserId === userId
        ) {
          return;
        }

        const existingTimeout =
          typingTimeoutsRef.current.get(
            typingUserId
          );

        if (existingTimeout) {
          clearTimeout(
            existingTimeout
          );

          typingTimeoutsRef.current.delete(
            typingUserId
          );
        }

        if (!payload?.typing) {
          setTypingUsers(
            (current) =>
              current.filter(
                (item) =>
                  item.userId !==
                  typingUserId
              )
          );

          return;
        }

        setTypingUsers(
          (current) => {
            const exists =
              current.some(
                (item) =>
                  item.userId ===
                  typingUserId
              );

            if (exists) {
              return current.map(
                (item) =>
                  item.userId ===
                  typingUserId
                    ? {
                        ...item,
                        name:
                          payload?.name ||
                          item.name,
                      }
                    : item
              );
            }

            return [
              ...current,
              {
                userId:
                  typingUserId,

                name:
                  payload?.name ||
                  "Team member",
              },
            ];
          }
        );

        const timeout =
          window.setTimeout(() => {
            setTypingUsers(
              (current) =>
                current.filter(
                  (item) =>
                    item.userId !==
                    typingUserId
                )
            );

            typingTimeoutsRef.current.delete(
              typingUserId
            );
          }, 1800);

        typingTimeoutsRef.current.set(
          typingUserId,
          timeout
        );
      },
      [userId]
    );

  // ==========================================================
  // Create channel
  // ==========================================================

  useEffect(() => {
    if (
      !teamId ||
      !userId
    ) {
      return undefined;
    }

    let cancelled = false;

    async function setupRealtime() {
      try {
        // ------------------------------------------------------
        // Get current authenticated session
        // ------------------------------------------------------

        const {
          data: {
            session,
          },
          error:
            sessionError,
        } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (
          !session?.access_token
        ) {
          console.error(
            "Team Chat: no access token found."
          );

          return;
        }

        // ------------------------------------------------------
        // Explicitly authorize Realtime
        // ------------------------------------------------------

        await supabase.realtime.setAuth(
          session.access_token
        );

        if (cancelled) {
          return;
        }

        // ------------------------------------------------------
        // IMPORTANT:
        // All members of the same team use the SAME topic.
        // ------------------------------------------------------

        const topic =
          `team:${teamId}:chat`;

        console.log(
          "Team Chat connecting:",
          topic
        );

        const channel =
          supabase.channel(
            topic,
            {
              config: {
                private: true,

                broadcast: {
                  self: false,
                },

                presence: {
                  key: userId,
                },
              },
            }
          );

        channelRef.current =
          channel;

        // ======================================================
        // Presence sync
        // ======================================================

        channel.on(
          "presence",
          {
            event: "sync",
          },
          () => {
            refreshPresence(
              channel
            );
          }
        );

        channel.on(
          "presence",
          {
            event: "join",
          },
          ({
            key,
            newPresences,
          }) => {
            console.log(
              "Team Chat presence join:",
              key,
              newPresences
            );

            refreshPresence(
              channel
            );
          }
        );

        channel.on(
          "presence",
          {
            event: "leave",
          },
          ({
            key,
            leftPresences,
          }) => {
            console.log(
              "Team Chat presence leave:",
              key,
              leftPresences
            );

            refreshPresence(
              channel
            );
          }
        );

        // ======================================================
        // Typing
        // ======================================================

        channel.on(
          "broadcast",
          {
            event: "typing",
          },
          ({
            payload,
          }) => {
            handleTypingEvent(
              payload
            );
          }
        );

        // ======================================================
        // Database changes broadcast
        // ======================================================

        channel.on(
          "broadcast",
          {
            event: "INSERT",
          },
          () => {
            dispatch(
              apiSlice.util.invalidateTags(
                [
                  {
                    type:
                      "TeamChat",

                    id:
                      teamId,
                  },
                ]
              )
            );
          }
        );

        channel.on(
          "broadcast",
          {
            event: "UPDATE",
          },
          () => {
            dispatch(
              apiSlice.util.invalidateTags(
                [
                  {
                    type:
                      "TeamChat",

                    id:
                      teamId,
                  },
                ]
              )
            );
          }
        );

        channel.on(
          "broadcast",
          {
            event: "DELETE",
          },
          () => {
            dispatch(
              apiSlice.util.invalidateTags(
                [
                  {
                    type:
                      "TeamChat",

                    id:
                      teamId,
                  },
                ]
              )
            );
          }
        );

        // ======================================================
        // Subscribe
        // ======================================================

        channel.subscribe(
          async (
            status,
            error
          ) => {
            console.log(
              "Team Chat Realtime status:",
              status,
              error || ""
            );

            if (
              status !==
              "SUBSCRIBED"
            ) {
              if (
                status ===
                  "CHANNEL_ERROR" ||
                status ===
                  "TIMED_OUT"
              ) {
                console.error(
                  "Team Chat Realtime failed:",
                  status,
                  error
                );
              }

              return;
            }

            // --------------------------------------------------
            // Track current user
            // --------------------------------------------------

            const trackResult =
              await channel.track({
                user_id:
                  userId,

                name:
                  displayName ||
                  "User",

                online_at:
                  new Date().toISOString(),
              });

            console.log(
              "Team Chat track result:",
              trackResult
            );

            // --------------------------------------------------
            // Read current presence immediately
            // --------------------------------------------------

            refreshPresence(
              channel
            );

            console.log(
              "Team Chat presence state:",
              channel.presenceState()
            );
          }
        );
      } catch (
        error
      ) {
        if (!cancelled) {
          console.error(
            "Team Chat Realtime setup error:",
            error
          );
        }
      }
    }

    setupRealtime();

    // ========================================================
    // Cleanup
    // ========================================================

    return () => {
      cancelled = true;

      // Clear typing timers

      typingTimeoutsRef.current.forEach(
        (timeout) => {
          clearTimeout(
            timeout
          );
        }
      );

      typingTimeoutsRef.current.clear();

      typingStateRef.current =
        false;

      setTypingUsers([]);

      setOnlineUsers([]);

      const channel =
        channelRef.current;

      channelRef.current =
        null;

      if (channel) {
        channel
          .untrack()
          .catch(() => {});

        supabase.removeChannel(
          channel
        );
      }
    };
  }, [
    teamId,
    userId,
    displayName,
    dispatch,
    refreshPresence,
    handleTypingEvent,
  ]);

  // ==========================================================
  // Send typing event
  // ==========================================================

  const setTyping =
    useCallback(
      async (typing) => {
        const nextTyping =
          Boolean(typing);

        const channel =
          channelRef.current;

        if (
          !channel ||
          !userId
        ) {
          return;
        }

        /*
         * Don't send the same state repeatedly.
         */

        if (
          typingStateRef.current ===
          nextTyping
        ) {
          return;
        }

        typingStateRef.current =
          nextTyping;

        try {
          await channel.send({
            type:
              "broadcast",

            event:
              "typing",

            payload: {
              user_id:
                userId,

              name:
                displayName ||
                "User",

              typing:
                nextTyping,
            },
          });
        } catch (
          error
        ) {
          console.error(
            "Team Chat typing error:",
            error
          );
        }
      },
      [
        userId,
        displayName,
      ]
    );

  return {
    onlineUsers,

    onlineCount:
      onlineUsers.length,

    typingUsers,

    setTyping,
  };
}
