
import {
  apiSlice,
} from "./apiBase";

import {
  apiError,
  getAuthenticatedUser,
} from "./apiHelpers";

import {
  supabase,
} from "@/lib/supabaseClient";

function getRoomName() {
  return `workflow-meeting-${crypto.randomUUID()}`;
}

// =====================================================
// Normalize participant IDs
// =====================================================

function normalizeParticipantIds(
  participantUserIds = []
) {
  if (!Array.isArray(participantUserIds)) {
    return [];
  }

  return [
    ...new Set(
      participantUserIds
        .map((participant) => {
          if (
            typeof participant ===
            "string"
          ) {
            return participant;
          }

          if (
            participant?.userId
          ) {
            return participant.userId;
          }

          if (
            participant?.user_id
          ) {
            return participant.user_id;
          }

          if (
            participant?.id
          ) {
            return participant.id;
          }

          return null;
        })
        .filter(Boolean)
    ),
  ];
}

// =====================================================
// Get Meeting Participants
// =====================================================

async function getMeetingParticipants(
  meetingId
) {
  const {
    data: participants,
    error,
  } =
    await supabase
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
    return {
      participants: [],
      error,
    };
  }

  if (!participants?.length) {
    return {
      participants: [],
      error: null,
    };
  }

  const userIds = [
    ...new Set(
      participants.map(
        (participant) =>
          participant.user_id
      )
    ),
  ];

  const {
    data: profiles,
    error: profilesError,
  } =
    await supabase
      .from("profiles")
      .select(
        "id, username, full_name"
      )
      .in(
        "id",
        userIds
      );

  if (profilesError) {
    return {
      participants: [],
      error:
        profilesError,
    };
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
    participants:
      participants.map(
        (participant) => ({
          ...participant,

          user:
            profileMap.get(
              participant.user_id
            ) || null,
        })
      ),

    error: null,
  };
}

// =====================================================
// API
// =====================================================

export const meetingsApi =
  apiSlice.injectEndpoints({
    endpoints: (
      builder
    ) => ({
      // =====================================================
      // My Meetings
      // =====================================================

      getMyMeetings:
        builder.query({
          async queryFn(userId) {
            const {
              user,
              error: authError,
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

            const {
              data: memberships,
              error:
                membershipsError,
            } =
              await supabase
                .from(
                  "team_members"
                )
                .select(
                  "team_id"
                )
                .eq(
                  "user_id",
                  user.id
                );

            if (
              membershipsError
            ) {
              return apiError(
                membershipsError,
                "Unable to load team memberships."
              );
            }

            const teamIds = [
              ...new Set(
                (
                  memberships ||
                  []
                ).map(
                  (item) =>
                    item.team_id
                )
              ),
            ];

            if (
              !teamIds.length
            ) {
              return {
                data: [],
              };
            }

            const {
              data: meetings,
              error:
                meetingsError,
            } =
              await supabase
                .from(
                  "meetings"
                )
                .select("*")
                .in(
                  "team_id",
                  teamIds
                )
                .order(
                  "scheduled_at",
                  {
                    ascending:
                      true,
                  }
                );

            if (
              meetingsError
            ) {
              return apiError(
                meetingsError,
                "Unable to load meetings."
              );
            }

            return {
              data:
                meetings ||
                [],
            };
          },

          providesTags:
            (result) =>
              result
                ? [
                    ...result.map(
                      (
                        meeting
                      ) => ({
                        type:
                          "Meetings",

                        id: meeting.id,
                      })
                    ),

                    {
                      type:
                        "Meetings",

                      id: "LIST",
                    },
                  ]
                : [
                    {
                      type:
                        "Meetings",

                      id: "LIST",
                    },
                  ],
        }),

      // =====================================================
      // Meeting By ID
      // =====================================================

      getMeetingById:
        builder.query({
          async queryFn(
            meetingId
          ) {
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

            const {
              data: meeting,
              error,
            } =
              await supabase
                .from(
                  "meetings"
                )
                .select("*")
                .eq(
                  "id",
                  meetingId
                )
                .single();

            if (error) {
              return apiError(
                error,
                "Unable to load meeting."
              );
            }

            if (!meeting) {
              return {
                error: {
                  status:
                    "MEETING_NOT_FOUND",

                  message:
                    "Meeting not found.",
                },
              };
            }

            const {
              data: membership,
              error:
                membershipError,
            } =
              await supabase
                .from(
                  "team_members"
                )
                .select(
                  "team_id,user_id,role"
                )
                .eq(
                  "team_id",
                  meeting.team_id
                )
                .eq(
                  "user_id",
                  user.id
                )
                .maybeSingle();

            if (
              membershipError
            ) {
              return apiError(
                membershipError,
                "Unable to verify team membership."
              );
            }

            if (
              !membership
            ) {
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
              participants,
              error:
                participantsError,
            } =
              await getMeetingParticipants(
                meeting.id
              );

            if (
              participantsError
            ) {
              return apiError(
                participantsError,
                "Unable to load meeting participants."
              );
            }

            return {
              data: {
                ...meeting,

                participants,
              },
            };
          },

          providesTags:
            (
              result,
              error,
              meetingId
            ) => [
              {
                type:
                  "Meetings",

                id: meetingId,
              },
            ],
        }),

      // =====================================================
      // Create Meeting
      // =====================================================

      createMeeting:
        builder.mutation({
          async queryFn({
            teamId,
            projectId = null,
            title,
            description = "",
            scheduledAt,
            participantUserIds = [],
            userId,
          }) {
            // -----------------------------------------------
            // Authentication
            // -----------------------------------------------

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

            // -----------------------------------------------
            // Validation
            // -----------------------------------------------

            if (!teamId) {
              return {
                error: {
                  status:
                    "VALIDATION_ERROR",

                  message:
                    "Team is required.",
                },
              };
            }

            if (
              !title?.trim()
            ) {
              return {
                error: {
                  status:
                    "VALIDATION_ERROR",

                  message:
                    "Meeting title is required.",
                },
              };
            }

            if (!scheduledAt) {
              return {
                error: {
                  status:
                    "VALIDATION_ERROR",

                  message:
                    "Meeting schedule is required.",
                },
              };
            }

            const scheduledDate =
              new Date(
                scheduledAt
              );

            if (
              Number.isNaN(
                scheduledDate.getTime()
              )
            ) {
              return {
                error: {
                  status:
                    "VALIDATION_ERROR",

                  message:
                    "Meeting schedule is invalid.",
                },
              };
            }

            if (
              scheduledDate.getTime() <=
              Date.now()
            ) {
              return {
                error: {
                  status:
                    "VALIDATION_ERROR",

                  message:
                    "Meeting must be scheduled for a future time.",
                },
              };
            }

            // -----------------------------------------------
            // Verify creator role
            // -----------------------------------------------

            const {
              data: creatorMembership,
              error:
                creatorMembershipError,
            } =
              await supabase
                .from(
                  "team_members"
                )
                .select(
                  "team_id,user_id,role"
                )
                .eq(
                  "team_id",
                  teamId
                )
                .eq(
                  "user_id",
                  user.id
                )
                .maybeSingle();

            if (
              creatorMembershipError
            ) {
              return apiError(
                creatorMembershipError,
                "Unable to verify team role."
              );
            }

            if (
              !creatorMembership ||
              ![
                "owner",
                "admin",
              ].includes(
                creatorMembership.role
              )
            ) {
              return {
                error: {
                  status:
                    "FORBIDDEN",

                  message:
                    "Only team owners and admins can create meetings.",
                },
              };
            }

            // -----------------------------------------------
            // Normalize participants
            // -----------------------------------------------

            const normalizedParticipants =
              normalizeParticipantIds(
                participantUserIds
              );

            // -----------------------------------------------
            // Load actual team members
            //
            // Security:
            // A creator cannot invite an arbitrary UUID.
            // Every participant must belong to this team.
            // -----------------------------------------------

            const {
              data: teamMembers,
              error:
                teamMembersError,
            } =
              await supabase
                .from(
                  "team_members"
                )
                .select(
                  "user_id,role"
                )
                .eq(
                  "team_id",
                  teamId
                );

            if (
              teamMembersError
            ) {
              return apiError(
                teamMembersError,
                "Unable to load team members."
              );
            }

            const teamMemberIds =
              new Set(
                (
                  teamMembers ||
                  []
                ).map(
                  (member) =>
                    member.user_id
                )
              );

            const invalidParticipantIds =
              normalizedParticipants.filter(
                (participantId) =>
                  !teamMemberIds.has(
                    participantId
                  )
              );

            if (
              invalidParticipantIds.length >
              0
            ) {
              return {
                error: {
                  status:
                    "INVALID_PARTICIPANTS",

                  message:
                    "One or more selected participants are not members of this team.",
                },
              };
            }

            // -----------------------------------------------
            // Always include creator as host
            // -----------------------------------------------

            const uniqueParticipants =
              [
                ...new Set([
                  user.id,
                  ...normalizedParticipants,
                ]),
              ];

            // -----------------------------------------------
            // Room
            // -----------------------------------------------

            const roomName =
              getRoomName();

            // -----------------------------------------------
            // Create Meeting
            // -----------------------------------------------

            const {
              data: meeting,
              error,
            } =
              await supabase
                .from(
                  "meetings"
                )
                .insert({
                  team_id:
                    teamId,

                  project_id:
                    projectId ||
                    null,

                  created_by:
                    user.id,

                  title:
                    title.trim(),

                  description:
                    description?.trim() ||
                    null,

                  status:
                    "scheduled",

                  scheduled_at:
                    scheduledDate.toISOString(),

                  room_name:
                    roomName,
                })
                .select("*")
                .single();

            if (error) {
              return apiError(
                error,
                "Unable to create meeting."
              );
            }

            // -----------------------------------------------
            // Participant Rows
            // -----------------------------------------------

            const participantRows =
              uniqueParticipants.map(
                (
                  participantId
                ) => ({
                  meeting_id:
                    meeting.id,

                  user_id:
                    participantId,

                  role:
                    participantId ===
                    user.id
                      ? "host"
                      : "participant",

                  status:
                    participantId ===
                    user.id
                      ? "invited"
                      : "invited",
                })
              );

            const {
              error:
                participantsError,
            } =
              await supabase
                .from(
                  "meeting_participants"
                )
                .insert(
                  participantRows
                );

            if (
              participantsError
            ) {
              // Roll back meeting if
              // participants cannot be created.
              await supabase
                .from(
                  "meetings"
                )
                .delete()
                .eq(
                  "id",
                  meeting.id
                );

              return apiError(
                participantsError,
                "Unable to create meeting participants."
              );
            }

            // -----------------------------------------------
            // Return complete participant data
            // -----------------------------------------------

            const {
              participants,
              error:
                participantsLoadError,
            } =
              await getMeetingParticipants(
                meeting.id
              );

            if (
              participantsLoadError
            ) {
              return {
                data: {
                  ...meeting,

                  participants:
                    participantRows,
                },
              };
            }

            return {
              data: {
                ...meeting,

                participants,
              },
            };
          },

          invalidatesTags: [
            {
              type:
                "Meetings",

              id: "LIST",
            },

            "Meetings",

            "MeetingParticipants",
          ],
        }),

      // =====================================================
      // Update Meeting
      // =====================================================

      updateMeeting:
        builder.mutation({
          async queryFn({
            meetingId,
            updates,
          }) {
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

            if (
              !meetingId ||
              !updates
            ) {
              return {
                error: {
                  status:
                    "VALIDATION_ERROR",

                  message:
                    "Meeting data is incomplete.",
                },
              };
            }

            // ------------------------------------------------
            // Do not allow arbitrary fields such as:
            // created_by
            // team_id
            // room_name
            // status
            // ------------------------------------------------

            const safeUpdates =
              {};

            const allowedFields = [
              "title",
              "description",
              "scheduled_at",
              "project_id",
            ];

            for (
              const field of
                allowedFields
            ) {
              if (
                Object.prototype.hasOwnProperty.call(
                  updates,
                  field
                )
              ) {
                safeUpdates[
                  field
                ] =
                  updates[field];
              }
            }

            if (
              Object.keys(
                safeUpdates
              ).length ===
              0
            ) {
              return {
                error: {
                  status:
                    "VALIDATION_ERROR",

                  message:
                    "No editable meeting fields were provided.",
                },
              };
            }

            if (
              safeUpdates.title !==
                undefined &&
              !safeUpdates.title?.trim()
            ) {
              return {
                error: {
                  status:
                    "VALIDATION_ERROR",

                  message:
                    "Meeting title is required.",
                },
              };
            }

            if (
              safeUpdates.scheduled_at
            ) {
              const scheduledDate =
                new Date(
                  safeUpdates.scheduled_at
                );

              if (
                Number.isNaN(
                  scheduledDate.getTime()
                )
              ) {
                return {
                  error: {
                    status:
                      "VALIDATION_ERROR",

                    message:
                      "Meeting schedule is invalid.",
                  },
                };
              }

              safeUpdates.scheduled_at =
                scheduledDate.toISOString();
            }

            // Do not trust the client
            // to identify the meeting owner.
            // RLS must also enforce this.
            const {
              data,
              error,
            } =
              await supabase
                .from(
                  "meetings"
                )
                .update(
                  safeUpdates
                )
                .eq(
                  "id",
                  meetingId
                )
                .eq(
                  "created_by",
                  user.id
                )
                .select("*")
                .single();

            if (error) {
              return apiError(
                error,
                "Unable to update meeting."
              );
            }

            return {
              data,
            };
          },

          invalidatesTags: (
            result,
            error,
            {
              meetingId,
            }
          ) => [
            {
              type:
                "Meetings",

              id: meetingId,
            },

            {
              type:
                "Meetings",

              id: "LIST",
            },
          ],
        }),

      // =====================================================
      // Delete Meeting
      // =====================================================

      deleteMeeting:
        builder.mutation({
          async queryFn(
            meetingId
          ) {
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
              error,
            } =
              await supabase
                .from(
                  "meetings"
                )
                .delete()
                .eq(
                  "id",
                  meetingId
                )
                .eq(
                  "created_by",
                  user.id
                );

            if (error) {
              return apiError(
                error,
                "Unable to delete meeting."
              );
            }

            return {
              data:
                meetingId,
            };
          },

          invalidatesTags: (
            result,
            error,
            meetingId
          ) => [
            {
              type:
                "Meetings",

              id: meetingId,
            },

            {
              type:
                "Meetings",

              id: "LIST",
            },

            {
              type:
                "MeetingParticipants",

              id: "LIST",
            },
          ],
        }),

      // =====================================================
      // Start Meeting
      // =====================================================

      startMeeting:
        builder.mutation({
          async queryFn(
            meetingId
          ) {
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
            } =
              await supabase
                .from(
                  "meetings"
                )
                .select(
                  "id,status,created_by"
                )
                .eq(
                  "id",
                  meetingId
                )
                .maybeSingle();

            if (
              meetingError
            ) {
              return apiError(
                meetingError,
                "Unable to load meeting."
              );
            }

            if (!meeting) {
              return {
                error: {
                  status:
                    "MEETING_NOT_FOUND",

                  message:
                    "Meeting not found.",
                },
              };
            }

            if (
              meeting.created_by !==
              user.id
            ) {
              return {
                error: {
                  status:
                    "FORBIDDEN",

                  message:
                    "Only the meeting host can start the meeting.",
                },
              };
            }

            if (
              meeting.status ===
                "ended" ||
              meeting.status ===
                "cancelled"
            ) {
              return {
                error: {
                  status:
                    "MEETING_CLOSED",

                  message:
                    "This meeting is no longer available.",
                },
              };
            }

            const {
              data,
              error,
            } =
              await supabase
                .from(
                  "meetings"
                )
                .update({
                  status:
                    "live",

                  started_at:
                    new Date().toISOString(),
                })
                .eq(
                  "id",
                  meetingId
                )
                .eq(
                  "created_by",
                  user.id
                )
                .select("*")
                .single();

            if (error) {
              return apiError(
                error,
                "Unable to start meeting."
              );
            }

            return {
              data,
            };
          },

          invalidatesTags: (
            result,
            error,
            meetingId
          ) => [
            {
              type:
                "Meetings",

              id: meetingId,
            },

            {
              type:
                "Meetings",

              id: "LIST",
            },
          ],
        }),

      // =====================================================
      // End Meeting
      // =====================================================

      endMeeting:
        builder.mutation({
          async queryFn(
            meetingId
          ) {
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

            // ------------------------------------------------
            // End through the secure server-side
            // moderation function.
            //
            // This ensures:
            // - only host can end
            // - LiveKit room is deleted
            // - everyone is disconnected
            // - DB status becomes ended
            // ------------------------------------------------

            const {
              data,
              error,
            } =
              await supabase.functions.invoke(
                "livekit-room-control",
                {
                  body: {
                    meetingId,
                    action:
                      "end",
                    requestedBy:
                      user.id,
                  },
                }
              );

            if (error) {
              let details =
                null;

              try {
                details =
                  await error.context?.json();
              } catch {
                // Ignore response parsing errors.
              }

              return {
                error: {
                  status:
                    details?.step ||
                    "END_MEETING_ERROR",

                  message:
                    details?.error ||
                    error.message ||
                    "Unable to end meeting.",
                },
              };
            }

            if (
              data?.error
            ) {
              return {
                error: {
                  status:
                    data.step ||
                    "END_MEETING_ERROR",

                  message:
                    data.error,
                },
              };
            }

            return {
              data:
                data ||
                meetingId,
            };
          },

          invalidatesTags: (
            result,
            error,
            meetingId
          ) => [
            {
              type:
                "Meetings",

              id: meetingId,
            },

            {
              type:
                "Meetings",

              id: "LIST",
            },

            {
              type:
                "MeetingParticipants",

              id: "LIST",
            },
          ],
        }),
    }),

    overrideExisting:
      false,
  });

export const {
  useGetMyMeetingsQuery,
  useGetMeetingByIdQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
  useStartMeetingMutation,
  useEndMeetingMutation,
} = meetingsApi;

