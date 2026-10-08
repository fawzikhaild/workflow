
import {
  useMemo,
} from "react";

import {
  MoreVertical,
  ShieldBan,
  UserMinus,
  Users,
} from "lucide-react";

import {
  useRemoteParticipants,
  useRoomContext,
} from "@livekit/components-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Button,
} from "@/components/ui/button";

import {
  toast,
} from "sonner";

import {
  useModerateMeetingMutation,
} from "@/store/api/meetingModerationApi";

export default function HostMeetingControls({
  meetingId,
  hostUserId,
}) {
  const navigate =
    useNavigate();

  const room =
    useRoomContext();

  const remoteParticipants =
    useRemoteParticipants();

  const [
    moderateMeeting,
    {
      isLoading:
        isModerating,
    },
  ] =
    useModerateMeetingMutation();

  const participants =
    useMemo(() => {
      return remoteParticipants.filter(
        (participant) =>
          participant.identity !==
          hostUserId
      );
    }, [
      remoteParticipants,
      hostUserId,
    ]);

  async function handleKick(
    participant
  ) {
    const confirmed =
      window.confirm(
        `Remove ${
          participant.name ||
          participant.identity
        } from this meeting?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await moderateMeeting({
        meetingId,
        action: "kick",
        participantUserId:
          participant.identity,
      }).unwrap();

      toast.success(
        "Participant removed from the meeting."
      );
    } catch (error) {
      console.error(
        "Kick participant error:",
        error
      );

      toast.error(
        error?.message ||
          "Unable to remove participant."
      );
    }
  }

  async function handleBan(
    participant
  ) {
    const confirmed =
      window.confirm(
        `Ban ${
          participant.name ||
          participant.identity
        } from this meeting?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await moderateMeeting({
        meetingId,
        action: "ban",
        participantUserId:
          participant.identity,
        reason:
          "Removed by meeting host.",
      }).unwrap();

      toast.success(
        "Participant banned from the meeting."
      );
    } catch (error) {
      console.error(
        "Ban participant error:",
        error
      );

      toast.error(
        error?.message ||
          "Unable to ban participant."
      );
    }
  }

  async function handleEndMeeting() {
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
        "End meeting error:",
        error
      );

      toast.error(
        error?.message ||
          "Unable to end meeting."
      );
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>

          <div>
            <h3 className="text-sm font-semibold">
              Host Controls
            </h3>

            <p className="text-xs text-muted-foreground">
              {participants.length} connected
              participant
              {participants.length ===
              1
                ? ""
                : "s"}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={
            isModerating
          }
          onClick={
            handleEndMeeting
          }
        >
          End Meeting
        </Button>
      </div>

      {participants.length ===
      0 ? (
        <div className="mt-4 rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          No other participants are currently connected.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {participants.map(
            (participant) => (
              <div
                key={
                  participant.identity
                }
                className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {participant.name ||
                      participant.identity}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {
                      participant.identity
                    }
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    title="Kick participant"
                    aria-label="Kick participant"
                    disabled={
                      isModerating
                    }
                    onClick={() =>
                      handleKick(
                        participant
                      )
                    }
                  >
                    <UserMinus className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    title="Ban participant"
                    aria-label="Ban participant"
                    disabled={
                      isModerating
                    }
                    onClick={() =>
                      handleBan(
                        participant
                      )
                    }
                  >
                    <ShieldBan className="size-4 text-destructive" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    title="More actions"
                    aria-label="More actions"
                    disabled={
                      isModerating
                    }
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

