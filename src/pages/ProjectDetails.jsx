
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  FolderKanban,
  ListTodo,
  Pencil,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import {
  motion,
} from "motion/react";

import {
  skipToken,
} from "@reduxjs/toolkit/query/react";

import {
  useSelector,
} from "react-redux";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useDeleteProjectMutation,
  useGetProjectByIdQuery,
  useGetTeamMembersQuery,
  useUpdateProjectMutation,
} from "@/store/api/apiSlice";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
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
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";


// ============================================================
// Constants
// ============================================================

const projectStatuses = [
  {
    value: "planning",
    label: "Planning",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "on_hold",
    label: "On hold",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

const defaultForm = {
  name: "",
  description: "",
  status: "planning",
  startDate: "",
  dueDate: "",
};


// ============================================================
// Helpers
// ============================================================

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

function getStatusLabel(
  status
) {
  return (
    projectStatuses.find(
      (item) =>
        item.value === status
    )?.label || status
  );
}

function getStatusClasses(
  status
) {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

    case "completed":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";

    case "on_hold":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";

    case "archived":
      return "bg-muted text-muted-foreground";

    default:
      return "bg-primary/10 text-primary";
  }
}

function formatDate(
  value
) {
  if (!value) {
    return "Not set";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not set";
  }

  return date.toLocaleDateString();
}

function getInitials(
  name = ""
) {
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


// ============================================================
// Info Item
// ============================================================

function InfoItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>

      <p className="mt-2 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}


// ============================================================
// Page
// ============================================================

export default function ProjectDetails() {
  const {
    projectId,
  } = useParams();

  const navigate =
    useNavigate();

  const {
    user,
    initialized,
  } = useSelector(
    (state) => state.auth
  );

  const userId =
    initialized && user?.id
      ? user.id
      : null;

  const queryArg =
    userId && projectId
      ? {
          projectId,
          userId,
        }
      : skipToken;

  // ----------------------------------------------------------
  // Project
  // ----------------------------------------------------------

  const {
    data: project,
    isLoading:
      projectLoading,
    isFetching:
      projectFetching,
    isError:
      projectIsError,
    error:
      projectError,
  } = useGetProjectByIdQuery(
    queryArg
  );

  // ----------------------------------------------------------
  // Team Members
  // ----------------------------------------------------------

  const teamId =
    project?.team_id ||
    project?.team?.id ||
    project?.teams?.id ||
    null;

  const membersArg =
    teamId
      ? teamId
      : skipToken;

  const {
    data: membersData,
    isLoading:
      membersLoading,
  } =
    useGetTeamMembersQuery(
      membersArg
    );

  const members =
    membersData || [];

  // ----------------------------------------------------------
  // Mutations
  // ----------------------------------------------------------

  const [
    updateProject,
    updateState,
  ] =
    useUpdateProjectMutation();

  const [
    deleteProject,
    deleteState,
  ] =
    useDeleteProjectMutation();

  // ----------------------------------------------------------
  // Edit state
  // ----------------------------------------------------------

  const [
    editOpen,
    setEditOpen,
  ] = useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState(defaultForm);

  const [
    formError,
    setFormError,
  ] = useState("");

  // ----------------------------------------------------------
  // Keep form synced with project
  // ----------------------------------------------------------

  useEffect(() => {
    if (!project) {
      return;
    }

    setForm({
      name:
        project.name || "",

      description:
        project.description || "",

      status:
        project.status ||
        "planning",

      startDate:
        project.start_date || "",

      dueDate:
        project.due_date || "",
    });
  }, [project]);

  // ----------------------------------------------------------
  // Derived data
  // ----------------------------------------------------------

  const teamName =
    project?.team?.name ||
    project?.teams?.name ||
    "No team";

  const ownerId =
    project?.owner_id ||
    null;

  const ownerMember =
    useMemo(() => {
      if (!ownerId) {
        return null;
      }

      return (
        members.find(
          (member) =>
            member.user_id ===
            ownerId
        ) || null
      );
    }, [
      members,
      ownerId,
    ]);

  const ownerName =
    ownerMember?.profile
      ?.full_name ||
    ownerMember?.profile
      ?.username ||
    (ownerId === userId
      ? "You"
      : "Project owner");

  // ----------------------------------------------------------
  // Form
  // ----------------------------------------------------------

  function handleFormChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openEdit() {
    if (!project) {
      return;
    }

    setFormError("");

    setForm({
      name:
        project.name || "",

      description:
        project.description ||
        "",

      status:
        project.status ||
        "planning",

      startDate:
        project.start_date ||
        "",

      dueDate:
        project.due_date ||
        "",
    });

    setEditOpen(true);
  }

  function closeEdit() {
    if (
      updateState.isLoading
    ) {
      return;
    }

    setEditOpen(false);
    setFormError("");
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setFormError(
        "Project name is required."
      );

      return;
    }

    setFormError("");

    try {
      await updateProject({
        id:
          project.id,

        name:
          form.name.trim(),

        description:
          form.description.trim(),

        status:
          form.status,

        startDate:
          form.startDate ||
          null,

        dueDate:
          form.dueDate ||
          null,
      }).unwrap();

      setEditOpen(false);
    } catch (error) {
      console.error(
        "Update project error:",
        error
      );

      setFormError(
        getErrorMessage(
          error,
          "Unable to update project."
        )
      );
    }
  }

  // ----------------------------------------------------------
  // Delete
  // ----------------------------------------------------------

  async function handleDelete() {
    if (!project) {
      return;
    }

    try {
      await deleteProject(
        project.id
      ).unwrap();

      setDeleteOpen(false);

      navigate(
        "/projects",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Delete project error:",
        error
      );

      setDeleteOpen(false);

      setFormError(
        getErrorMessage(
          error,
          "Unable to delete project."
        )
      );
    }
  }

  // ----------------------------------------------------------
  // Loading / Auth
  // ----------------------------------------------------------

  if (!initialized) {
    return (
      <main className="flex min-h-full items-center justify-center">
        <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="flex min-h-full items-center justify-center px-4 py-16">
        <div className="text-center">
          <FolderKanban className="mx-auto size-8 text-muted-foreground" />

          <h1 className="mt-4 text-xl font-semibold">
            Authentication required
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in again to view this project.
          </p>
        </div>
      </main>
    );
  }

  if (
    projectLoading ||
    projectFetching
  ) {
    return (
      <main className="flex min-h-full items-center justify-center">
        <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  if (
    projectIsError ||
    !project
  ) {
    return (
      <main className="min-h-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Back to projects
          </Link>

          <div className="mt-8 rounded-2xl border border-dashed p-12 text-center">
            <FolderKanban className="mx-auto size-9 text-muted-foreground" />

            <h1 className="mt-4 text-xl font-semibold">
              Project not found
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {getErrorMessage(
                projectError,
                "This project does not exist or you do not have access to it."
              )}
            </p>

            <Button
              type="button"
              className="mt-6"
              onClick={() =>
                navigate(
                  "/projects"
                )
              }
            >
              Back to projects
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <main className="min-h-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Back */}
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to projects
        </Link>

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
          className="mt-6 rounded-3xl border bg-card p-6 sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FolderKanban className="size-7" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {project.name}
                  </h1>

                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-[10px] font-medium",
                      getStatusClasses(
                        project.status
                      ),
                    ].join(" ")}
                  >
                    {getStatusLabel(
                      project.status
                    )}
                  </span>
                </div>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {project.description ||
                    "No description added for this project."}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {teamName}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    Created{" "}
                    {formatDate(
                      project.created_at
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={
                  openEdit
                }
              >
                <Pencil className="size-4" />
                Edit
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  setDeleteOpen(
                    true
                  )
                }
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Project information
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                      Overview
                    </h2>
                  </div>

                  <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                    <FolderKanban className="size-4" />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <InfoItem
                    icon={
                      FolderKanban
                    }
                    label="Team"
                    value={
                      teamName
                    }
                  />

                  <InfoItem
                    icon={
                      UserRound
                    }
                    label="Owner"
                    value={
                      ownerName
                    }
                  />

                  <InfoItem
                    icon={
                      CalendarDays
                    }
                    label="Start date"
                    value={formatDate(
                      project.start_date
                    )}
                  />

                  <InfoItem
                    icon={
                      CalendarDays
                    }
                    label="Due date"
                    value={formatDate(
                      project.due_date
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Project work
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                      Tasks
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Manage tasks and workflow for this project.
                    </p>
                  </div>

                  <Button
                    asChild={false}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/tasks?project=${project.id}`
                      )
                    }
                  >
                    <ListTodo className="size-4" />
                    Open tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="size-5" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Team
                    </p>

                    <h2 className="font-semibold">
                      {teamName}
                    </h2>
                  </div>
                </div>

                {membersLoading ? (
                  <div className="mt-5 space-y-3">
                    {[1, 2, 3].map(
                      (item) => (
                        <div
                          key={item}
                          className="h-12 animate-pulse rounded-xl bg-muted"
                        />
                      )
                    )}
                  </div>
                ) : members.length ===
                  0 ? (
                  <div className="mt-5 rounded-xl border border-dashed p-5 text-center">
                    <Users className="mx-auto size-6 text-muted-foreground" />

                    <p className="mt-2 text-sm text-muted-foreground">
                      No team members found.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-2">
                    {members.map(
                      (member) => {
                        const name =
                          member
                            .profile
                            ?.full_name ||
                          member
                            .profile
                            ?.username ||
                          "Unknown user";

                        const username =
                          member
                            .profile
                            ?.username ||
                          "";

                        return (
                          <div
                            key={
                              member.user_id
                            }
                            className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-muted/50"
                          >
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {getInitials(
                                name
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {name}
                              </p>

                              {username && (
                                <p className="truncate text-xs text-muted-foreground">
                                  @{username}
                                </p>
                              )}
                            </div>

                            <span className="rounded-full bg-muted px-2 py-1 text-[10px] capitalize text-muted-foreground">
                              {member.role}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Timeline
                </p>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CalendarDays className="size-3.5" />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Start date
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(
                          project.start_date
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CalendarDays className="size-3.5" />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Due date
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(
                          project.due_date
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ======================================================
          Edit Dialog
      ====================================================== */}

      <Dialog
        open={editOpen}
        onOpenChange={
          setEditOpen
        }
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Edit project
            </DialogTitle>

            <DialogDescription>
              Update the project information.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="project-name">
                Project name
              </Label>

              <Input
                id="project-name"
                name="name"
                value={
                  form.name
                }
                onChange={
                  handleFormChange
                }
                placeholder="Project name"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">
                Description
              </Label>

              <textarea
                id="project-description"
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleFormChange
                }
                placeholder="Project description"
                className="min-h-28 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-status">
                Status
              </Label>

              <select
                id="project-status"
                name="status"
                value={
                  form.status
                }
                onChange={
                  handleFormChange
                }
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                {projectStatuses.map(
                  (status) => (
                    <option
                      key={
                        status.value
                      }
                      value={
                        status.value
                      }
                    >
                      {status.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-start-date">
                  Start date
                </Label>

                <Input
                  id="project-start-date"
                  name="startDate"
                  type="date"
                  value={
                    form.startDate
                  }
                  onChange={
                    handleFormChange
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-due-date">
                  Due date
                </Label>

                <Input
                  id="project-due-date"
                  name="dueDate"
                  type="date"
                  value={
                    form.dueDate
                  }
                  onChange={
                    handleFormChange
                  }
                />
              </div>
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
                onClick={
                  closeEdit
                }
                disabled={
                  updateState.isLoading
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  updateState.isLoading
                }
              >
                <Pencil className="size-4" />

                {updateState.isLoading
                  ? "Saving..."
                  : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================
          Delete Dialog
      ====================================================== */}

      <Dialog
        open={deleteOpen}
        onOpenChange={
          setDeleteOpen
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete project?
            </DialogTitle>

            <DialogDescription>
              This will permanently delete{" "}
              <strong>
                {project.name}
              </strong>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDeleteOpen(
                  false
                )
              }
              disabled={
                deleteState.isLoading
              }
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={
                handleDelete
              }
              disabled={
                deleteState.isLoading
              }
            >
              <Trash2 className="size-4" />

              {deleteState.isLoading
                ? "Deleting..."
                : "Delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

