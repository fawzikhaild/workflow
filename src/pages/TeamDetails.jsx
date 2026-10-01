
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  zodResolver,
} from "@hookform/resolvers/zod";
import {
  useForm,
} from "react-hook-form";
import {
  motion,
} from "motion/react";
import {
  ArrowLeft,
  Crown,
  LoaderCircle,
  Mail,
  Shield,
  UserMinus,
  Users,
} from "lucide-react";
import {
  Link,
  useParams,
} from "react-router-dom";
import {
  useSelector,
} from "react-redux";
import {
  skipToken,
} from "@reduxjs/toolkit/query/react";

import {
  useAddTeamMemberMutation,
  useGetMyTeamsQuery,
  useGetTeamMembersQuery,
  useRemoveTeamMemberMutation,
  useUpdateTeamMemberRoleMutation,
} from "@/store/api/apiSlice";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const memberSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address."),

  role: z.enum([
    "admin",
    "member",
    "guest",
  ]),
});

function getErrorMessage(
  error,
  fallback
) {
  return (
    error?.data?.message ||
    error?.data?.error ||
    error?.message ||
    error?.error ||
    fallback
  );
}

function getInitials(name = "") {
  const parts = name
    .trim()
    .split(" ")
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function RoleIcon({ role }) {
  if (role === "owner") {
    return (
      <Crown className="size-4" />
    );
  }

  if (role === "admin") {
    return (
      <Shield className="size-4" />
    );
  }

  return (
    <Users className="size-4" />
  );
}

export default function TeamDetails() {
  const { teamId } = useParams();

  const {
    user,
    initialized,
  } = useSelector(
    (state) => state.auth
  );

  /*
   * Do not run the query until the
   * authenticated user is available.
   */
  const teamsQueryArg =
    initialized && user?.id
      ? user.id
      : skipToken;

  const membersQueryArg =
    initialized && teamId
      ? teamId
      : skipToken;

  const {
    data: teams = [],
    isLoading: teamsLoading,
    isFetching: teamsFetching,
    isError: teamsIsError,
    error: teamsError,
  } = useGetMyTeamsQuery(
    teamsQueryArg
  );

  const {
    data: members = [],
    isLoading: membersLoading,
    isError: membersIsError,
    error: membersError,
  } = useGetTeamMembersQuery(
    membersQueryArg
  );

  const [
    addTeamMember,
    addState,
  ] =
    useAddTeamMemberMutation();

  const [
    updateTeamMemberRole,
  ] =
    useUpdateTeamMemberRoleMutation();

  const [
    removeTeamMember,
    removeState,
  ] =
    useRemoveTeamMemberMutation();

  const [
    addDialogOpen,
    setAddDialogOpen,
  ] = useState(false);

  const [
    removeDialogOpen,
    setRemoveDialogOpen,
  ] = useState(false);

  const [
    memberToRemove,
    setMemberToRemove,
  ] = useState(null);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    updatingMemberId,
    setUpdatingMemberId,
  ] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
    },
  } = useForm({
    resolver:
      zodResolver(
        memberSchema
      ),

    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const team = teams.find(
    (item) =>
      item.id === teamId
  );

  const currentRole =
    team?.memberRole || null;

  const canManage =
    currentRole === "owner" ||
    currentRole === "admin";

  const memberCount =
    members.length;

  useEffect(() => {
    if (!addDialogOpen) {
      reset({
        email: "",
        role: "member",
      });
    }
  }, [
    addDialogOpen,
    reset,
  ]);

  function openAddDialog() {
    setFormError("");
    setActionError("");

    reset({
      email: "",
      role: "member",
    });

    setAddDialogOpen(true);
  }

  async function onAddMember(
    values
  ) {
    setFormError("");

    try {
      await addTeamMember({
        teamId,
        email: values.email,
        role: values.role,
      }).unwrap();

      setAddDialogOpen(false);

      reset({
        email: "",
        role: "member",
      });
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          "Unable to add this member."
        )
      );
    }
  }

  async function changeRole(
    userId,
    role
  ) {
    setActionError("");
    setUpdatingMemberId(userId);

    try {
      await updateTeamMemberRole({
        teamId,
        userId,
        role,
      }).unwrap();
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          "Unable to update the member role."
        )
      );
    } finally {
      setUpdatingMemberId(null);
    }
  }

  function openRemoveDialog(
    member
  ) {
    setActionError("");
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
  }

  async function confirmRemove() {
    if (!memberToRemove) {
      return;
    }

    try {
      await removeTeamMember({
        teamId,
        userId:
          memberToRemove.user_id,
      }).unwrap();

      setRemoveDialogOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          "Unable to remove this member."
        )
      );
    }
  }

  /*
   * Wait for AuthSync first.
   */
  if (!initialized) {
    return (
      <main className="flex min-h-[calc(100svh-72px)] items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-primary" />
      </main>
    );
  }

  /*
   * Wait until the user's teams are available.
   */
  if (
    teamsLoading ||
    teamsFetching
  ) {
    return (
      <main className="flex min-h-[calc(100svh-72px)] items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-primary" />
      </main>
    );
  }

  /*
   * Handle team query failure.
   */
  if (teamsIsError) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to teams
          </Link>

          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <Users className="mx-auto size-8 text-destructive" />

            <h1 className="mt-4 text-xl font-semibold">
              Unable to load team
            </h1>

            <p className="mt-2 text-sm text-destructive">
              {getErrorMessage(
                teamsError,
                "Unable to load your team information."
              )}
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Team does not belong to the current user.
   */
  if (!team) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to teams
          </Link>

          <div className="mt-8 rounded-2xl border border-dashed p-12 text-center">
            <Users className="mx-auto size-8 text-muted-foreground" />

            <h1 className="mt-4 text-xl font-semibold">
              Team not found
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              You may no longer have access to this
              team.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
          }}
        >
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to teams
          </Link>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="size-5" />
                </div>

                <h1 className="text-3xl font-semibold tracking-tight">
                  {team.name}
                </h1>

                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                  {currentRole}
                </span>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {team.description ||
                  "No description provided."}
              </p>
            </div>

            {canManage && (
              <Button
                type="button"
                onClick={
                  openAddDialog
                }
                className="w-full sm:w-auto"
              >
                <Mail className="size-4" />
                Add member
              </Button>
            )}
          </div>
        </motion.div>

        {actionError && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">
              {actionError}
            </p>
          </div>
        )}

        {/* Members */}
        <motion.section
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            delay: 0.08,
          }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>
                    Team members
                  </CardTitle>

                  <CardDescription>
                    People who can collaborate inside this
                    workspace.
                  </CardDescription>
                </div>

                <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {memberCount}{" "}
                  {memberCount === 1
                    ? "member"
                    : "members"}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {membersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <LoaderCircle className="size-7 animate-spin text-primary" />
                </div>
              ) : membersIsError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                  <p className="text-sm text-destructive">
                    {getErrorMessage(
                      membersError,
                      "Unable to load team members."
                    )}
                  </p>
                </div>
              ) : members.length === 0 ? (
                <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
                  <Users className="mx-auto size-7 text-muted-foreground" />

                  <h3 className="mt-4 font-semibold">
                    No members yet
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Add your first team member to
                    begin collaborating.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {members.map(
                    (member) => {
                      const profile =
                        member.profile;

                      const name =
                        profile?.full_name ||
                        profile?.username ||
                        "Unknown user";

                      const initials =
                        getInitials(name);

                      const isCurrentUser =
                        member.user_id ===
                        user?.id;

                      const isOwner =
                        member.role ===
                        "owner";

                      const canModify =
                        canManage &&
                        !isOwner &&
                        !isCurrentUser;

                      return (
                        <div
                          key={
                            member.user_id
                          }
                          className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {initials}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-medium">
                                  {name}
                                </p>

                                {isCurrentUser && (
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    You
                                  </span>
                                )}
                              </div>

                              <p className="truncate text-xs text-muted-foreground">
                                @
                                {profile?.username ||
                                  "unknown"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium capitalize">
                              <RoleIcon
                                role={
                                  member.role
                                }
                              />

                              {
                                member.role
                              }
                            </div>

                            {canModify && (
                              <select
                                value={
                                  member.role
                                }
                                disabled={
                                  updatingMemberId ===
                                  member.user_id
                                }
                                onChange={(
                                  event
                                ) =>
                                  changeRole(
                                    member.user_id,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="h-9 rounded-lg border bg-background px-3 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Change role for ${name}`}
                              >
                                <option value="admin">
                                  Admin
                                </option>

                                <option value="member">
                                  Member
                                </option>

                                <option value="guest">
                                  Guest
                                </option>
                              </select>
                            )}

                            {canModify && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Remove member"
                                aria-label={`Remove ${name}`}
                                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                onClick={() =>
                                  openRemoveDialog(
                                    member
                                  )
                                }
                              >
                                <UserMinus className="size-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Add Member */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={
          setAddDialogOpen
        }
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Add team member
            </DialogTitle>

            <DialogDescription>
              Enter the email address of an existing
              WorkFlow account.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(
              onAddMember
            )}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="member-email">
                Email address
              </Label>

              <Input
                id="member-email"
                type="email"
                placeholder="alex@example.com"
                autoFocus
                {...register("email")}
              />

              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-role">
                Team role
              </Label>

              <select
                id="member-role"
                {...register("role")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="member">
                  Member
                </option>

                <option value="admin">
                  Admin
                </option>

                <option value="guest">
                  Guest
                </option>
              </select>

              <p className="text-xs text-muted-foreground">
                Admins can manage team members. Guests have
                limited access.
              </p>
            </div>

            {formError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm text-destructive">
                  {formError}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setAddDialogOpen(false)
                }
                disabled={
                  addState.isLoading
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  addState.isLoading
                }
              >
                {addState.isLoading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Users className="size-4" />
                    Add member
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member */}
      <AlertDialog
        open={removeDialogOpen}
        onOpenChange={
          setRemoveDialogOpen
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove this member?
            </AlertDialogTitle>

            <AlertDialogDescription>
              {memberToRemove
                ? `Remove "${memberToRemove.profile?.full_name || memberToRemove.profile?.username || "this user"}" from ${team.name}?`
                : "This member will lose access to the team."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={
                removeState.isLoading
              }
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={
                removeState.isLoading
              }
              onClick={(event) => {
                event.preventDefault();
                confirmRemove();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {removeState.isLoading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <UserMinus className="size-4" />
                  Remove member
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
