
import {
  useMemo,
  useState,
} from "react";

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock3,
  Eye,
  FolderKanban,
  LoaderCircle,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
  UserRound,
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
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useAddTaskCommentMutation,
  useDeleteTaskCommentMutation,
  useDeleteTaskMutation,
  useGetMyProjectAccessQuery,
  useGetProjectByIdQuery,
  useGetTaskActivityQuery,
  useGetTaskByIdQuery,
  useGetTaskCommentsQuery,
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
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";


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


function getInitials(
  name = ""
) {
  const parts =
    name
      .trim()
      .split(" ")
      .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return "U";
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
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


function formatDateTime(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString();
}


function getStatusClasses(
  status
) {
  switch (status) {
    case "done":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

    case "review":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";

    case "in_progress":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";

    default:
      return "bg-muted text-muted-foreground";
  }
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


function getLabel(
  items,
  value
) {
  return (
    items.find(
      (item) =>
        item.value === value
    )?.label ||
    value
  );
}


function getActivityText(
  activity
) {
  switch (
    activity.action
  ) {
    case "task.created":
      return "created this task";

    case "task.updated":
      return "updated this task";

    case "task.status_changed": {
      const from =
        activity.metadata
          ?.from;

      const to =
        activity.metadata
          ?.to;

      return `moved the task from ${getLabel(
        columns,
        from
      )} to ${getLabel(
        columns,
        to
      )}`;
    }

    case "task.deleted":
      return "deleted the task";

    case "comment.created":
      return "added a comment";

    case "comment.deleted":
      return "deleted a comment";

    default:
      return "updated the activity";
  }
}


function canManageTasks(
  access
) {
  return (
    access?.role === "owner" ||
    access?.role === "manager"
  );
}


function canEditAssignedTask(
  access,
  task,
  userId
) {
  return (
    access?.role === "member" &&
    task?.assignee_id === userId
  );
}


export default function TaskDetails() {
  const {
    taskId,
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
    initialized &&
    user?.id
      ? user.id
      : null;


  // ==========================================================
  // Task
  // ==========================================================

  const taskArg =
    userId && taskId
      ? {
          taskId,
          userId,
        }
      : skipToken;


  const {
    data: task,
    isLoading:
      taskLoading,
    isFetching:
      taskFetching,
    isError:
      taskIsError,
    error:
      taskError,
  } =
    useGetTaskByIdQuery(
      taskArg
    );


  // ==========================================================
  // Project
  // ==========================================================

  const projectArg =
    userId &&
    task?.project_id
      ? {
          projectId:
            task.project_id,
          userId,
        }
      : skipToken;


  const {
    data: project,
  } =
    useGetProjectByIdQuery(
      projectArg
    );


  // ==========================================================
  // Project permissions
  // ==========================================================

  const accessArg =
    userId &&
    task?.project_id
      ? {
          projectId:
            task.project_id,

          userId,
        }
      : skipToken;


  const {
    data: access,
    isLoading:
      accessLoading,
  } =
    useGetMyProjectAccessQuery(
      accessArg
    );


  const isManager =
    canManageTasks(
      access
    );


  const isAssignedMember =
    canEditAssignedTask(
      access,
      task,
      userId
    );


  const canEditTask =
    isManager ||
    isAssignedMember;


  const canDeleteTask =
    isManager;


  const canChangeStatus =
    isManager ||
    isAssignedMember;


  // ==========================================================
  // Members
  // ==========================================================

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


  const membersMap =
    useMemo(() => {
      return new Map(
        members.map(
          (member) => [
            member.user_id,
            member,
          ]
        )
      );
    }, [members]);


  // ==========================================================
  // Comments
  // ==========================================================

  const commentsArg =
    userId && taskId
      ? {
          taskId,
          userId,
        }
      : skipToken;


  const {
    data: commentsData,
    isLoading:
      commentsLoading,
    isError:
      commentsIsError,
    error:
      commentsError,
  } =
    useGetTaskCommentsQuery(
      commentsArg
    );


  const comments =
    commentsData || [];


  // ==========================================================
  // Activity
  // ==========================================================

  const activityArg =
    userId && taskId
      ? {
          taskId,
          userId,
        }
      : skipToken;


  const {
    data: activityData,
    isLoading:
      activityLoading,
    isError:
      activityIsError,
    error:
      activityError,
  } =
    useGetTaskActivityQuery(
      activityArg
    );


  const activity =
    activityData || [];


  // ==========================================================
  // Mutations
  // ==========================================================

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


  const [
    addComment,
    addCommentState,
  ] =
    useAddTaskCommentMutation();


  const [
    deleteComment,
    deleteCommentState,
  ] =
    useDeleteTaskCommentMutation();


  // ==========================================================
  // UI
  // ==========================================================

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
  ] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assigneeId: "",
    dueDate: "",
  });


  const [
    formError,
    setFormError,
  ] = useState("");


  const [
    actionError,
    setActionError,
  ] = useState("");


  const [
    commentText,
    setCommentText,
  ] = useState("");


  // ==========================================================
  // Derived
  // ==========================================================

  const assignee =
    task?.assignee_id
      ? membersMap.get(
          task.assignee_id
        )
      : null;


  const assigneeName =
    assignee?.profile
      ?.full_name ||
    assignee?.profile
      ?.username ||
    "Unassigned";


  const creator =
    task?.created_by
      ? membersMap.get(
          task.created_by
        )
      : null;


  const creatorName =
    creator?.profile
      ?.full_name ||
    creator?.profile
      ?.username ||
    (
      task?.created_by ===
      userId
        ? "You"
        : "Team member"
    );


  const teamName =
    project?.team?.name ||
    project?.teams?.name ||
    "Team";


  const canDeleteComments =
    isManager;


  // ==========================================================
  // Edit
  // ==========================================================

  function openEdit() {
    if (
      !task ||
      !canEditTask
    ) {
      return;
    }


    setFormError("");


    setForm({
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


    setEditOpen(true);
  }


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


  async function handleSave() {
    if (
      !task ||
      !canEditTask
    ) {
      return;
    }


    setFormError("");


    if (
      !isAssignedMember &&
      !form.title.trim()
    ) {
      setFormError(
        "Task title is required."
      );

      return;
    }


    try {
      if (
        isAssignedMember &&
        !isManager
      ) {

        await updateTask({
          id:
            task.id,

          projectId:
            task.project_id,

          status:
            form.status,

          dueDate:
            form.dueDate ||
            null,
        }).unwrap();

      } else {

        await updateTask({
          id:
            task.id,

          projectId:
            task.project_id,

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


      setEditOpen(false);

    } catch (error) {
      console.error(
        "Update task error:",
        error
      );


      setFormError(
        getErrorMessage(
          error,
          "Unable to update task."
        )
      );
    }
  }


  // ==========================================================
  // Status
  // ==========================================================

  async function handleStatusChange(
    event
  ) {
    if (
      !task ||
      !canChangeStatus
    ) {
      return;
    }


    try {
      setActionError("");


      await updateTask({
        id:
          task.id,

        projectId:
          task.project_id,

        status:
          event.target.value,
      }).unwrap();

    } catch (error) {
      console.error(
        "Status update error:",
        error
      );


      setActionError(
        getErrorMessage(
          error,
          "Unable to update status."
        )
      );
    }
  }


  // ==========================================================
  // Delete
  // ==========================================================

  async function handleDelete() {
    if (
      !task ||
      !canDeleteTask
    ) {
      return;
    }


    try {
      setActionError("");


      await deleteTask({
        id:
          task.id,

        projectId:
          task.project_id,
      }).unwrap();


      setDeleteOpen(false);


      navigate(
        task.project_id
          ? `/tasks?project=${task.project_id}`
          : "/tasks",
        {
          replace: true,
        }
      );

    } catch (error) {
      console.error(
        "Delete task error:",
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
  // Comments
  // ==========================================================

  async function handleAddComment(
    event
  ) {
    event.preventDefault();


    if (
      !taskId ||
      !commentText.trim()
    ) {
      return;
    }


    try {
      setActionError("");


      await addComment({
        taskId,

        content:
          commentText.trim(),
      }).unwrap();


      setCommentText("");

    } catch (error) {
      console.error(
        "Add comment error:",
        error
      );


      setActionError(
        getErrorMessage(
          error,
          "Unable to add comment."
        )
      );
    }
  }


  async function handleDeleteComment(
    commentId
  ) {
    try {
      setActionError("");


      await deleteComment({
        id:
          commentId,

        taskId,
      }).unwrap();

    } catch (error) {
      console.error(
        "Delete comment error:",
        error
      );


      setActionError(
        getErrorMessage(
          error,
          "Unable to delete comment."
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
            Please sign in again.
          </p>

        </div>

      </main>
    );
  }


  if (
    taskLoading ||
    taskFetching
  ) {
    return (
      <main className="flex min-h-full items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-primary" />
      </main>
    );
  }


  if (
    taskIsError ||
    !task
  ) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-4xl">

          <Link
            to="/tasks"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Back to tasks
          </Link>


          <div className="mt-8 rounded-2xl border border-dashed p-12 text-center">

            <XCircle className="mx-auto size-9 text-muted-foreground" />

            <h1 className="mt-4 text-xl font-semibold">
              Task not found
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {getErrorMessage(
                taskError,
                "This task does not exist or you do not have access to it."
              )}
            </p>

          </div>

        </div>

      </main>
    );
  }


  return (
    <main className="min-h-full px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto w-full max-w-6xl">

        {/* Back */}

        <Link
          to={
            task.project_id
              ? `/tasks?project=${task.project_id}`
              : "/tasks"
          }
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to tasks
        </Link>


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
          className="mt-6 rounded-3xl border bg-card p-6 sm:p-8"
        >

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-medium",
                    getStatusClasses(
                      task.status
                    ),
                  ].join(" ")}
                >
                  {getLabel(
                    columns,
                    task.status
                  )}
                </span>


                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-medium",
                    getPriorityClasses(
                      task.priority
                    ),
                  ].join(" ")}
                >
                  {getLabel(
                    priorities,
                    task.priority
                  )}
                </span>


                {access?.role && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium capitalize text-muted-foreground">
                    {access.role}
                  </span>
                )}

              </div>


              <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                {task.title}
              </h1>


              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {task.description ||
                  "No description added for this task."}
              </p>


              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">

                <span className="flex items-center gap-1.5">
                  <FolderKanban className="size-3.5" />

                  {project?.name ||
                    "Project"}
                </span>


                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" />

                  {teamName}
                </span>


                {task.due_date && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />

                    Due{" "}
                    {formatDate(
                      task.due_date
                    )}
                  </span>
                )}

              </div>
            </div>


            <div className="flex shrink-0 gap-2">

              {canEditTask && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    openEdit
                  }
                  disabled={
                    accessLoading
                  }
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
              )}


              {canDeleteTask && (
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
              )}

            </div>

          </div>
        </motion.div>


        {/* Error */}

        {actionError && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">

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


        {/* Main */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_350px]">

          <div className="space-y-6">

            {/* Workflow */}

            <Card>
              <CardContent className="p-6">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Workflow
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                      Task status
                    </h2>
                  </div>

                  <CheckCircle2 className="size-5 text-primary" />

                </div>


                <div className="mt-5">

                  <select
                    value={
                      task.status
                    }
                    onChange={
                      handleStatusChange
                    }
                    disabled={
                      !canChangeStatus ||
                      updateState.isLoading
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


                {!canChangeStatus && (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Only project managers or the assigned member can change this task's status.
                  </p>
                )}

              </CardContent>
            </Card>


            {/* Comments */}

            <Card>
              <CardContent className="p-6">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Discussion
                    </p>

                    <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold">
                      <MessageSquare className="size-5" />
                      Comments
                    </h2>

                  </div>


                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {comments.length}
                  </span>

                </div>


                <form
                  onSubmit={
                    handleAddComment
                  }
                  className="mt-5"
                >

                  <textarea
                    value={
                      commentText
                    }
                    onChange={(
                      event
                    ) =>
                      setCommentText(
                        event.target.value
                      )
                    }
                    placeholder="Write a comment..."
                    disabled={
                      addCommentState.isLoading
                    }
                    className="min-h-24 w-full resize-y rounded-xl border border-input bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />


                  <div className="mt-3 flex justify-end">

                    <Button
                      type="submit"
                      disabled={
                        !commentText.trim() ||
                        addCommentState.isLoading
                      }
                    >
                      {addCommentState.isLoading ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="size-4" />
                          Comment
                        </>
                      )}
                    </Button>

                  </div>

                </form>


                {commentsLoading ? (

                  <div className="mt-6 flex justify-center py-8">
                    <LoaderCircle className="size-6 animate-spin text-primary" />
                  </div>

                ) : commentsIsError ? (

                  <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-sm text-destructive">
                      {getErrorMessage(
                        commentsError,
                        "Unable to load comments."
                      )}
                    </p>
                  </div>

                ) : comments.length ===
                  0 ? (

                  <div className="mt-6 rounded-xl border border-dashed p-8 text-center">

                    <MessageSquare className="mx-auto size-7 text-muted-foreground" />

                    <p className="mt-3 text-sm font-medium">
                      No comments yet
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Start the discussion for this task.
                    </p>

                  </div>

                ) : (

                  <div className="mt-6 space-y-4">

                    {comments.map(
                      (comment) => {

                        const member =
                          membersMap.get(
                            comment.user_id
                          );


                        const authorName =
                          comment.user_id ===
                          userId
                            ? "You"
                            : member
                                ?.profile
                                ?.full_name ||
                              member
                                ?.profile
                                ?.username ||
                              "Team member";


                        const canDelete =
                          comment.user_id ===
                            userId ||
                          canDeleteComments;


                        return (
                          <div
                            key={
                              comment.id
                            }
                            className="rounded-2xl bg-muted/40 p-4"
                          >

                            <div className="flex items-start gap-3">

                              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {getInitials(
                                  authorName
                                )}
                              </div>


                              <div className="min-w-0 flex-1">

                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">

                                  <span className="text-sm font-semibold">
                                    {authorName}
                                  </span>

                                  <span className="text-[11px] text-muted-foreground">
                                    {formatDateTime(
                                      comment.created_at
                                    )}
                                  </span>

                                </div>


                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                  {
                                    comment.content
                                  }
                                </p>

                              </div>


                              {canDelete && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title="Delete comment"
                                  aria-label="Delete comment"
                                  disabled={
                                    deleteCommentState.isLoading
                                  }
                                  className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() =>
                                    handleDeleteComment(
                                      comment.id
                                    )
                                  }
                                >
                                  <Trash2 className="size-3.5" />
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


            {/* Activity */}

            <Card>
              <CardContent className="p-6">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      History
                    </p>

                    <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold">
                      <Activity className="size-5" />
                      Activity
                    </h2>

                  </div>


                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {activity.length}
                  </span>

                </div>


                {activityLoading ? (

                  <div className="mt-6 flex justify-center py-8">
                    <LoaderCircle className="size-6 animate-spin text-primary" />
                  </div>

                ) : activityIsError ? (

                  <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-sm text-destructive">
                      {getErrorMessage(
                        activityError,
                        "Unable to load activity."
                      )}
                    </p>
                  </div>

                ) : activity.length ===
                  0 ? (

                  <div className="mt-6 rounded-xl border border-dashed p-8 text-center">

                    <Activity className="mx-auto size-7 text-muted-foreground" />

                    <p className="mt-3 text-sm font-medium">
                      No activity yet
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Task changes will appear here automatically.
                    </p>

                  </div>

                ) : (

                  <div className="mt-6 space-y-1">

                    {activity.map(
                      (item) => {

                        const member =
                          membersMap.get(
                            item.user_id
                          );


                        const actorName =
                          item.user_id ===
                          userId
                            ? "You"
                            : member
                                ?.profile
                                ?.full_name ||
                              member
                                ?.profile
                                ?.username ||
                              "Team member";


                        return (
                          <div
                            key={
                              item.id
                            }
                            className="flex gap-3 rounded-xl p-3 transition hover:bg-muted/40"
                          >

                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                              {getInitials(
                                actorName
                              )}
                            </div>


                            <div className="min-w-0 flex-1">

                              <p className="text-sm leading-6">

                                <span className="font-semibold">
                                  {actorName}
                                </span>{" "}

                                <span className="text-muted-foreground">
                                  {
                                    getActivityText(
                                      item
                                    )
                                  }
                                </span>

                              </p>


                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {formatDateTime(
                                  item.created_at
                                )}
                              </p>

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                )}

              </CardContent>
            </Card>

          </div>


          {/* Right */}

          <div className="space-y-6">

            {/* Assignee */}

            <Card>
              <CardContent className="p-6">

                <div className="flex items-center gap-3">

                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserRound className="size-5" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Assignee
                    </p>

                    <p className="mt-0.5 font-semibold">
                      {assigneeName}
                    </p>
                  </div>

                </div>


                {membersLoading ? (

                  <div className="mt-5 h-10 animate-pulse rounded-xl bg-muted" />

                ) : assignee ? (

                  <div className="mt-4 flex items-center gap-3">

                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(
                        assignee.profile
                          ?.full_name ||
                        assignee.profile
                          ?.username ||
                        ""
                      )}
                    </div>


                    <div>

                      <p className="text-sm font-medium">
                        {assigneeName}
                      </p>


                      {assignee.profile
                        ?.username && (
                        <p className="text-xs text-muted-foreground">
                          @
                          {
                            assignee
                              .profile
                              .username
                          }
                        </p>
                      )}

                    </div>

                  </div>

                ) : (

                  <p className="mt-4 text-sm text-muted-foreground">
                    This task is currently unassigned.
                  </p>

                )}

              </CardContent>
            </Card>


            {/* Details */}

            <Card>
              <CardContent className="p-6">

                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Details
                </p>


                <div className="mt-5 space-y-4">

                  <div className="flex items-center justify-between gap-4">

                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FolderKanban className="size-4" />
                      Project
                    </span>


                    {project ? (
                      <Link
                        to={`/projects/${project.id}`}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {project.name}
                      </Link>
                    ) : (
                      <span className="text-sm">
                        Project
                      </span>
                    )}

                  </div>


                  <div className="flex items-center justify-between gap-4">

                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="size-4" />
                      Team
                    </span>

                    <span className="truncate text-sm font-medium">
                      {teamName}
                    </span>

                  </div>


                  <div className="flex items-center justify-between gap-4">

                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" />
                      Due date
                    </span>

                    <span className="text-sm font-medium">
                      {formatDate(
                        task.due_date
                      )}
                    </span>

                  </div>


                  <div className="flex items-center justify-between gap-4">

                    <span className="text-sm text-muted-foreground">
                      Created by
                    </span>

                    <span className="truncate text-sm font-medium">
                      {creatorName}
                    </span>

                  </div>


                  {access?.role && (
                    <div className="flex items-center justify-between gap-4">

                      <span className="text-sm text-muted-foreground">
                        Project role
                      </span>

                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium capitalize text-primary">
                        {access.role}
                      </span>

                    </div>
                  )}

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
              Edit task
            </DialogTitle>

            <DialogDescription>
              {isAssignedMember &&
              !isManager
                ? "Members can update the status and due date of their assigned tasks."
                : "Update the full task details."}
            </DialogDescription>

          </DialogHeader>


          <div className="space-y-5">

            <div className="space-y-2">

              <Label htmlFor="details-task-title">
                Title
              </Label>

              <Input
                id="details-task-title"
                name="title"
                value={
                  form.title
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  isAssignedMember &&
                  !isManager
                }
              />

            </div>


            <div className="space-y-2">

              <Label htmlFor="details-task-description">
                Description
              </Label>

              <textarea
                id="details-task-description"
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  isAssignedMember &&
                  !isManager
                }
                className="min-h-28 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
              />

            </div>


            <div className="grid gap-4 sm:grid-cols-2">

              <div className="space-y-2">

                <Label htmlFor="details-task-status">
                  Status
                </Label>

                <select
                  id="details-task-status"
                  name="status"
                  value={
                    form.status
                  }
                  onChange={
                    handleFormChange
                  }
                  disabled={
                    !canChangeStatus
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
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

                <Label htmlFor="details-task-priority">
                  Priority
                </Label>

                <select
                  id="details-task-priority"
                  name="priority"
                  value={
                    form.priority
                  }
                  onChange={
                    handleFormChange
                  }
                  disabled={
                    isAssignedMember &&
                    !isManager
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
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

              <Label htmlFor="details-task-assignee">
                Assignee
              </Label>

              <select
                id="details-task-assignee"
                name="assigneeId"
                value={
                  form.assigneeId
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  !isManager
                }
                className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  Unassigned
                </option>

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

              <Label htmlFor="details-task-due-date">
                Due date
              </Label>

              <Input
                id="details-task-due-date"
                name="dueDate"
                type="date"
                value={
                  form.dueDate
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  !canChangeStatus
                }
              />

            </div>


            {isAssignedMember &&
              !isManager && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs leading-5 text-muted-foreground">
                    You can update the status and due date because this task is assigned to you. Project managers control the remaining fields.
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

          </div>


          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setEditOpen(
                  false
                )
              }
              disabled={
                updateState.isLoading
              }
            >
              Cancel
            </Button>


            <Button
              type="button"
              onClick={
                handleSave
              }
              disabled={
                updateState.isLoading ||
                !canEditTask
              }
            >
              {updateState.isLoading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="size-4" />
                  Save changes
                </>
              )}
            </Button>

          </DialogFooter>

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
              Delete task?
            </DialogTitle>

            <DialogDescription>
              This will permanently delete{" "}
              <strong>
                {task.title}
              </strong>
              .
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
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

    </main>
  );
}

