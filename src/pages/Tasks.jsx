
import {
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Eye,
  FolderKanban,
  GripVertical,
  LoaderCircle,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  Users,
  XCircle,
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
  useSearchParams,
} from "react-router-dom";

import {
  DragDropProvider,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";

import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetMyProjectsQuery,
  useGetMyProjectAccessQuery,
  useGetProjectTasksQuery,
  useGetTeamMembersQuery,
  useUpdateTaskMutation,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";


const EMPTY_ARRAY = [];


const columns = [
  {
    value: "todo",
    label: "To do",
    icon: Circle,
  },
  {
    value: "in_progress",
    label: "In progress",
    icon: Clock3,
  },
  {
    value: "review",
    label: "Review",
    icon: Eye,
  },
  {
    value: "done",
    label: "Done",
    icon: CheckCircle2,
  },
];


const priorities = [
  {
    value: "low",
    label: "Low",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "high",
    label: "High",
  },
  {
    value: "urgent",
    label: "Urgent",
  },
];


const defaultForm = {
  projectId: "",
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assigneeId: "",
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


function formatDate(value) {
  if (!value) {
    return "No date";
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "No date";
  }

  return date.toLocaleDateString();
}


function getPriorityClasses(
  priority
) {
  switch (priority) {
    case "urgent":
      return "bg-destructive/10 text-destructive";

    case "high":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400";

    case "medium":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";

    default:
      return "bg-muted text-muted-foreground";
  }
}


function getPriorityLabel(
  priority
) {
  return (
    priorities.find(
      (item) =>
        item.value === priority
    )?.label ||
    priority
  );
}


// ============================================================
// Permission helpers
// ============================================================

function canManageTasks(
  access
) {
  return (
    access?.role === "owner" ||
    access?.role === "manager"
  );
}


function canMemberEditTask(
  access,
  task,
  userId
) {
  return (
    access?.role === "member" &&
    task?.assignee_id === userId
  );
}


function canEditTask(
  access,
  task,
  userId
) {
  return (
    canManageTasks(access) ||
    canMemberEditTask(
      access,
      task,
      userId
    )
  );
}


// ============================================================
// Task Card
// ============================================================

function TaskCard({
  task,
  access,
  userId,
  onDelete,
}) {
  const canDrag =
    canManageTasks(access) ||
    canMemberEditTask(
      access,
      task,
      userId
    );


  const {
    ref,
    handleRef,
    isDragging,
  } = useDraggable({
    id: String(task.id),
    disabled:
      !canDrag,
  });


  const assigneeName =
    task.assignee?.full_name ||
    task.assignee?.username ||
    task.profile?.full_name ||
    task.profile?.username ||
    "";


  return (
    <div
      ref={ref}
      className={[
        "group rounded-xl border bg-card p-4 shadow-sm transition-all",

        isDragging
          ? "scale-[1.02] opacity-80 shadow-xl ring-2 ring-primary/20"
          : "hover:-translate-y-0.5 hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">

        <button
          ref={handleRef}
          type="button"
          disabled={!canDrag}
          aria-label={
            canDrag
              ? "Drag task"
              : "Task cannot be moved"
          }
          title={
            canDrag
              ? "Drag task"
              : "You cannot move this task"
          }
          className={[
            "mt-0.5 rounded-md p-1 text-muted-foreground transition",

            canDrag
              ? "cursor-grab hover:bg-muted hover:text-foreground active:cursor-grabbing"
              : "cursor-not-allowed opacity-40",
          ].join(" ")}
        >
          <GripVertical className="size-4" />
        </button>


        <div className="min-w-0 flex-1">
          <Link
            to={`/tasks/${task.id}`}
            className="line-clamp-2 text-sm font-semibold leading-5 transition-colors hover:text-primary"
          >
            {task.title}
          </Link>


          {task.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>


        <div className="flex items-center sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">

          {canEditTask(
            access,
            task,
            userId
          ) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              title="Open task"
              onClick={() => {
                window.location.assign(
                  `/tasks/${task.id}`
                );
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
          )}


          {canManageTasks(
            access
          ) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Delete task"
              onClick={() =>
                onDelete(task)
              }
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}

        </div>
      </div>


      <div className="mt-4 flex flex-wrap items-center gap-2">

        <span
          className={[
            "rounded-full px-2 py-1 text-[10px] font-medium",
            getPriorityClasses(
              task.priority
            ),
          ].join(" ")}
        >
          {getPriorityLabel(
            task.priority
          )}
        </span>


        {task.due_date && (
          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
            <CalendarDays className="size-3" />

            {formatDate(
              task.due_date
            )}
          </span>
        )}

      </div>


      <div className="mt-4 flex items-center justify-between gap-2">

        {assigneeName ? (
          <div className="flex min-w-0 items-center gap-2">

            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
              {assigneeName
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <span className="truncate text-[11px] text-muted-foreground">
              {assigneeName}
            </span>

          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            Unassigned
          </span>
        )}


        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MessageSquare className="size-3" />
          Comments
        </span>

      </div>
    </div>
  );
}


// ============================================================
// Kanban Column
// ============================================================

function KanbanColumn({
  column,
  tasks,
  access,
  userId,
  onDelete,
}) {
  const Icon =
    column.icon;


  const canDrop =
    canManageTasks(access) ||
    access?.role ===
      "member";


  const {
    ref,
    isDropTarget,
  } = useDroppable({
    id: column.value,
    disabled:
      !canDrop,
  });


  return (
    <div
      ref={ref}
      className={[
        "flex min-h-[520px] min-w-[280px] flex-1 flex-col rounded-2xl bg-muted/40 p-3 transition-all",

        isDropTarget
          ? "bg-primary/10 ring-2 ring-primary/20"
          : "",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between px-1">

        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />

          <h2 className="text-sm font-semibold">
            {column.label}
          </h2>
        </div>


        <span className="rounded-full bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">
          {tasks.length}
        </span>

      </div>


      <div className="flex flex-1 flex-col gap-3">

        {tasks.length === 0 ? (
          <div className="flex min-h-32 flex-1 items-center justify-center rounded-xl border border-dashed">
            <p className="px-4 text-center text-xs leading-5 text-muted-foreground">
              {canDrop
                ? "Drop tasks here"
                : "No tasks"}
            </p>
          </div>
        ) : (
          tasks.map(
            (task) => (
              <TaskCard
                key={task.id}
                task={task}
                access={access}
                userId={userId}
                onDelete={
                  onDelete
                }
              />
            )
          )
        )}

      </div>
    </div>
  );
}


// ============================================================
// Page
// ============================================================

export default function Tasks() {
  const {
    user,
    initialized,
  } = useSelector(
    (state) => state.auth
  );


  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();


  const userId =
    initialized &&
    user?.id
      ? user.id
      : null;


  // ==========================================================
  // Projects
  // ==========================================================

  const projectsArg =
    userId
      ? userId
      : skipToken;


  const {
    data: projectsData,
    isLoading:
      projectsLoading,
    isError:
      projectsIsError,
    error:
      projectsError,
  } =
    useGetMyProjectsQuery(
      projectsArg
    );


  const projects =
    projectsData ??
    EMPTY_ARRAY;


  const requestedProjectId =
    searchParams.get(
      "project"
    );


  const selectedProjectId =
    projects.some(
      (project) =>
        project.id ===
        requestedProjectId
    )
      ? requestedProjectId
      : projects[0]?.id ||
        "";


  const selectedProject =
    projects.find(
      (project) =>
        project.id ===
        selectedProjectId
    ) || null;


  function handleProjectChange(
    event
  ) {
    setSearchParams({
      project:
        event.target.value,
    });
  }


  // ==========================================================
  // Project permissions
  // ==========================================================

  const permissionsArg =
    userId &&
    selectedProjectId
      ? {
          projectId:
            selectedProjectId,

          userId,
        }
      : skipToken;


  const {
    data: access,
    isLoading:
      accessLoading,
    isError:
      accessIsError,
    error:
      accessError,
  } =
    useGetMyProjectAccessQuery(
      permissionsArg
    );


  const isManager =
    canManageTasks(
      access
    );


  const canCreateTasks =
    Boolean(
      access?.can_create_tasks
    );


  // ==========================================================
  // Tasks
  // ==========================================================

  const tasksArg =
    userId &&
    selectedProjectId
      ? {
          projectId:
            selectedProjectId,

          userId,
        }
      : skipToken;


  const {
    data: tasksData,
    isLoading:
      tasksLoading,
    isFetching:
      tasksFetching,
    isError:
      tasksIsError,
    error:
      tasksError,
  } =
    useGetProjectTasksQuery(
      tasksArg
    );


  const tasks =
    tasksData ??
    EMPTY_ARRAY;


  // ==========================================================
  // Members
  // ==========================================================

  const teamId =
    selectedProject?.team_id ||
    selectedProject?.team?.id ||
    selectedProject?.teams?.id ||
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
    membersData ??
    EMPTY_ARRAY;


  // ==========================================================
  // Mutations
  // ==========================================================

  const [
    createTask,
    createState,
  ] =
    useCreateTaskMutation();


  const [
    updateTask,
    updateState,
  ] =
    useUpdateTaskMutation();


  const [
    deleteTask,
    deleteState,
  ] =
    useDeleteTaskMutation();


  // ==========================================================
  // Dialog
  // ==========================================================

  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false);


  const [
    editingTask,
    setEditingTask,
  ] = useState(null);


  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);


  const [
    taskToDelete,
    setTaskToDelete,
  ] = useState(null);


  const [
    form,
    setForm,
  ] = useState(
    defaultForm
  );


  const [
    formError,
    setFormError,
  ] = useState("");


  const [
    actionError,
    setActionError,
  ] = useState("");


  // ==========================================================
  // Task permissions
  // ==========================================================

  const memberCanEdit =
    editingTask &&
    canMemberEditTask(
      access,
      editingTask,
      userId
    );


  const canEditFormTask =
    editingTask
      ? canEditTask(
          access,
          editingTask,
          userId
        )
      : canCreateTasks;


  // ==========================================================
  // Groups
  // ==========================================================

  const tasksByColumn =
    useMemo(() => {
      const groups = {
        todo: [],
        in_progress: [],
        review: [],
        done: [],
      };


      for (
        const task of tasks
      ) {
        if (
          groups[task.status]
        ) {
          groups[
            task.status
          ].push(task);
        }
      }


      return groups;
    }, [tasks]);


  const totalTasks =
    tasks.length;


  const completedTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "done"
    ).length;


  const urgentTasks =
    tasks.filter(
      (task) =>
        task.priority ===
        "urgent"
    ).length;


  // ==========================================================
  // Form
  // ==========================================================

  function handleFormChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;


    setForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }


  function openCreateDialog() {
    setEditingTask(null);
    setFormError("");


    setForm({
      ...defaultForm,

      projectId:
        selectedProjectId,

      assigneeId:
        "",
    });


    setDialogOpen(true);
  }


  function openEditDialog(
    task
  ) {
    if (
      !canEditTask(
        access,
        task,
        userId
      )
    ) {
      return;
    }


    setEditingTask(task);
    setFormError("");


    setForm({
      projectId:
        task.project_id,

      title:
        task.title || "",

      description:
        task.description ||
        "",

      status:
        task.status ||
        "todo",

      priority:
        task.priority ||
        "medium",

      assigneeId:
        task.assignee_id ||
        "",

      dueDate:
        task.due_date ||
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
    setEditingTask(null);
    setFormError("");
  }


  // ==========================================================
  // Submit
  // ==========================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setFormError("");


    if (
      !form.projectId
    ) {
      setFormError(
        "Please select a project."
      );

      return;
    }


    if (
      !form.title.trim()
    ) {
      setFormError(
        "Task title is required."
      );

      return;
    }


    try {
      if (
        editingTask
      ) {

        if (
          memberCanEdit
        ) {
          await updateTask({
            id:
              editingTask.id,

            projectId:
              editingTask.project_id,

            status:
              form.status,

            dueDate:
              form.dueDate ||
              null,
          }).unwrap();

        } else {
          await updateTask({
            id:
              editingTask.id,

            projectId:
              editingTask.project_id,

            title:
              form.title.trim(),

            description:
              form.description.trim(),

            status:
              form.status,

            priority:
              form.priority,

            assigneeId:
              form.assigneeId ||
              null,

            dueDate:
              form.dueDate ||
              null,
          }).unwrap();
        }

      } else {

        let assigneeId =
          form.assigneeId ||
          null;


        if (
          access?.role ===
          "member"
        ) {
          if (
            assigneeId &&
            assigneeId !==
              userId
          ) {
            setFormError(
              "Members can only assign a new task to themselves or leave it unassigned."
            );

            return;
          }


          assigneeId =
            assigneeId ===
            userId
              ? userId
              : null;
        }


        await createTask({
          projectId:
            form.projectId,

          title:
            form.title.trim(),

          description:
            form.description.trim(),

          status:
            form.status,

          priority:
            form.priority,

          assigneeId,

          dueDate:
            form.dueDate ||
            null,
        }).unwrap();
      }


      setDialogOpen(false);
      setEditingTask(null);
      setFormError("");

    } catch (error) {
      console.error(
        "Task save error:",
        error
      );


      setFormError(
        getErrorMessage(
          error,
          editingTask
            ? "Unable to update task."
            : "Unable to create task."
        )
      );
    }
  }


  // ==========================================================
  // Delete
  // ==========================================================

  function openDeleteDialog(
    task
  ) {
    if (
      !isManager
    ) {
      return;
    }


    setTaskToDelete(task);
    setDeleteOpen(true);
    setActionError("");
  }


  async function confirmDelete() {
    if (
      !taskToDelete ||
      !isManager
    ) {
      return;
    }


    try {
      await deleteTask({
        id:
          taskToDelete.id,

        projectId:
          taskToDelete.project_id,
      }).unwrap();


      setDeleteOpen(false);
      setTaskToDelete(null);

    } catch (error) {
      console.error(
        "Task delete error:",
        error
      );


      setActionError(
        getErrorMessage(
          error,
          "Unable to delete task."
        )
      );


      setDeleteOpen(false);
    }
  }


  // ==========================================================
  // Drag & Drop
  // ==========================================================

  async function handleDragEnd(
    event
  ) {
    if (
      event.canceled
    ) {
      return;
    }


    const source =
      event.operation
        ?.source;


    const target =
      event.operation
        ?.target;


    const sourceId =
      source?.id;


    const targetId =
      target?.id;


    if (
      sourceId == null ||
      targetId == null
    ) {
      return;
    }


    const nextStatus =
      String(targetId);


    if (
      !columns.some(
        (column) =>
          column.value ===
          nextStatus
      )
    ) {
      return;
    }


    const task =
      tasks.find(
        (item) =>
          String(item.id) ===
          String(sourceId)
      );


    if (!task) {
      return;
    }


    const canMove =
      isManager ||
      (
        access?.role ===
          "member" &&
        task.assignee_id ===
          userId
      );


    if (!canMove) {
      return;
    }


    if (
      task.status ===
      nextStatus
    ) {
      return;
    }


    setActionError("");


    try {
      await updateTask({
        id:
          task.id,

        projectId:
          task.project_id,

        status:
          nextStatus,
      }).unwrap();

    } catch (error) {
      console.error(
        "Move task error:",
        error
      );


      setActionError(
        getErrorMessage(
          error,
          "Unable to move the task."
        )
      );
    }
  }


  // ==========================================================
  // Loading
  // ==========================================================

  if (
    !initialized
  ) {
    return (
      <main className="flex min-h-full items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-primary" />
      </main>
    );
  }


  if (!userId) {
    return (
      <main className="flex min-h-full items-center justify-center px-4 py-16">
        <div className="text-center">

          <Users className="mx-auto size-8 text-muted-foreground" />

          <h1 className="mt-4 text-xl font-semibold">
            Authentication required
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in again to view your tasks.
          </p>

        </div>
      </main>
    );
  }


  if (
    projectsLoading
  ) {
    return (
      <main className="flex min-h-full items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-primary" />
      </main>
    );
  }


  return (
    <main className="min-h-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">

        {/* Header */}

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
            duration: 0.35,
          }}
          className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <p className="text-sm font-medium text-primary">
              Workspace
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Tasks
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Work across project tasks with permission-aware collaboration.
            </p>
          </div>


          <div className="flex flex-col gap-3 sm:flex-row">

            <select
              value={
                selectedProjectId
              }
              onChange={
                handleProjectChange
              }
              disabled={
                projects.length ===
                0
              }
              className="h-10 min-w-60 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
            >
              {projects.length ===
              0 ? (
                <option value="">
                  No projects
                </option>
              ) : (
                projects.map(
                  (project) => (
                    <option
                      key={
                        project.id
                      }
                      value={
                        project.id
                      }
                    >
                      {project.name}
                    </option>
                  )
                )
              )}
            </select>


            {canCreateTasks && (
              <Button
                type="button"
                onClick={
                  openCreateDialog
                }
              >
                <Plus className="size-4" />
                New task
              </Button>
            )}

          </div>
        </motion.div>


        {/* Project information */}

        {selectedProject && (
          <div className="mt-6 flex flex-wrap items-center gap-2">

            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs">

              <FolderKanban className="size-3.5 text-primary" />

              <span className="text-muted-foreground">
                {selectedProject.name}
              </span>

            </div>


            {access?.role && (
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium capitalize text-primary">
                {access.role}
              </span>
            )}

          </div>
        )}


        {accessLoading && (
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            Loading project permissions...
          </div>
        )}


        {accessIsError && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">
              {getErrorMessage(
                accessError,
                "Unable to load project permissions."
              )}
            </p>
          </div>
        )}


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


        {actionError && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">

            <p className="text-sm text-destructive">
              {actionError}
            </p>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                setActionError("")
              }
            >
              <XCircle className="size-4" />
            </Button>

          </div>
        )}


        {/* No projects */}

        {projects.length ===
        0 ? (

          <div className="mt-8 rounded-2xl border border-dashed p-12 text-center">

            <FolderKanban className="mx-auto size-9 text-muted-foreground" />

            <h2 className="mt-4 text-xl font-semibold">
              No projects yet
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Create a project before adding tasks.
            </p>

          </div>

        ) : tasksIsError ? (

          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
            <p className="text-sm text-destructive">
              {getErrorMessage(
                tasksError,
                "Unable to load tasks."
              )}
            </p>
          </div>

        ) : (

          <>

            {/* Stats */}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">

              <Card>
                <CardContent className="p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Circle className="size-4" />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total tasks
                      </p>

                      <p className="mt-1 text-xl font-semibold">
                        {totalTasks}
                      </p>
                    </div>

                  </div>

                </CardContent>
              </Card>


              <Card>
                <CardContent className="p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-4" />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Completed
                      </p>

                      <p className="mt-1 text-xl font-semibold">
                        {completedTasks}
                      </p>
                    </div>

                  </div>

                </CardContent>
              </Card>


              <Card>
                <CardContent className="p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                      <XCircle className="size-4" />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Urgent
                      </p>

                      <p className="mt-1 text-xl font-semibold">
                        {urgentTasks}
                      </p>
                    </div>

                  </div>

                </CardContent>
              </Card>

            </div>


            {/* Kanban */}

            <section className="mt-6">

              {tasksLoading ||
              tasksFetching ? (

                <div className="flex min-h-[520px] items-center justify-center rounded-2xl bg-muted/30">
                  <LoaderCircle className="size-7 animate-spin text-primary" />
                </div>

              ) : (

                <DragDropProvider
                  onDragEnd={
                    handleDragEnd
                  }
                >
                  <div className="flex gap-4 overflow-x-auto pb-4">

                    {columns.map(
                      (column) => (
                        <KanbanColumn
                          key={
                            column.value
                          }

                          column={
                            column
                          }

                          tasks={
                            tasksByColumn[
                              column.value
                            ] ||
                            EMPTY_ARRAY
                          }

                          access={
                            access
                          }

                          userId={
                            userId
                          }

                          onDelete={
                            openDeleteDialog
                          }
                        />
                      )
                    )}

                  </div>
                </DragDropProvider>
              )}

            </section>

          </>
        )}
      </div>


      {/* ======================================================
          Create / Edit
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
              {editingTask
                ? "Edit task"
                : "Create task"}
            </DialogTitle>

            <DialogDescription>
              {editingTask
                ? memberCanEdit
                  ? "As a member, you can update the status and due date of your assigned task."
                  : "Update the project task details."
                : "Add a new task to this project."}
            </DialogDescription>

          </DialogHeader>


          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-5"
          >

            {!editingTask && (
              <div className="space-y-2">

                <Label htmlFor="task-project">
                  Project
                </Label>

                <select
                  id="task-project"
                  name="projectId"
                  value={
                    form.projectId
                  }
                  onChange={
                    handleFormChange
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                >
                  {projects.map(
                    (project) => (
                      <option
                        key={
                          project.id
                        }
                        value={
                          project.id
                        }
                      >
                        {project.name}
                      </option>
                    )
                  )}
                </select>

              </div>
            )}


            <div className="space-y-2">

              <Label htmlFor="task-title">
                Task title
              </Label>

              <Input
                id="task-title"
                name="title"
                value={
                  form.title
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  Boolean(
                    editingTask &&
                    memberCanEdit
                  )
                }
                placeholder="e.g. Design landing page"
              />

            </div>


            <div className="space-y-2">

              <Label htmlFor="task-description">
                Description
              </Label>

              <textarea
                id="task-description"
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  Boolean(
                    editingTask &&
                    memberCanEdit
                  )
                }
                placeholder="Describe the work..."
                className="min-h-28 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
              />

            </div>


            <div className="grid gap-4 sm:grid-cols-2">

              <div className="space-y-2">

                <Label htmlFor="task-status">
                  Status
                </Label>

                <select
                  id="task-status"
                  name="status"
                  value={
                    form.status
                  }
                  onChange={
                    handleFormChange
                  }
                  disabled={
                    Boolean(
                      editingTask &&
                      !memberCanEdit &&
                      !isManager
                    )
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {columns.map(
                    (column) => (
                      <option
                        key={
                          column.value
                        }
                        value={
                          column.value
                        }
                      >
                        {column.label}
                      </option>
                    )
                  )}
                </select>

              </div>


              <div className="space-y-2">

                <Label htmlFor="task-priority">
                  Priority
                </Label>

                <select
                  id="task-priority"
                  name="priority"
                  value={
                    form.priority
                  }
                  onChange={
                    handleFormChange
                  }
                  disabled={
                    Boolean(
                      editingTask &&
                      memberCanEdit
                    )
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {priorities.map(
                    (priority) => (
                      <option
                        key={
                          priority.value
                        }
                        value={
                          priority.value
                        }
                      >
                        {priority.label}
                      </option>
                    )
                  )}
                </select>

              </div>

            </div>


            <div className="space-y-2">

              <Label htmlFor="task-assignee">
                Assignee
              </Label>

              <select
                id="task-assignee"
                name="assigneeId"
                value={
                  form.assigneeId
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  Boolean(
                    editingTask &&
                    memberCanEdit
                  ) ||
                  access?.role ===
                    "viewer" ||
                  access?.role ===
                    "guest"
                }
                className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  Unassigned
                </option>

                {members
                  .filter(
                    (member) =>
                      isManager ||
                      member.user_id ===
                        userId
                  )
                  .map(
                    (member) => {
                      const name =
                        member
                          .profile
                          ?.full_name ||
                        member
                          .profile
                          ?.username ||
                        (
                          member.user_id ===
                          userId
                            ? "You"
                            : "Unknown user"
                        );

                      return (
                        <option
                          key={
                            member.user_id
                          }
                          value={
                            member.user_id
                          }
                        >
                          {name}
                        </option>
                      );
                    }
                  )}
              </select>

            </div>


            <div className="space-y-2">

              <Label htmlFor="task-due-date">
                Due date
              </Label>

              <Input
                id="task-due-date"
                name="dueDate"
                type="date"
                value={
                  form.dueDate
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  Boolean(
                    editingTask &&
                    !memberCanEdit &&
                    !isManager
                  )
                }
              />

            </div>


            {memberCanEdit && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs leading-5 text-muted-foreground">
                  You are editing an assigned task. Title, description, priority and assignee are managed by project managers.
                </p>
              </div>
            )}


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
                  updateState.isLoading ||
                  !canEditFormTask
                }
              >
                {createState.isLoading ||
                updateState.isLoading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingTask ? (
                      <Pencil className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}

                    {editingTask
                      ? "Save changes"
                      : "Create task"}
                  </>
                )}
              </Button>

            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>


      {/* ======================================================
          Delete
      ====================================================== */}

      <AlertDialog
        open={
          deleteOpen
        }
        onOpenChange={
          setDeleteOpen
        }
      >
        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>
              Delete task?
            </AlertDialogTitle>

            <AlertDialogDescription>
              {taskToDelete
                ? `This will permanently delete "${taskToDelete.title}".`
                : "This action cannot be undone."}
            </AlertDialogDescription>

          </AlertDialogHeader>


          <AlertDialogFooter>

            <AlertDialogCancel
              disabled={
                deleteState.isLoading
              }
            >
              Cancel
            </AlertDialogCancel>


            <AlertDialogAction
              disabled={
                deleteState.isLoading
              }
              onClick={(event) => {
                event.preventDefault();

                confirmDelete();
              }}
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
                  Delete task
                </>
              )}
            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>

    </main>
  );
}

