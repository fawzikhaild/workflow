
import { apiSlice } from "./apiBase";

import { supabase } from "@/lib/supabaseClient";

export const meetingModerationApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      moderateMeeting:
        builder.mutation({
          async queryFn({
            meetingId,
            action,
            participantUserId,
            reason,
          }) {
            const {
              data,
              error,
            } =
              await supabase.functions.invoke(
                "livekit-room-control",
                {
                  body: {
                    meetingId,
                    action,
                    participantUserId,
                    reason,
                  },
                }
              );

            if (error) {
              return {
                error: {
                  status:
                    "FUNCTION_ERROR",
                  message:
                    error.message,
                },
              };
            }

            if (data?.error) {
              return {
                error: {
                  status:
                    data.step ||
                    "MODERATION_ERROR",
                  message:
                    data.error,
                },
              };
            }

            return {
              data,
            };
          },

          invalidatesTags: [
            "Meetings",
            "MeetingParticipants",
          ],
        }),
    }),
  });

export const {
  useModerateMeetingMutation,
} =
  meetingModerationApi;

