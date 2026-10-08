
import {
  createApi,
  fakeBaseQuery,
} from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",

  baseQuery: fakeBaseQuery(),

  tagTypes: [
    "Profile",
    "Teams",
    "TeamMembers",
    "Projects",
    "ProjectPermissions",
    "Tasks",
    "TeamChat",
    "Comments",
    "Notifications",
    "ActivityLogs",
    "Meetings",
    "MeetingParticipants",
  ],

  endpoints: () => ({}),
});

