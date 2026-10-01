
import {
  useMemo,
  useState,
} from "react";

import {
  FolderKanban,
  CalendarDays,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  ArrowRight,
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
} from "react-router-dom";

import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetMyProjectsQuery,
  useGetMyTeamsQuery,
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

const EMPTY_ARRAY = [];

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
  teamId: "",
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

function formatDate(date) {
  if (!date) {
    return "No date";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "No date";
  }

  return parsedDate.toLocaleDateString();
}

function getStatusLabel(status) {
  return (
    projectStatuses.find(
      (item) =>
        item.value === status
    )?.label || status
  );
}

function getStatusClasses(status) {
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


// ============================================================
// Project Card
// ============================================================

function ProjectCard({
  project,
  onEdit,
  onDelete,
}) {
  const teamName =
    project.team?.name ||
    project.teams?.name ||
    "No team";

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.3,
      }}
    >
      <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FolderKanban className="size-5" />
              </div>

              <div className="min-w-0">
                <Link
                  to={`/projects/${project.id}`}
                  className="line-clamp-2 text-base font-semibold tracking-tight transition-colors hover:text-primary"
                >
                  {project.name}
                </Link>

                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {teamName}
                </p>
              </div>
            </div>

            <span
              className={[
                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium",
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

          <p className="mt-5 line-clamp-3 min-h-[66px] text-sm leading-6 text-muted-foreground">
            {project.description ||
              "No description added yet."}
          </p>

          <div className="mt-5 space-y-2 border-t pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-3.5" />
                Team
              </span>

              <span className="max-w-[60%] truncate font-medium">
                {teamName}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Start
              </span>

              <span className="font-medium">
                {formatDate(
                  project.start_date
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Due
              </span>

              <span className="font-medium">
                {formatDate(
                  project.due_date
                )}
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 pt-1">
            <Button
              asChild={false}
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() =>
                onEdit(project)
              }
            >
              <Pencil className="size-4" />
              Edit
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Delete project"
              aria-label="Delete project"
              className="shrink-0 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={() =>
                onDelete(project)
              }
            >
              <Trash2 className="size-4" />
            </Button>

            <Button
              asChild={false}
              type="button"
              className="shrink-0"
              title="Open project"
              aria-label="Open project"
              onClick={() =>
                onEdit &&
                window.location.assign(
                  `/projects/${project.id}`
                )
              }
            >
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}


// ============================================================
// Page
// ============================================================

export default function Projects() {
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
    userId
      ? userId
      : skipToken;

  // ----------------------------------------------------------
  // Queries
  // ----------------------------------------------------------

  const {
    data: projectsData,
    isLoading: projectsLoading,
    isFetching: projectsFetching,
    isError: projectsIsError,
    error: projectsError,
  } = useGetMyProjectsQuery(
    queryArg
  );

  const {
    data: teamsData,
    isLoading: teamsLoading,
  } = useGetMyTeamsQuery(
    queryArg
  );

  const projects =
    projectsData ?? EMPTY_ARRAY;

  const teams =
    teamsData ?? EMPTY_ARRAY;

  // ----------------------------------------------------------
  // Mutations
  // ----------------------------------------------------------

  const [
    createProject,
    createState,
  ] =
    useCreateProjectMutation();

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
  // UI State
  // ----------------------------------------------------------

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    teamFilter,
    setTeamFilter,
  ] = useState("all");

  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false);

  const [
    editingProject,
    setEditingProject,
  ] = useState(null);

  const [
    deleteDialogOpen,
    setDeleteDialogOpen,
  ] = useState(false);

  const [
    projectToDelete,
    setProjectToDelete,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(defaultForm);

  const [
    formError,
    setFormError,
  ] = useState("");

  // ----------------------------------------------------------
  // Stats
  // ----------------------------------------------------------

  const stats = useMemo(() => {
    const active =
      projects.filter(
        (project) =>
          project.status ===
          "active"
      ).length;

    const completed =
      projects.filter(
        (project) =>
          project.status ===
          "completed"
      ).length;

    const planning =
      projects.filter(
        (project) =>
          project.status ===
          "planning"
      ).length;

    return {
      total: projects.length,
      active,
      completed,
      planning,
    };
  }, [projects]);

  // ----------------------------------------------------------
  // Filtering
  // ----------------------------------------------------------

  const filteredProjects =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return projects.filter(
        (project) => {
          const matchesSearch =
            !searchValue ||
            project.name
              ?.toLowerCase()
              .includes(
                searchValue
              ) ||
            project.description
              ?.toLowerCase()
              .includes(
                searchValue
              );

          const matchesStatus =
            statusFilter ===
              "all" ||
            project.status ===
              statusFilter;

          const projectTeamId =
            project.team_id ||
            project.team?.id ||
            project.teams?.id;

          const matchesTeam =
            teamFilter ===
              "all" ||
            projectTeamId ===
              teamFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesTeam
          );
        }
      );
    }, [
      projects,
      search,
      statusFilter,
      teamFilter,
    ]);

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

  function openCreateDialog() {
    setEditingProject(null);
    setFormError("");

    setForm({
      ...defaultForm,
      teamId:
        teams[0]?.id || "",
    });

    setDialogOpen(true);
  }

  function openEditDialog(
    project
  ) {
    setEditingProject(
      project
    );

    setFormError("");

    setForm({
      teamId:
        project.team_id ||
        project.team?.id ||
        project.teams?.id ||
        "",

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
    setEditingProject(
      null
    );
    setFormError("");
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setFormError("");

    if (!form.teamId) {
      setFormError(
        "Please select a team."
      );
      return;
    }

    if (!form.name.trim()) {
      setFormError(
        "Project name is required."
      );
      return;
    }

    try {
      if (editingProject) {
        await updateProject({
          id: editingProject.id,

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
      } else {
        await createProject({
          teamId:
            form.teamId,

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
      }

      closeDialog();
    } catch (error) {
      console.error(
        "Project save error:",
        error
      );

      setFormError(
        getErrorMessage(
          error,
          editingProject
            ? "Unable to update project."
            : "Unable to create project."
        )
      );
    }
  }

  // ----------------------------------------------------------
  // Delete
  // ----------------------------------------------------------

  function openDeleteDialog(
    project
  ) {
    setProjectToDelete(
      project
    );

    setDeleteDialogOpen(
      true
    );
  }

  async function confirmDelete() {
    if (!projectToDelete) {
      return;
    }

    try {
      await deleteProject(
        projectToDelete.id
      ).unwrap();

      setDeleteDialogOpen(
        false
      );

      setProjectToDelete(
        null
      );
    } catch (error) {
      console.error(
        "Project delete error:",
        error
      );

      setFormError(
        getErrorMessage(
          error,
          "Unable to delete project."
        )
      );

      setDeleteDialogOpen(
        false
      );
    }
  }

  // ----------------------------------------------------------
  // Loading
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
            Please sign in again to view your projects.
          </p>
        </div>
      </main>
    );
  }

  if (
    projectsLoading ||
    teamsLoading ||
    projectsFetching
  ) {
    return (
      <main className="flex min-h-full items-center justify-center">
        <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <main className="min-h-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1450px]">
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
          className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <p className="text-sm font-medium text-primary">
              Workspace
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Projects
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Organize your work into focused projects and keep
              your team aligned.
            </p>
          </div>

          <Button
            type="button"
            onClick={
              openCreateDialog
            }
            disabled={
              teams.length === 0
            }
          >
            <Plus className="size-4" />
            New project
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Total projects
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {stats.total}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Active
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {stats.active}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Planning
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {stats.planning}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Completed
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {stats.completed}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* No Teams */}
        {teams.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed p-8 text-center">
            <Users className="mx-auto size-8 text-muted-foreground" />

            <h2 className="mt-4 text-lg font-semibold">
              Create a team first
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Every project belongs to a team. Create your first
              team before adding a project.
            </p>

            <Link
              to="/teams"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Go to teams
            </Link>
          </div>
        )}

        {/* Filters */}
        {teams.length > 0 && (
          <div className="mt-8 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search projects..."
                className="pl-9"
              />
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            >
              <option value="all">
                All statuses
              </option>

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

            <select
              value={
                teamFilter
              }
              onChange={(
                event
              ) =>
                setTeamFilter(
                  event.target.value
                )
              }
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            >
              <option value="all">
                All teams
              </option>

              {teams.map(
                (team) => (
                  <option
                    key={team.id}
                    value={team.id}
                  >
                    {team.name}
                  </option>
                )
              )}
            </select>
          </div>
        )}

        {/* Error */}
        {projectsIsError && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">
              {getErrorMessage(
                projectsError,
                "Unable to load projects."
              )}
            </p>
          </div>
        )}

        {/* Projects */}
        {teams.length > 0 &&
          !projectsIsError && (
            <>
              {filteredProjects.length ===
              0 ? (
                <div className="mt-8 rounded-2xl border border-dashed p-12 text-center">
                  <FolderKanban className="mx-auto size-8 text-muted-foreground" />

                  <h2 className="mt-4 text-lg font-semibold">
                    No projects found
                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {projects.length ===
                    0
                      ? "Create your first project to get started."
                      : "Try changing your search or filters."}
                  </p>

                  {projects.length ===
                    0 && (
                    <Button
                      type="button"
                      className="mt-5"
                      onClick={
                        openCreateDialog
                      }
                    >
                      <Plus className="size-4" />
                      Create project
                    </Button>
                  )}
                </div>
              ) : (
                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProjects.map(
                    (project) => (
                      <ProjectCard
                        key={
                          project.id
                        }
                        project={
                          project
                        }
                        onEdit={
                          openEditDialog
                        }
                        onDelete={
                          openDeleteDialog
                        }
                      />
                    )
                  )}
                </div>
              )}
            </>
          )}
      </div>

      {/* ======================================================
          Create / Edit Dialog
      ====================================================== */}

      <Dialog
        open={dialogOpen}
        onOpenChange={
          setDialogOpen
        }
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingProject
                ? "Edit project"
                : "Create project"}
            </DialogTitle>

            <DialogDescription>
              {editingProject
                ? "Update your project information."
                : "Create a project and connect it to a team."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="project-team">
                Team
              </Label>

              <select
                id="project-team"
                name="teamId"
                value={
                  form.teamId
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  Boolean(
                    editingProject
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
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
                      {team.name}
                    </option>
                  )
                )}
              </select>
            </div>

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
                placeholder="e.g. Website redesign"
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
                placeholder="What is this project about?"
                className="min-h-28 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  closeDialog
                }
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
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingProject ? (
                      <Pencil className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}

                    {editingProject
                      ? "Save changes"
                      : "Create project"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================
          Delete Dialog
      ====================================================== */}

      <Dialog
        open={
          deleteDialogOpen
        }
        onOpenChange={
          setDeleteDialogOpen
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete project?
            </DialogTitle>

            <DialogDescription>
              {projectToDelete
                ? `This will permanently delete "${projectToDelete.name}".`
                : "This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDeleteDialogOpen(
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
              disabled={
                deleteState.isLoading
              }
              onClick={
                confirmDelete
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

