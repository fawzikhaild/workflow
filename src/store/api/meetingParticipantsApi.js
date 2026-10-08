
import { apiSlice } from "./apiBase";

import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";

import { supabase } from "@/lib/supabaseClient";

export const meetingParticipantsApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      // =====================================================
      // Get Participants
      // =====================================================

      getMeetingParticipants:
        builder.query({
          async queryFn(meetingId) {
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

            if (!meetingId) {
              return {
                error: {
                  status:
                    "VALIDATION_ERROR",
                  message:
                    "Meeting ID is required.",
                },
              };
            }

            const {
              data: meeting,
              error:
                meetingError,
            } = await supabase
              .from("meetings")
              .select("team_id")
              .eq(
                "id",
                meetingId
              )
              .single();

            if (meetingError) {
              return apiError(
                meetingError,
                "Unable to load meeting."
              );
            }

            const {
              data: membership,
              error:
                membershipError,
            } = await supabase
              .from("team_members")
              .select("team_id")
              .eq(
                "team_id",
                meeting.team_id
              )
              .eq(
                "user_id",
                user.id
              )
              .maybeSingle();

            if (membershipError) {
              return apiError(
                membershipError,
                "Unable to verify team membership."
              );
            }

            if (!membership) {
              return {
                error: {
                  status:
                    "FORBIDDEN",
                  message:
                    "You are not a member of this team.",
                },
              };
            }

            const {
              data:
                participants,
              error,
            } = await supabase
              .from(
                "meeting_participants"
              )
              .select("*")
              .eq(
                "meeting_id",
                meetingId
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
                "Unable to load participants."
              );
            }

            const userIds = [
              ...new Set(
                (participants || []).map(
                  (item) =>
                    item.user_id
                )
              ),
            ];

            if (!userIds.length) {
              return {
                data: [],
              };
            }

            const {
              data: profiles,
              error:
                profilesError,
            } = await supabase
              .from("profiles")
              .select(
                "id, username, full_name"
              )
              .in(
                "id",
                userIds
              );

            if (profilesError) {
              return apiError(
                profilesError,
                "Unable to load participant profiles."
              );
            }

            const profileMap =
              new Map(
                (profiles || []).map(
                  (profile) => [
                    profile.id,
                    profile,
                  ]
                )
              );

            return {
              data: participants.map(
                (participant) => ({
                  ...participant,
                  user:
                    profileMap.get(
                      participant.user_id
                    ) || null,
                })
              ),
            };
          },

          providesTags: (
            result,
            error,
            meetingId
          ) => [
            {
              type: "MeetingParticipants",
              id: meetingId,
            },
            {
              type: "MeetingParticipants",
              id: "LIST",
            },
          ],
        }),

      // =====================================================
      // Add Participant
      // =====================================================

      addMeetingParticipant:
        builder.mutation({
          async queryFn({
            meetingId,
            userId,
            role = "participant",
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

            if (
              !meetingId ||
              !userId
            ) {
              return {
                error: {
                  status:
                    "VALIDATION_ERROR",
                  message:
                    "Meeting and user are required.",
                },
              };
            }

            const {
              data: meeting,
              error:
                meetingError,
            } = await supabase
              .from("meetings")
              .select("team_id")
              .eq(
                "id",
                meetingId
              )
              .single();

            if (meetingError) {
              return apiError(
                meetingError,
                "Unable to load meeting."
              );
            }

            const {
              data: currentUserMembership,
              error:
                currentUserError,
            } = await supabase
              .from("team_members")
              .select("role")
              .eq(
                "team_id",
                meeting.team_id
              )
              .eq(
                "user_id",
                user.id
              )
              .maybeSingle();

            if (currentUserError) {
              return apiError(
                currentUserError,
                "Unable to verify your team role."
              );
            }

            if (
              !currentUserMembership ||
              ![
                "owner",
                "admin",
              ].includes(
                currentUserMembership.role
              )
            ) {
              return {
                error: {
                  status:
                    "FORBIDDEN",
                  message:
                    "Only team owners and admins can add participants.",
                },
              };
            }

            const {
              data: targetMembership,
              error:
                targetMembershipError,
            } = await supabase
              .from("team_members")
              .select("id")
              .eq(
                "team_id",
                meeting.team_id
              )
              .eq(
                "user_id",
                userId
              )
              .maybeSingle();

            if (targetMembershipError) {
              return apiError(
                targetMembershipError,
                "Unable to verify participant membership."
              );
            }

            if (!targetMembership) {
              return {
                error: {
                  status:
                    "INVALID_PARTICIPANT",
                  message:
                    "The selected user is not a member of this team.",
                },
              };
            }

            const {
              data,
              error,
            } = await supabase
              .from(
                "meeting_participants"
              )
              .upsert(
                {
                  meeting_id:
                    meetingId,
                  user_id:
                    userId,
                  role,
                  status:
                    "invited",
                },
                {
                  onConflict:
                    "meeting_id,user_id",
                }
              )
              .select("*")
              .single();

            if (error) {
              return apiError(
                error,
                "Unable to add participant."
              );
            }

            return {
              data,
            };
          },

          invalidatesTags: (
            result,
            error,
            { meetingId }
          ) => [
            {
              type: "MeetingParticipants",
              id: meetingId,
            },
            {
              type: "Meetings",
              id: meetingId,
            },
          ],
        }),

      // =====================================================
      // Remove Participant
      // =====================================================

      removeMeetingParticipant:
        builder.mutation({
          async queryFn({
            meetingId,
            userId,
          }) {
            const {
              error,
            } = await supabase
              .from(
                "meeting_participants"
              )
              .delete()
              .eq(
                "meeting_id",
                meetingId
              )
              .eq(
                "user_id",
                userId
              );

            if (error) {
              return apiError(
                error,
                "Unable to remove participant."
              );
            }

            return {
              data: {
                meetingId,
                userId,
              },
            };
          },

          invalidatesTags: (
            result,
            error,
            { meetingId }
          ) => [
            {
              type: "MeetingParticipants",
              id: meetingId,
            },
            {
              type: "Meetings",
              id: meetingId,
            },
          ],
        }),

      // =====================================================
      // Update Participation Status
      // =====================================================

      updateMeetingParticipantStatus:
        builder.mutation({
          async queryFn({
            meetingId,
            userId,
            status,
          }) {
            if (
              ![
                "invited",
                "joined",
                "left",
              ].includes(status)
            ) {
              return {
                error: {
                  status:
                    "VALIDATION_ERROR",
                  message:
                    "Invalid participant status.",
                },
              };
            }

            const updates = {
              status,
            };

            if (
              status === "joined"
            ) {
              updates.joined_at =
                new Date().toISOString();
              updates.left_at = null;
            }

            if (
              status === "left"
            ) {
              updates.left_at =
                new Date().toISOString();
            }

            const {
              data,
              error,
            } = await supabase
              .from(
                "meeting_participants"
              )
              .update(updates)
              .eq(
                "meeting_id",
                meetingId
              )
              .eq(
                "user_id",
                userId
              )
              .select("*")
              .single();

            if (error) {
              return apiError(
                error,
                "Unable to update participant status."
              );
            }

            return {
              data,
            };
          },

          invalidatesTags: (
            result,
            error,
            { meetingId }
          ) => [
            {
              type: "MeetingParticipants",
              id: meetingId,
            },
            {
              type: "Meetings",
              id: meetingId,
            },
          ],
        }),
    }),
    overrideExisting: false,
  });

export const {
  useGetMeetingParticipantsQuery,
  useAddMeetingParticipantMutation,
  useRemoveMeetingParticipantMutation,
  useUpdateMeetingParticipantStatusMutation,
} = meetingParticipantsApi;

