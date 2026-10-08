
import {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useForm,
  Controller,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  z,
} from "zod";

import {
  CalendarDays,
  FolderKanban,
  Plus,
  Search,
  Users,
  Video,
  X,
} from "lucide-react";

import {
  useSelector,
} from "react-redux";

import {
  useGetMyMeetingsQuery,
  useGetMyTeamsQuery,
  useGetMyProjectsQuery,
  useGetTeamMembersQuery,
  useCreateMeetingMutation,
} from "@/store/api/apiSlice";

import {
  showAppToast,
} from "@/components/AppToast";

// ==========================================================
// Validation
// ==========================================================

const meetingSchema =
  z.object({
    teamId: z
      .string()
      .trim()
      .min(
        1,
        "Please select a team."
      ),

    projectId: z
      .string()
      .optional()
      .default(""),

    title: z
      .string()
      .trim()
      .min(
        3,
        "Meeting title must be at least 3 characters."
      )
      .max(
        100,
        "Meeting title must not exceed 100 characters."
      ),

    description: z
      .string()
      .trim()
      .max(
        500,
        "Description must not exceed 500 characters."
      )
      .optional()
      .default(""),

    scheduledAt: z
      .string()
      .min(
        1,
        "Please select a meeting date and time."
      )
      .refine(
        (value) => {
          const date =
            new Date(value);

          return !Number.isNaN(
            date.getTime()
          );
        },
        "Please enter a valid date and time."
      )
      .refine(
        (value) => {
          const selectedTime =
            new Date(
              value
            ).getTime();

          return (
            selectedTime >
            Date.now()
          );
        },
        "Meeting date and time must be in the future."
      ),

    participantIds:
      z
        .array(
          z.string()
        )
        .default([]),
  });

const filters = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "upcoming",
    label: "Upcoming",
  },
  {
    value: "live",
    label: "Live",
  },
  {
    value: "past",
    label: "Past",
  },
];

// ==========================================================
// Helpers
// ==========================================================

function formatDate(
  dateString
) {
  if (!dateString) {
    return "No date";
  }

  return new Date(
    dateString
  ).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function getMeetingStatus(
  meeting
) {
  const status =
    meeting?.status ||
    "scheduled";

  if (status === "live") {
    return {
      label: "Live",
      className:
        "border-green-500/20 bg-green-500/10 text-green-500",
    };
  }

  if (status === "ended") {
    return {
      label: "Ended",
      className:
        "border-muted bg-muted text-muted-foreground",
    };
  }

  if (status === "cancelled") {
    return {
      label: "Cancelled",
      className:
        "border-destructive/20 bg-destructive/10 text-destructive",
    };
  }

  return {
    label: "Scheduled",
    className:
      "border-primary/20 bg-primary/10 text-primary",
  };
}

function isPastMeeting(
  meeting
) {
  if (
    meeting?.status ===
      "ended" ||
    meeting?.status ===
      "cancelled"
  ) {
    return true;
  }

  if (
    !meeting?.scheduled_at
  ) {
    return false;
  }

  return (
    new Date(
      meeting.scheduled_at
    ).getTime() <
    Date.now()
  );
}

function getCreateMeetingErrorMessage(
  error
) {
  const status =
    error?.data?.status ||
    error?.data?.step ||
    error?.status;

  switch (status) {
    case "UNAUTHORIZED":
      return "Please sign in again before creating a meeting.";

    case "FORBIDDEN":
      return "You do not have permission to create this meeting.";

    case "INVALID_TEAM":
      return "The selected team is not valid.";

    case "INVALID_PROJECT":
      return "The selected project is not valid.";

    case "INVALID_PARTICIPANTS":
      return "One or more selected participants are not valid.";

    case "TEAM_NOT_FOUND":
      return "The selected team could not be found.";

    default:
      return "Unable to create the meeting. Please check your information and try again.";
  }
}

// ==========================================================
// Component
// ==========================================================

export default function Meetings() {
  const navigate =
    useNavigate();

  const user =
    useSelector(
      (state) =>
        state.auth.user
    );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: {
      errors,
    },
  } = useForm({
    resolver:
      zodResolver(
        meetingSchema
      ),

    defaultValues: {
      teamId: "",
      projectId: "",
      title: "",
      description: "",
      scheduledAt: "",
      participantIds: [],
    },
  });

  const teamId =
    watch("teamId");

  const [
    filter,
    setFilter,
  ] = useState("all");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    showCreate,
    setShowCreate,
  ] = useState(false);

  const {
    data: meetingsData,
    isLoading:
      meetingsLoading,
    isFetching:
      meetingsFetching,
    error:
      meetingsError,
  } =
    useGetMyMeetingsQuery(
      user?.id,
      {
        skip:
          !user?.id,
      }
    );

  const {
    data: teamsData,
    isLoading:
      teamsLoading,
  } =
    useGetMyTeamsQuery(
      user?.id,
      {
        skip:
          !user?.id,
      }
    );

  const {
    data: projectsData,
  } =
    useGetMyProjectsQuery(
      user?.id,
      {
        skip:
          !user?.id,
      }
    );

  const {
    data: teamMembersData,
  } =
    useGetTeamMembersQuery(
      teamId,
      {
        skip:
          !teamId,
      }
    );

  const [
    createMeeting,
    {
      isLoading:
        creating,
    },
  ] =
    useCreateMeetingMutation();

  const meetings =
    Array.isArray(
      meetingsData
    )
      ? meetingsData
      : meetingsData?.data ||
        [];

  const teams =
    Array.isArray(
      teamsData
    )
      ? teamsData
      : teamsData?.data ||
        [];

  const projects =
    Array.isArray(
      projectsData
    )
      ? projectsData
      : projectsData?.data ||
        [];

  const teamMembers =
    Array.isArray(
      teamMembersData
    )
      ? teamMembersData
      : teamMembersData?.data ||
        [];

  // ==========================================================
  // Project filtering
  // ==========================================================

  const filteredProjects =
    useMemo(() => {
      if (!teamId) {
        return projects;
      }

      return projects.filter(
        (project) =>
          String(
            project.team_id ||
              project.teamId ||
              ""
          ) ===
          String(teamId)
      );
    }, [
      projects,
      teamId,
    ]);

  // ==========================================================
  // Meetings filtering
  // ==========================================================

  const filteredMeetings =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return meetings.filter(
        (meeting) => {
          const title =
            meeting.title?.toLowerCase() ||
            "";

          const description =
            meeting.description?.toLowerCase() ||
            "";

          const matchesSearch =
            !query ||
            title.includes(
              query
            ) ||
            description.includes(
              query
            );

          if (!matchesSearch) {
            return false;
          }

          const isPast =
            isPastMeeting(
              meeting
            );

          if (
            filter ===
            "live"
          ) {
            return (
              meeting.status ===
              "live"
            );
          }

          if (
            filter ===
            "past"
          ) {
            return isPast;
          }

          if (
            filter ===
            "upcoming"
          ) {
            return (
              !isPast &&
              meeting.status !==
                "live"
            );
          }

          return true;
        }
      );
    }, [
      meetings,
      search,
      filter,
    ]);

  // ==========================================================
  // Team change
  // ==========================================================

  function handleTeamChange(
    event
  ) {
    const nextTeamId =
      event.target.value;

    setValue(
      "teamId",
      nextTeamId,
      {
        shouldValidate:
          true,
      }
    );

    setValue(
      "projectId",
      "",
      {
        shouldValidate:
          true,
      }
    );

    setValue(
      "participantIds",
      [],
      {
        shouldValidate:
          true,
      }
    );
  }

  // ==========================================================
  // Close form
  // ==========================================================

  function closeCreateDialog() {
    if (creating) {
      return;
    }

    setShowCreate(false);

    reset();
  }

  // ==========================================================
  // Create Meeting
  // ==========================================================

  async function handleCreateMeeting(
    values
  ) {
    try {
      const result =
        await createMeeting({
          teamId:
            values.teamId,

          projectId:
            values.projectId ||
            null,

          title:
            values.title.trim(),

          description:
            values.description
              ?.trim() ||
            null,

          scheduledAt:
            values.scheduledAt
              ? new Date(
                  values.scheduledAt
                ).toISOString()
              : null,

          // The API expects
          // participantUserIds.
          participantUserIds:
            values.participantIds ||
            [],

          userId:
            user?.id,
        }).unwrap();

      showAppToast({
        type: "success",
        title:
          "Meeting created",
        message:
          "The meeting was created successfully.",
      });

      setShowCreate(
        false
      );

      reset();

      const meetingId =
        result?.id ||
        result?.meeting?.id;

      if (meetingId) {
        navigate(
          `/meetings/${meetingId}`
        );
      }
    } catch (error) {
      console.error(
        "Create Meeting Error:",
        error
      );

      showAppToast({
        type: "error",
        title:
          "Unable to create meeting",
        message:
          getCreateMeetingErrorMessage(
            error
          ),
      });
    }
  }

  // ==========================================================
  // Loading
  // ==========================================================

  if (
    meetingsLoading ||
    teamsLoading
  ) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />

          <p className="text-sm text-muted-foreground">
            Loading meetings...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // Error
  // ==========================================================

  if (meetingsError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <h1 className="text-lg font-semibold">
            Unable to load meetings
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong
            while loading your
            meetings.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        {/* Header */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Video className="size-4" />

              Meetings
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Meetings
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Schedule, join and manage
              your team meetings.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowCreate(
                true
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Plus className="size-4" />

            New Meeting
          </button>
        </div>

        {/* Toolbar */}

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map(
              (item) => (
                <button
                  key={
                    item.value
                  }
                  type="button"
                  onClick={() =>
                    setFilter(
                      item.value
                    )
                  }
                  className={[
                    "rounded-xl border px-3 py-2 text-sm transition",
                    filter ===
                    item.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {
                    item.label
                  }
                </button>
              )
            )}
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search meetings..."
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>

        {/* Refresh */}

        {meetingsFetching && (
          <div className="mt-4 text-xs text-muted-foreground">
            Updating meetings...
          </div>
        )}

        {/* Empty */}

        {filteredMeetings.length ===
        0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
              <CalendarDays className="size-6 text-muted-foreground" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              No meetings found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              There are no meetings
              matching your
              current filters.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowCreate(
                  true
                )
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <Plus className="size-4" />

              Create meeting
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMeetings.map(
              (meeting) => {
                const status =
                  getMeetingStatus(
                    meeting
                  );

                const participantCount =
                  meeting
                    .participants
                    ?.length ??
                  meeting.participant_count ??
                  meeting.participants_count ??
                  0;

                return (
                  <Link
                    key={
                      meeting.id
                    }
                    to={`/meetings/${meeting.id}`}
                    className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Video className="size-5" />
                      </div>

                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-xs font-medium",
                          status.className,
                        ].join(" ")}
                      >
                        {
                          status.label
                        }
                      </span>
                    </div>

                    <h2 className="mt-5 line-clamp-1 text-lg font-semibold transition group-hover:text-primary">
                      {
                        meeting.title
                      }
                    </h2>

                    <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                      {meeting.description ||
                        "No description provided."}
                    </p>

                    <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 shrink-0" />

                        <span className="truncate">
                          {formatDate(
                            meeting.scheduled_at
                          )}
                        </span>
                      </div>

                      {meeting.team_name && (
                        <div className="flex items-center gap-2">
                          <Users className="size-4 shrink-0" />

                          <span className="truncate">
                            {
                              meeting.team_name
                            }
                          </span>
                        </div>
                      )}

                      {meeting.project_name && (
                        <div className="flex items-center gap-2">
                          <FolderKanban className="size-4 shrink-0" />

                          <span className="truncate">
                            {
                              meeting.project_name
                            }
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Users className="size-4 shrink-0" />

                        <span>
                          {
                            participantCount
                          }{" "}
                          participants
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-xs text-muted-foreground">
                        {meeting.room_name
                          ? "LiveKit room ready"
                          : "Meeting room pending"}
                      </span>

                      <span className="text-sm font-medium text-primary">
                        Open →
                      </span>
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Create Meeting
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Set up a new team
                  meeting.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCreateDialog
                }
                disabled={creating}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(
                handleCreateMeeting
              )}
              noValidate
              className="space-y-5 p-5"
            >
              {/* Team */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Team
                </label>

                <select
                  {...register(
                    "teamId"
                  )}
                  onChange={
                    handleTeamChange
                  }
                  className={[
                    "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition",
                    errors.teamId
                      ? "border-destructive focus:border-destructive"
                      : "border-border focus:border-primary",
                  ].join(" ")}
                >
                  <option value="">
                    Select a team
                  </option>

                  {teams.map(
                    (team) => (
                      <option
                        key={
                          team.id
                        }
                        value={
                          team.id
                        }
                      >
                        {
                          team.name
                        }
                      </option>
                    )
                  )}
                </select>

                {errors.teamId && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {
                      errors
                        .teamId
                        .message
                    }
                  </p>
                )}
              </div>

              {/* Project */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Project
                </label>

                <select
                  {...register(
                    "projectId"
                  )}
                  disabled={
                    !teamId
                  }
                  className={[
                    "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50",
                    errors.projectId
                      ? "border-destructive"
                      : "border-border focus:border-primary",
                  ].join(" ")}
                >
                  <option value="">
                    No project
                  </option>

                  {filteredProjects.map(
                    (project) => (
                      <option
                        key={
                          project.id
                        }
                        value={
                          project.id
                        }
                      >
                        {
                          project.name
                        }
                      </option>
                    )
                  )}
                </select>

                {errors.projectId && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {
                      errors
                        .projectId
                        .message
                    }
                  </p>
                )}
              </div>

              {/* Title */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium">
                    Meeting title
                  </label>

                  <span className="text-xs text-muted-foreground">
                    {watch(
                      "title"
                    )?.length || 0}
                    /100
                  </span>
                </div>

                <input
                  {...register(
                    "title"
                  )}
                  placeholder="Weekly team sync"
                  maxLength={100}
                  className={[
                    "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground transition",
                    errors.title
                      ? "border-destructive focus:border-destructive"
                      : "border-border focus:border-primary",
                  ].join(" ")}
                />

                {errors.title && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {
                      errors
                        .title
                        .message
                    }
                  </p>
                )}
              </div>

              {/* Description */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium">
                    Description
                  </label>

                  <span className="text-xs text-muted-foreground">
                    {watch(
                      "description"
                    )?.length || 0}
                    /500
                  </span>
                </div>

                <textarea
                  {...register(
                    "description"
                  )}
                  rows={4}
                  maxLength={500}
                  placeholder="What will this meeting cover?"
                  className={[
                    "w-full resize-none rounded-xl border bg-background px-3 py-3 text-sm outline-none placeholder:text-muted-foreground transition",
                    errors.description
                      ? "border-destructive focus:border-destructive"
                      : "border-border focus:border-primary",
                  ].join(" ")}
                />

                {errors.description && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {
                      errors
                        .description
                        .message
                    }
                  </p>
                )}
              </div>

              {/* Date */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Scheduled at
                </label>

                <input
                  type="datetime-local"
                  {...register(
                    "scheduledAt"
                  )}
                  min={new Date(
                    Date.now() -
                      new Date().getTimezoneOffset() *
                        60000
                  )
                    .toISOString()
                    .slice(
                      0,
                      16
                    )}
                  className={[
                    "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition",
                    errors.scheduledAt
                      ? "border-destructive focus:border-destructive"
                      : "border-border focus:border-primary",
                  ].join(" ")}
                />

                {errors.scheduledAt && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {
                      errors
                        .scheduledAt
                        .message
                    }
                  </p>
                )}
              </div>

              {/* Participants */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Participants
                </label>

                <Controller
                  name="participantIds"
                  control={control}
                  render={({
                    field,
                  }) => (
                    <select
                      multiple
                      value={
                        field.value ||
                        []
                      }
                      onChange={(
                        event
                      ) => {
                        const values =
                          Array.from(
                            event
                              .target
                              .selectedOptions
                          ).map(
                            (
                              option
                            ) =>
                              option.value
                          );

                        field.onChange(
                          values
                        );
                      }}
                      onBlur={
                        field.onBlur
                      }
                      disabled={
                        !teamId ||
                        teamMembers.length ===
                          0
                      }
                      className="min-h-40 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {teamMembers.map(
                        (
                          member
                        ) => {
                          const id =
                            member.user_id ||
                            member.userId;

                          const name =
                            member
                              .profile
                              ?.full_name ||
                            member.full_name ||
                            member.username ||
                            member.email ||
                            "Team member";

                          return (
                            <option
                              key={id}
                              value={id}
                            >
                              {name}
                            </option>
                          );
                        }
                      )}
                    </select>
                  )}
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  Hold Ctrl / Cmd to
                  select multiple
                  participants.
                </p>

                {errors.participantIds && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {
                      errors
                        .participantIds
                        .message
                    }
                  </p>
                )}
              </div>

              {/* Actions */}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeCreateDialog
                  }
                  disabled={
                    creating
                  }
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creating
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating && (
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  )}

                  {creating
                    ? "Creating..."
                    : "Create Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
