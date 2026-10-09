
import { apiSlice as baseApi } from "./apiBase";

import {
  useGetMyProfileQuery,
} from "./profileApi";

import {
  useGetMyTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
} from "./teamsApi";

import {
  useGetTeamMembersQuery,
  useAddTeamMemberMutation,
  useUpdateTeamMemberRoleMutation,
  useRemoveTeamMemberMutation,
} from "./teamMembersApi";

import {
  useGetMyProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from "./ProjectsApi";

import {
  useGetMyProjectAccessQuery,
} from "./projectPermissionsApi";

import {
  useGetProjectTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "./tasksApi";

import {
  useBulkImportTasksMutation,
} from "./taskImportApi";

import {
  useGetTaskByIdQuery,
} from "./taskDetailsApi";

import {
  useGetTaskCommentsQuery,
  useAddTaskCommentMutation,
  useDeleteTaskCommentMutation,
} from "./commentsApi";

import {
  useGetTaskActivityQuery,
} from "./activityApi";

import {
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "./notificationsApi";

import {
  useGetTeamChatMessagesQuery,
  useSendTeamChatMessageMutation,
  useUpdateTeamChatMessageMutation,
  useDeleteTeamChatMessageMutation,
  useGetTeamChatAttachmentUrlMutation,
} from "./teamChatApi";

import {
  useGetMyMeetingsQuery,
  useGetMeetingByIdQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
  useStartMeetingMutation,
  useEndMeetingMutation,
} from "./meetingsApi";

import {
  useGetMeetingParticipantsQuery,
  useAddMeetingParticipantMutation,
  useRemoveMeetingParticipantMutation,
  useUpdateMeetingParticipantStatusMutation,
} from "./meetingParticipantsApi";

import {
  useModerateMeetingMutation,
} from "./meetingModerationApi";

import {
  useGetReportsDataQuery,
} from "./reportsApi";

export const apiSlice = baseApi;

export {
  useGetMyProfileQuery,

  useGetMyTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,

  useGetTeamMembersQuery,
  useAddTeamMemberMutation,
  useUpdateTeamMemberRoleMutation,
  useRemoveTeamMemberMutation,

  useGetMyProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,

  useGetMyProjectAccessQuery,

  useGetProjectTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,

  // Task import
  useBulkImportTasksMutation,

  useGetTaskByIdQuery,

  useGetTaskCommentsQuery,
  useAddTaskCommentMutation,
  useDeleteTaskCommentMutation,

  useGetTaskActivityQuery,

  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,

  useGetTeamChatMessagesQuery,
  useSendTeamChatMessageMutation,
  useUpdateTeamChatMessageMutation,
  useDeleteTeamChatMessageMutation,
  useGetTeamChatAttachmentUrlMutation,

  useGetMyMeetingsQuery,
  useGetMeetingByIdQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
  useStartMeetingMutation,
  useEndMeetingMutation,

  useGetMeetingParticipantsQuery,
  useAddMeetingParticipantMutation,
  useRemoveMeetingParticipantMutation,
  useUpdateMeetingParticipantStatusMutation,

  useModerateMeetingMutation,

  // Reports
  useGetReportsDataQuery,
};
