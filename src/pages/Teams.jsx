
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Crown,
  Edit3,
  FolderKanban,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Shield,
  Trash2,
  Users,
} from "lucide-react";

import {
  useCreateTeamMutation,
  useDeleteTeamMutation,
  useGetMyTeamsQuery,
  useUpdateTeamMutation,
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

const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Team name must be at least 2 characters."
    )
    .max(
      80,
      "Team name must be less than 80 characters."
    ),

  description: z
    .string()
    .trim()
    .max(
      300,
      "Description must be less than 300 characters."
    )
    .optional(),
});

function getErrorMessage(error, fallback) {
  return (
    error?.data?.message ||
    error?.data?.error ||
    error?.message ||
    error?.error ||
    fallback
  );
}

function TeamIcon({ role }) {
  if (role === "owner") {
    return <Crown className="size-5" />;
  }

  if (role === "admin") {
    return <Shield className="size-5" />;
  }

  return <Users className="size-5" />;
}

export default function Teams() {
  const {
    data: teams = [],
    isLoading,
    isError,
    error,
  } = useGetMyTeamsQuery();

  const [createTeam, createState] =
    useCreateTeamMutation();

  const [updateTeam, updateState] =
    useUpdateTeamMutation();

  const [deleteTeam, deleteState] =
    useDeleteTeamMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] =
    useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  const [teamToDelete, setTeamToDelete] =
    useState(null);

  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(teamSchema),

    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (editingTeam) {
      reset({
        name: editingTeam.name || "",
        description:
          editingTeam.description || "",
      });

      return;
    }

    reset({
      name: "",
      description: "",
    });
  }, [editingTeam, reset]);

  function openCreateDialog() {
    setEditingTeam(null);
    setFormError("");
    reset({
      name: "",
      description: "",
    });
    setDialogOpen(true);
  }

  function openEditDialog(team) {
    setEditingTeam(team);
    setFormError("");
    setDialogOpen(true);
  }

  function closeDialog() {
    if (
      createState.isLoading ||
      updateState.isLoading
    ) {
      return;
    }

    setDialogOpen(false);
    setEditingTeam(null);
    setFormError("");
    reset();
  }

  async function onSubmit(values) {
    setFormError("");

    try {
      if (editingTeam) {
        await updateTeam({
          id: editingTeam.id,
          name: values.name,
          description: values.description,
        }).unwrap();
      } else {
        await createTeam({
          name: values.name,
          description: values.description,
        }).unwrap();
      }

      setDialogOpen(false);
      setEditingTeam(null);
      reset();
    } catch (mutationError) {
      setFormError(
        getErrorMessage(
          mutationError,
          editingTeam
            ? "Unable to update this team."
            : "Unable to create this team."
        )
      );
    }
  }

  function openDeleteDialog(team) {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!teamToDelete) {
      return;
    }

    try {
      await deleteTeam(
        teamToDelete.id
      ).unwrap();

      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    } catch (deleteError) {
      console.error(
        "Delete team error:",
        deleteError
      );
    }
  }

  const ownedTeams = teams.filter(
    (team) => team.memberRole === "owner"
  ).length;

  const adminTeams = teams.filter(
    (team) => team.memberRole === "admin"
  ).length;

  return (
    <main className="min-h-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
          }}
          className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-sm font-medium text-primary">
              Workspace
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Teams
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create and manage the teams that
              collaborate on your projects.
            </p>
          </div>

          <Button
            type="button"
            onClick={openCreateDialog}
            className="w-full sm:w-auto"
          >
            <Plus className="size-4" />
            New team
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
              delay: 0.05,
            }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="size-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Total teams
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {teams.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

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
              delay: 0.1,
            }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground">
                  <Crown className="size-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Teams I own
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {ownedTeams}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

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
              delay: 0.15,
            }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground">
                  <Shield className="size-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Admin teams
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {adminTeams}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Teams */}
        <motion.section
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            delay: 0.2,
          }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Your teams</CardTitle>

              <CardDescription>
                All teams connected to your account.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <LoaderCircle className="size-7 animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                  <p className="text-sm text-destructive">
                    {getErrorMessage(
                      error,
                      "Unable to load your teams."
                    )}
                  </p>
                </div>
              ) : teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                    <Users className="size-6 text-muted-foreground" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    No teams yet
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Create your first team to start
                    organizing members, projects,
                    and tasks.
                  </p>

                  <Button
                    type="button"
                    onClick={openCreateDialog}
                    className="mt-6"
                  >
                    <Plus className="size-4" />
                    Create your first team
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {teams.map((team, index) => {
                    const canEdit =
                      team.memberRole === "owner" ||
                      team.memberRole === "admin";

                    const canDelete =
                      team.memberRole === "owner";

                    return (
                      <motion.div
                        key={team.id}
                        initial={{
                          opacity: 0,
                          y: 10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.04,
                        }}
                      >
                        <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                          <CardContent className="flex h-full flex-col p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <TeamIcon
                                  role={team.memberRole}
                                />
                              </div>

                              {(canEdit ||
                                canDelete) && (
                                <div className="flex items-center gap-1">
                                  {canEdit && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      title="Edit team"
                                      aria-label="Edit team"
                                      onClick={() =>
                                        openEditDialog(
                                          team
                                        )
                                      }
                                    >
                                      <Edit3 className="size-4" />
                                    </Button>
                                  )}

                                  {canDelete && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      title="Delete team"
                                      aria-label="Delete team"
                                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() =>
                                        openDeleteDialog(
                                          team
                                        )
                                      }
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="mt-5">
                              <div className="flex items-center gap-2">
                                <h3 className="truncate text-base font-semibold">
                                  {team.name}
                                </h3>

                                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium capitalize">
                                  {team.memberRole}
                                </span>
                              </div>

                              <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                                {team.description ||
                                  "No description provided."}
                              </p>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-6 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Users className="size-3.5" />
                                Team workspace
                              </div>

                              <div className="flex items-center gap-1.5">
                                <FolderKanban className="size-3.5" />
                                Projects
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTeam
                ? "Edit team"
                : "Create a new team"}
            </DialogTitle>

            <DialogDescription>
              {editingTeam
                ? "Update your team's basic information."
                : "Create a workspace for people and projects to collaborate."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="team-name">
                Team name
              </Label>

              <Input
                id="team-name"
                autoFocus
                placeholder="e.g. Product Design"
                {...register("name")}
              />

              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-description">
                Description
              </Label>

              <textarea
                id="team-description"
                placeholder="What does this team work on?"
                {...register("description")}
                className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              />

              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
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
                onClick={closeDialog}
                disabled={
                  createState.isLoading ||
                  updateState.isLoading
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  createState.isLoading ||
                  updateState.isLoading
                }
              >
                {createState.isLoading ||
                updateState.isLoading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    {editingTeam
                      ? "Saving..."
                      : "Creating..."}
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    {editingTeam
                      ? "Save changes"
                      : "Create team"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this team?
            </AlertDialogTitle>

            <AlertDialogDescription>
              {teamToDelete
                ? `This will permanently delete "${teamToDelete.name}" and its team membership data. This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteState.isLoading}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteState.isLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteState.isLoading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete team
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

