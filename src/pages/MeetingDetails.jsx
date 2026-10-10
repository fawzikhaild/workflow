
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  Mic,
  Video,
  VideoOff,
} from "lucide-react";

import {
  Room,
} from "livekit-client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  VideoConference,
} from "@livekit/components-react";

import "@livekit/components-styles";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useSelector,
} from "react-redux";

import {
  Button,
} from "@/components/ui/button";

import {
  toast,
} from "sonner";

import {
  supabase,
} from "@/lib/supabaseClient";

import {
  useGetMeetingByIdQuery,
  useGetMeetingParticipantsQuery,
} from "@/store/api/apiSlice";

import {
  useModerateMeetingMutation,
} from "@/store/api/meetingModerationApi";

import HostMeetingControls from "@/components/meetings/HostMeetingControls";

export default function MeetingDetails() {
  const {
    meetingId,
  } = useParams();

  const navigate =
    useNavigate();

  const user =
    useSelector(
      (state) =>
        state.auth.user
    );

  const {
    data: meeting,
    isLoading,
    isError,
    refetch,
  } =
    useGetMeetingByIdQuery(
      meetingId,
      {
        skip:
          !meetingId,
      }
    );

  const {
    data: participants = [],
  } =
    useGetMeetingParticipantsQuery(
      meetingId,
      {
        skip:
          !meetingId,
      }
    );

  const [
    moderateMeeting,
    {
      isLoading:
        isModerating,
    },
  ] =
    useModerateMeetingMutation();

  const [
    livekitToken,
    setLivekitToken,
  ] = useState(null);

  const [
    livekitUrl,
    setLivekitUrl,
  ] = useState(null);

  const [
    isJoining,
    setIsJoining,
  ] = useState(false);

  const [
    isJoined,
    setIsJoined,
  ] = useState(false);

  const [
    localStatus,
    setLocalStatus,
  ] = useState(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const room = useMemo(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
      }),
    []
  );

  const effectiveStatus =
    localStatus ||
    meeting?.status;

  const isHost =
    Boolean(
      meeting &&
        user &&
        meeting.created_by ===
          user.id
    );

  // ==========================================================
  // Cleanup
  // ==========================================================

  useEffect(() => {
    return () => {
      room.disconnect(
        true
      );
    };
  }, [room]);

  // ==========================================================
  // Clear local error when meeting changes
  // ==========================================================

  useEffect(() => {
    setErrorMessage("");
  }, [meetingId]);

  // ==========================================================
  // Update participant status
  // ==========================================================

  async function updateParticipantStatus(
    status
  ) {
    if (
      !meetingId ||
      !user?.id
    ) {
      return;
    }

    const now =
      new Date().toISOString();

    // Host may not have a row yet.
    if (isHost) {
      const {
        error,
      } =
        await supabase
          .from(
            "meeting_participants"
          )
          .upsert(
            {
              meeting_id:
                meetingId,

              user_id:
                user.id,

              role:
                "host",

              status,

              joined_at:
                status ===
                "joined"
                  ? now
                  : undefined,

              left_at:
                status ===
                "left"
                  ? now
                  : undefined,
            },
            {
              onConflict:
                "meeting_id,user_id",
            }
          );

      if (error) {
        throw error;
      }

      return;
    }

    // Normal participants
    const updateData = {
      status,
      ...(status ===
        "joined" && {
        joined_at: now,
        left_at: null,
      }),
      ...(status ===
        "left" && {
        left_at: now,
      }),
    };

    const {
      error,
    } =
      await supabase
        .from(
          "meeting_participants"
        )
        .update(updateData)
        .eq(
          "meeting_id",
          meetingId
        )
        .eq(
          "user_id",
          user.id
        );

    if (error) {
      throw error;
    }
  }

  // ==========================================================
  // Get LiveKit token
  // ==========================================================

  async function fetchLiveKitToken() {
    const {
      data,
      error,
    } =
      await supabase.functions.invoke(
        "livekit-token",
        {
          body: {
            meetingId,
          },
        }
      );

    if (error) {
      throw error;
    }

    if (
      data?.error
    ) {
      throw new Error(
        data.error
      );
    }

    if (
      !data?.participant_token ||
      !data?.server_url
    ) {
      throw new Error(
        "LiveKit token response is incomplete."
      );
    }

    setLivekitToken(
      data.participant_token
    );

    setLivekitUrl(
      data.server_url
    );

    return data;
  }

  // ==========================================================
  // Start Meeting
  // ==========================================================

  async function handleStartMeeting() {
    if (
      !meetingId ||
      !user?.id
    ) {
      return;
    }

    try {
      setIsJoining(true);
      setErrorMessage("");

      const startedAt =
        new Date().toISOString();

      const {
        data,
        error,
      } =
        await supabase
          .from("meetings")
          .update({
            status: "live",
            started_at:
              startedAt,
          })
          .eq(
            "id",
            meetingId
          )
          .eq(
            "created_by",
            user.id
          )
          .select()
          .single();

      if (error) {
        throw error;
      }

      setLocalStatus(
        data.status
      );

      await updateParticipantStatus(
        "joined"
      );

      await fetchLiveKitToken();

      setIsJoined(true);

      toast.success(
        "Meeting started."
      );

      await refetch();
    } catch (error) {
      console.error(
        "Start Meeting Error:",
        error
      );

      const message =
        error?.message ||
        "Unable to start the meeting.";

      setErrorMessage(
        message
      );

      toast.error(
        message
      );
    } finally {
      setIsJoining(false);
    }
  }

  // ==========================================================
  // Join Meeting
  // ==========================================================

  async function handleJoinMeeting() {
    if (
      !meetingId ||
      !user?.id ||
      !meeting
    ) {
      return;
    }

    if (
      effectiveStatus !==
      "live"
    ) {
      toast.error(
        "This meeting is not live yet."
      );

      return;
    }

    try {
      setIsJoining(true);
      setErrorMessage("");

      await updateParticipantStatus(
        "joined"
      );

      await fetchLiveKitToken();

      setIsJoined(true);

      // Show successful connection after LiveKit connects and media is initialized.
    } catch (error) {
      console.error(
        "Join Meeting Error:",
        error
      );

      try {
        await updateParticipantStatus(
          "invited"
        );
      } catch {
        // Ignore rollback error.
      }

      const message =
        error?.message ||
        "Unable to join the meeting.";

      setErrorMessage(
        message
      );

      toast.error(
        message
      );
    } finally {
      setIsJoining(false);
    }
  }

  // ==========================================================
  // Leave Meeting
  // ==========================================================

  async function handleLeaveMeeting() {
    try {
      await room.disconnect(
        true
      );

      await updateParticipantStatus(
        "left"
      );
    } catch (error) {
      console.error(
        "Leave Meeting Error:",
        error
      );
    } finally {
      setIsJoined(false);
      setLivekitToken(null);
      setLivekitUrl(null);

      toast.success(
        "You left the meeting."
      );

      navigate(
        "/meetings"
      );
    }
  }

  // ==========================================================
  // End Meeting
  //
  // This is only a fallback handler.
  // HostMeetingControls is the main host control panel.
  // ==========================================================

  async function handleEndMeeting() {
    if (!isHost) {
      return;
    }

    const confirmed =
      window.confirm(
        "End this meeting for everyone?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await moderateMeeting({
        meetingId,
        action: "end",
      }).unwrap();

      await room.disconnect(
        true
      );

      setIsJoined(false);
      setLivekitToken(null);
      setLivekitUrl(null);

      toast.success(
        "Meeting ended for everyone."
      );

      navigate(
        "/meetings",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "End Meeting Error:",
        error
      );

      toast.error(
        error?.message ||
          "Unable to end meeting."
      );
    }
  }

  // ==========================================================
  // Enable local camera/microphone for every authorized user
  // ==========================================================

  const handleLiveKitConnected = useCallback(async () => {
    const results = await Promise.allSettled([
      room.localParticipant.setCameraEnabled(true),
      room.localParticipant.setMicrophoneEnabled(true),
    ]);

    const mediaErrors = [];

    if (results[0].status === "rejected") {
      const error = results[0].reason;
      mediaErrors.push(
        `Camera: ${error?.message || "Unable to access the camera."}`
      );
    }

    if (results[1].status === "rejected") {
      const error = results[1].reason;
      mediaErrors.push(
        `Microphone: ${error?.message || "Unable to access the microphone."}`
      );
    }

    if (mediaErrors.length > 0) {
      const message = `${mediaErrors.join(" ")} Check browser permissions and make sure another application is not using the device. You can retry below.`;
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setErrorMessage("");
    toast.success("Camera and microphone are ready.");
  }, [room]);

  const handleLiveKitError = useCallback((error) => {
    console.error("LiveKit Connection Error:", error);

    const message =
      error?.message ||
      "Unable to connect to the meeting. Please try joining again.";

    setErrorMessage(message);
    toast.error(message);
  }, []);

  const handleMediaDeviceFailure = useCallback((failure, kind) => {
    console.error("LiveKit Media Device Error:", {
      failure,
      kind,
    });

    const deviceName =
      kind === "videoinput"
        ? "camera"
        : kind === "audioinput"
          ? "microphone"
          : "media device";

    const message =
      `The ${deviceName} could not be started. Allow camera/microphone access for this site, check that the device is connected, then retry.`;

    setErrorMessage(message);
    toast.error(message);
  }, []);

  // ==========================================================
  // Loading
  // ==========================================================

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4">
        <div className="text-sm text-muted-foreground">
          Loading meeting...
        </div>
      </div>
    );
  }

  // ==========================================================
  // Error
  // ==========================================================

  if (
    isError ||
    !meeting
  ) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border bg-card p-6">
          <h1 className="text-lg font-semibold">
            Unable to load meeting
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            The meeting may no longer exist.
          </p>

          <Button
            asChild
            className="mt-5"
          >
            <Link to="/meetings">
              <ArrowLeft className="size-4" />
              Back to meetings
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // Ended / Cancelled
  // ==========================================================

  if (
    effectiveStatus ===
      "ended" ||
    effectiveStatus ===
      "cancelled"
  ) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border bg-card p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-muted-foreground" />

          <h1 className="mt-4 text-2xl font-semibold">
            {effectiveStatus ===
            "ended"
              ? "Meeting ended"
              : "Meeting cancelled"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            This meeting is no longer available.
          </p>

          <Button
            asChild
            className="mt-6"
          >
            <Link to="/meetings">
              <ArrowLeft className="size-4" />
              Back to meetings
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // LiveKit
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      {/* Header */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Button
            asChild
            variant="ghost"
            className="mb-3 -ml-2"
          >
            <Link to="/meetings">
              <ArrowLeft className="size-4" />
              Meetings
            </Link>
          </Button>

          <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
            {meeting.title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {meeting.scheduled_at
                ? new Date(
                    meeting.scheduled_at
                  ).toLocaleString()
                : "No schedule"}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-4" />
              {effectiveStatus}
            </span>

            <span>
              {participants.length} participant
              {participants.length ===
              1
                ? ""
                : "s"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isJoined &&
            effectiveStatus ===
              "scheduled" &&
            isHost && (
              <Button
                onClick={
                  handleStartMeeting
                }
                disabled={
                  isJoining
                }
              >
                <Video className="size-4" />

                {isJoining
                  ? "Starting..."
                  : "Start Meeting"}
              </Button>
            )}

          {!isJoined &&
            effectiveStatus ===
              "live" && (
              <Button
                onClick={
                  handleJoinMeeting
                }
                disabled={
                  isJoining
                }
              >
                <Video className="size-4" />

                {isJoining
                  ? "Joining..."
                  : "Join Meeting"}
              </Button>
            )}

          {isJoined &&
            !isHost && (
              <Button
                variant="outline"
                onClick={
                  handleLeaveMeeting
                }
              >
                <LogOut className="size-4" />
                Leave Meeting
              </Button>
            )}

          {isJoined &&
            isHost && (
              <Button
                variant="destructive"
                onClick={
                  handleEndMeeting
                }
                disabled={
                  isModerating
                }
              >
                <VideoOff className="size-4" />
                End Meeting
              </Button>
            )}
        </div>
      </div>

      {/* Page Error */}

      {errorMessage && (
        <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <p>{errorMessage}</p>
          {isJoined && (
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => {
                void handleLiveKitConnected();
              }}
            >
              Retry camera and microphone
            </Button>
          )}
        </div>
      )}

      {/* Not joined */}

      {!isJoined && (
        <div className="rounded-3xl border bg-card p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {effectiveStatus ===
              "live" ? (
                <Video className="size-7" />
              ) : (
                <Clock3 className="size-7" />
              )}
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              {effectiveStatus ===
              "live"
                ? "The meeting is live"
                : "Meeting is scheduled"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {effectiveStatus ===
              "live"
                ? "Join the meeting to enable camera, microphone, and real-time video."
                : isHost
                  ? "Start the meeting when everyone is ready."
                  : "Wait for the host to start the meeting."}
            </p>

            {effectiveStatus ===
              "live" && (
              <div className="mt-6">
                <Button
                  size="lg"
                  onClick={
                    handleJoinMeeting
                  }
                  disabled={
                    isJoining
                  }
                >
                  <Video className="size-4" />

                  {isJoining
                    ? "Joining..."
                    : "Join Meeting"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connected */}

      {isJoined &&
        livekitToken &&
        livekitUrl && (
          <div className="space-y-4">
            <LiveKitRoom
              room={room}
              token={
                livekitToken
              }
              serverUrl={
                livekitUrl
              }
              connect
              audio={false}
              video={false}
              onConnected={handleLiveKitConnected}
              onError={handleLiveKitError}
              onMediaDeviceFailure={handleMediaDeviceFailure}
              onDisconnected={() => {
                setIsJoined(false);
              }}
              className="min-h-[680px] overflow-hidden rounded-2xl border bg-black"
            >
              <div className="flex h-full min-h-[680px] flex-col">
                {/* Host controls */}

                {isHost && (
                  <div className="border-b bg-background p-3">
                    <HostMeetingControls
                      meetingId={
                        meeting.id
                      }
                      hostUserId={
                        meeting.created_by
                      }
                    />
                  </div>
                )}

                {/* LiveKit */}

                <div className="min-h-0 flex-1">
                  <VideoConference />
                </div>

                <RoomAudioRenderer />

                <StartAudio />
              </div>
            </LiveKitRoom>
          </div>
        )}
    </div>
  );
}

