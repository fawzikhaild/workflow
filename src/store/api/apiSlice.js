
import {
  apiSlice as baseApi,
} from "./apiBase";


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
  useGetProjectTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "./tasksApi";


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
  useGetMyProjectAccessQuery,
} from "./projectPermissionsApi";


export const apiSlice =
  baseApi;


export {
  // Profile

  useGetMyProfileQuery,


  // Teams

  useGetMyTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,


  // Team Members

  useGetTeamMembersQuery,
  useAddTeamMemberMutation,
  useUpdateTeamMemberRoleMutation,
  useRemoveTeamMemberMutation,


  // Projects

  useGetMyProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,


  // Project Permissions

  useGetMyProjectAccessQuery,


  // Tasks

  useGetProjectTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,


  // Task Details

  useGetTaskByIdQuery,


  // Comments

  useGetTaskCommentsQuery,
  useAddTaskCommentMutation,
  useDeleteTaskCommentMutation,


  // Activity

  useGetTaskActivityQuery,


  // Notifications

  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
};

