import {
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Download,
  FolderKanban,
  ListTodo,
  Users,
} from "lucide-react";

import {
  useGetReportsDataQuery,
} from "@/store/api/apiSlice";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ==========================================================
// Constants
// ==========================================================

const ALL = "all";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const COMPLETED_STATUSES = new Set([
  "done",
  "complete",
  "completed",
]);

const CANCELLED_STATUSES = new Set([
  "cancelled",
  "canceled",
]);

const IN_PROGRESS_STATUSES = new Set([
  "inprogress",
  "doing",
  "active",
]);

const REVIEW_STATUSES = new Set([
  "review",
  "inreview",
  "awaitingreview",
]);

// ==========================================================
// Helpers
// ==========================================================

function normalizeStatus(status) {
  return String(status || "unknown")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function formatStatus(status) {
  return String(status || "Unknown")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function isCompleted(task) {
  return COMPLETED_STATUSES.has(
    normalizeStatus(task.status)
  );
}

function isClosed(task) {
  const status = normalizeStatus(
    task.status
  );

  return (
    COMPLETED_STATUSES.has(status) ||
    CANCELLED_STATUSES.has(status)
  );
}

function isInProgress(task) {
  return IN_PROGRESS_STATUSES.has(
    normalizeStatus(task.status)
  );
}

function isReview(task) {
  return REVIEW_STATUSES.has(
    normalizeStatus(task.status)
  );
}

function isOverdue(task) {
  if (!task.due_date || isClosed(task)) {
    return false;
  }

  // A date-only value is interpreted as
  // a local calendar date.
  const dueDate =
    /^\d{4}-\d{2}-\d{2}$/.test(
      task.due_date
    )
      ? new Date(
          `${task.due_date}T00:00:00`
        )
      : new Date(task.due_date);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return dueDate < todayStart;
}

function formatDate(dateString) {
  if (!dateString) {
    return "—";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
}

function formatPercentage(value) {
  return `${Math.round(value)}%`;
}

function getProjectTeamName(project) {
  return (
    project.team?.name ||
    project.teams?.name ||
    "Team"
  );
}

function getProjectProgress(project, tasks) {
  const projectTasks = tasks.filter(
    (task) => task.project_id === project.id
  );

  const completedCount =
    projectTasks.filter(isCompleted).length;

  const total = projectTasks.length;

  return {
    id: project.id,
    name: project.name || "Untitled project",
    teamName: getProjectTeamName(project),
    status: project.status || "unknown",
    total,
    completed: completedCount,
    overdue: projectTasks.filter(isOverdue).length,
    progress:
      total > 0
        ? (completedCount / total) * 100
        : 0,
  };
}

function createMonthlyTaskData(tasks) {
  const now = new Date();

  const months = Array.from(
    { length: 6 },
    (_, index) =>
      new Date(
        now.getFullYear(),
        now.getMonth() - 5 + index,
        1
      )
  );

  const monthMap = new Map(
    months.map((month) => {
      const key = [
        month.getFullYear(),
        String(month.getMonth() + 1).padStart(
          2,
          "0"
        ),
      ].join("-");

      return [
        key,
        {
          key,
          month: month.toLocaleDateString(
            undefined,
            { month: "short" }
          ),
          tasks: 0,
          completed: 0,
        },
      ];
    })
  );

  tasks.forEach((task) => {
    if (!task.created_at) {
      return;
    }

    const createdAt = new Date(
      task.created_at
    );

    if (Number.isNaN(createdAt.getTime())) {
      return;
    }

    const key = [
      createdAt.getFullYear(),
      String(createdAt.getMonth() + 1).padStart(
        2,
        "0"
      ),
    ].join("-");

    const monthData = monthMap.get(key);

    if (!monthData) {
      return;
    }

    monthData.tasks += 1;

    if (isCompleted(task)) {
      monthData.completed += 1;
    }
  });

  return Array.from(monthMap.values());
}

function getTaskStatusData(tasks) {
  const counts = new Map();

  tasks.forEach((task) => {
    const label = formatStatus(task.status);

    counts.set(
      label,
      (counts.get(label) || 0) + 1
    );
  });

  return Array.from(
    counts,
    ([name, value]) => ({
      name,
      value,
    })
  ).sort(
    (a, b) => b.value - a.value
  );
}

// ==========================================================
// Small components
// ==========================================================

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}) {
  return (
    <Card className="reports-card h-full">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {title}
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {value}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartEmpty({ message }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}

// ==========================================================
// Page
// ==========================================================

export default function Reports() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetReportsDataQuery();

  const [selectedTeamId, setSelectedTeamId] =
    useState(ALL);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState(ALL);

  const projects = data?.projects || [];
  const tasks = data?.tasks || [];
  const members = data?.members || [];

  // ========================================================
  // Available teams
  // ========================================================

  const teams = useMemo(() => {
    const uniqueTeams = new Map();

    projects.forEach((project) => {
      if (!project.team_id) {
        return;
      }

      uniqueTeams.set(
        project.team_id,
        getProjectTeamName(project)
      );
    });

    return Array.from(
      uniqueTeams,
      ([id, name]) => ({
        id,
        name,
      })
    ).sort(
      (a, b) => a.name.localeCompare(b.name)
    );
  }, [projects]);

  // ========================================================
  // Filter projects
  // ========================================================

  const teamProjects = useMemo(() => {
    if (selectedTeamId === ALL) {
      return projects;
    }

    return projects.filter(
      (project) =>
        project.team_id === selectedTeamId
    );
  }, [projects, selectedTeamId]);

  const visibleProjects = useMemo(() => {
    if (selectedProjectId === ALL) {
      return teamProjects;
    }

    return teamProjects.filter(
      (project) =>
        project.id === selectedProjectId
    );
  }, [teamProjects, selectedProjectId]);

  // ========================================================
  // Filter tasks by visible projects
  // ========================================================

  const visibleTasks = useMemo(() => {
    const projectIds = new Set(
      visibleProjects.map(
        (project) => project.id
      )
    );

    return tasks.filter(
      (task) =>
        projectIds.has(task.project_id)
    );
  }, [tasks, visibleProjects]);

  // ========================================================
  // Members visible in selected teams
  // ========================================================

  const visibleMembersCount = useMemo(() => {
    const teamIds = new Set(
      visibleProjects
        .map((project) => project.team_id)
        .filter(Boolean)
    );

    return new Set(
      members
        .filter((member) =>
          teamIds.has(member.team_id)
        )
        .map((member) => member.user_id)
        .filter(Boolean)
    ).size;
  }, [members, visibleProjects]);

  // ========================================================
  // Metrics
  // ========================================================

  const metrics = useMemo(() => {
    const completed = visibleTasks.filter(
      isCompleted
    ).length;

    const inProgress = visibleTasks.filter(
      isInProgress
    ).length;

    const review = visibleTasks.filter(
      isReview
    ).length;

    const overdue = visibleTasks.filter(
      isOverdue
    ).length;

    const total = visibleTasks.length;

    return {
      totalTasks: total,
      completed,
      inProgress,
      review,
      overdue,
      completionRate:
        total > 0
          ? (completed / total) * 100
          : 0,
      projectCount: visibleProjects.length,
      teamCount: new Set(
        visibleProjects
          .map((project) => project.team_id)
          .filter(Boolean)
      ).size,
    };
  }, [visibleProjects, visibleTasks]);

  // ========================================================
  // Chart data
  // ========================================================

  const taskStatusData = useMemo(
    () => getTaskStatusData(visibleTasks),
    [visibleTasks]
  );

  const projectProgressData = useMemo(
    () =>
      visibleProjects
        .map((project) =>
          getProjectProgress(
            project,
            visibleTasks
          )
        )
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
        .map((project) => ({
          ...project,
          chartName:
            project.name.length > 18
              ? `${project.name.slice(0, 18)}…`
              : project.name,
        })),
    [visibleProjects, visibleTasks]
  );

  const monthlyTaskData = useMemo(
    () => createMonthlyTaskData(visibleTasks),
    [visibleTasks]
  );

  const projectNameById = useMemo(
    () =>
      new Map(
        projects.map((project) => [
          project.id,
          project.name,
        ])
      ),
    [projects]
  );

  const recentTasks = useMemo(
    () =>
      [...visibleTasks]
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        )
        .slice(0, 8),
    [visibleTasks]
  );

  // ========================================================
  // Events
  // ========================================================

  function handleTeamChange(event) {
    setSelectedTeamId(event.target.value);
    setSelectedProjectId(ALL);
  }

  function handleExportPdf() {
    window.print();
  }

  // ========================================================
  // Loading
  // ========================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />

          <p className="text-sm text-muted-foreground">
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================
  // Error
  // ========================================================

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 size-5 shrink-0 text-destructive" />

              <div className="flex-1">
                <h1 className="text-lg font-semibold">
                  Unable to load reports
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Report data could not be loaded. Check your
                  connection and access permissions, then retry.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  className="reports-no-print mt-4"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================================
  // Render
  // ========================================================

  return (
    <main className="reports-container mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <style>
        {`
          @media print {
            .reports-no-print {
              display: none !important;
            }

            .reports-container {
              max-width: none !important;
              padding: 0 !important;
            }

            .reports-card {
              box-shadow: none !important;
              break-inside: avoid;
            }

            body {
              background: #ffffff !important;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>

      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="size-4" />
            WorkFlow Analytics
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Reports
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review task progress, overdue work, project activity,
            and team capacity using your available workspace data.
          </p>
        </div>

        <div className="reports-no-print flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>

          <Button
            type="button"
            onClick={handleExportPdf}
          >
            <Download className="mr-2 size-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}

      <Card className="reports-card mt-6">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="reports-no-print space-y-2">
            <label
              htmlFor="report-team"
              className="text-sm font-medium"
            >
              Team
            </label>

            <select
              id="report-team"
              value={selectedTeamId}
              onChange={handleTeamChange}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value={ALL}>
                All accessible teams
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="reports-no-print space-y-2">
            <label
              htmlFor="report-project"
              className="text-sm font-medium"
            >
              Project
            </label>

            <select
              id="report-project"
              value={selectedProjectId}
              onChange={(event) =>
                setSelectedProjectId(
                  event.target.value
                )
              }
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value={ALL}>
                All projects
              </option>

              {teamProjects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden print:block sm:col-span-2">
            <p className="text-sm">
              Team:{" "}
              {selectedTeamId === ALL
                ? "All accessible teams"
                : teams.find(
                    (team) =>
                      team.id === selectedTeamId
                  )?.name || "Selected team"}
            </p>

            <p className="text-sm">
              Project:{" "}
              {selectedProjectId === ALL
                ? "All projects"
                : visibleProjects[0]?.name || "Selected project"}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Generated on {new Date().toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Empty projects */}

      {visibleProjects.length === 0 ? (
        <Card className="reports-card mt-6">
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <FolderKanban className="mb-3 size-10 text-muted-foreground" />

            <h2 className="text-lg font-semibold">
              No projects available
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              No projects are available for the selected filters
              or your account does not have access to project data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Tasks"
              value={metrics.totalTasks}
              description="Tasks in the selected scope"
              icon={ListTodo}
            />

            <StatCard
              title="Completed"
              value={metrics.completed}
              description={`${formatPercentage(
                metrics.completionRate
              )} completion rate`}
              icon={CheckCircle2}
            />

            <StatCard
              title="Overdue Tasks"
              value={metrics.overdue}
              description="Open tasks past their due date"
              icon={AlertTriangle}
            />

            <StatCard
              title="Team Members"
              value={visibleMembersCount}
              description={`${metrics.teamCount} team(s) in scope`}
              icon={Users}
            />
          </section>

          {/* Status summary */}

          <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="In Progress"
              value={metrics.inProgress}
              description="Tasks currently in progress"
              icon={Activity}
            />

            <StatCard
              title="In Review"
              value={metrics.review}
              description="Tasks awaiting review"
              icon={CheckCircle2}
            />

            <StatCard
              title="Projects"
              value={metrics.projectCount}
              description="Projects in the selected scope"
              icon={FolderKanban}
            />

            <StatCard
              title="Completion Rate"
              value={formatPercentage(
                metrics.completionRate
              )}
              description="Completed ÷ total tasks"
              icon={BarChart3}
            />
          </section>

          {/* Charts */}

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card className="reports-card">
              <CardHeader>
                <CardTitle>
                  Tasks by Status
                </CardTitle>

                <CardDescription>
                  Distribution of the task statuses currently stored.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {taskStatusData.length === 0 ? (
                  <ChartEmpty message="No tasks to display." />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={taskStatusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={88}
                          label={({ name, value }) =>
                            `${name}: ${value}`
                          }
                        >
                          {taskStatusData.map(
                            (entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={
                                  CHART_COLORS[
                                    index %
                                      CHART_COLORS.length
                                  ]
                                }
                              />
                            )
                          )}
                        </Pie>

                        <Tooltip />

                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="reports-card">
              <CardHeader>
                <CardTitle>
                  Project Completion
                </CardTitle>

                <CardDescription>
                  Completed-task percentage for projects in scope.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {projectProgressData.length === 0 ? (
                  <ChartEmpty message="No project data to display." />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={projectProgressData}
                        margin={{
                          top: 12,
                          right: 8,
                          bottom: 36,
                          left: 0,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="chartName"
                          angle={-25}
                          textAnchor="end"
                          interval={0}
                          height={64}
                          tick={{ fontSize: 11 }}
                        />

                        <YAxis
                          domain={[0, 100]}
                          unit="%"
                          tick={{ fontSize: 12 }}
                        />

                        <Tooltip
                          formatter={(value) => [
                            `${Math.round(Number(value))}%`,
                            "Completion",
                          ]}
                          labelFormatter={(
                            label,
                            payload
                          ) =>
                            payload?.[0]?.payload
                              ?.name || label
                          }
                        />

                        <Bar
                          dataKey="progress"
                          name="Completion"
                          fill="hsl(var(--chart-1))"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="reports-card xl:col-span-2">
              <CardHeader>
                <CardTitle>
                  Task Activity Over Time
                </CardTitle>

                <CardDescription>
                  Tasks created and completed during the last six calendar months.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {visibleTasks.length === 0 ? (
                  <ChartEmpty message="No task activity to display." />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart
                        data={monthlyTaskData}
                        margin={{
                          top: 12,
                          right: 16,
                          bottom: 4,
                          left: 0,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12 }}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 12 }}
                        />

                        <Tooltip />

                        <Legend />

                        <Line
                          type="monotone"
                          dataKey="tasks"
                          name="Created"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          dot={false}
                        />

                        <Line
                          type="monotone"
                          dataKey="completed"
                          name="Completed"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Project report table */}

          <section className="mt-6">
            <Card className="reports-card">
              <CardHeader>
                <CardTitle>
                  Project Summary
                </CardTitle>

                <CardDescription>
                  Task totals, overdue items, and completion rates.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="px-3 py-3 font-medium">
                          Project
                        </th>

                        <th className="px-3 py-3 font-medium">
                          Team
                        </th>

                        <th className="px-3 py-3 font-medium">
                          Status
                        </th>

                        <th className="px-3 py-3 text-right font-medium">
                          Tasks
                        </th>

                        <th className="px-3 py-3 text-right font-medium">
                          Completed
                        </th>

                        <th className="px-3 py-3 text-right font-medium">
                          Overdue
                        </th>

                        <th className="px-3 py-3 text-right font-medium">
                          Progress
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {projectProgressData.map(
                        (project) => (
                          <tr
                            key={project.id}
                            className="border-b last:border-0"
                          >
                            <td className="px-3 py-3 font-medium">
                              {project.name}
                            </td>

                            <td className="px-3 py-3 text-muted-foreground">
                              {project.teamName}
                            </td>

                            <td className="px-3 py-3">
                              {formatStatus(
                                project.status
                              )}
                            </td>

                            <td className="px-3 py-3 text-right tabular-nums">
                              {project.total}
                            </td>

                            <td className="px-3 py-3 text-right tabular-nums">
                              {project.completed}
                            </td>

                            <td className="px-3 py-3 text-right tabular-nums">
                              {project.overdue}
                            </td>

                            <td className="px-3 py-3 text-right font-medium tabular-nums">
                              {formatPercentage(
                                project.progress
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Recent Tasks */}

          <section className="mt-6">
            <Card className="reports-card">
              <CardHeader>
                <CardTitle>
                  Recent Tasks
                </CardTitle>

                <CardDescription>
                  Latest tasks in the selected report scope.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {recentTasks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No tasks available.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="px-3 py-3 font-medium">
                            Task
                          </th>

                          <th className="px-3 py-3 font-medium">
                            Project
                          </th>

                          <th className="px-3 py-3 font-medium">
                            Status
                          </th>

                          <th className="px-3 py-3 font-medium">
                            Priority
                          </th>

                          <th className="px-3 py-3 font-medium">
                            Due Date
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {recentTasks.map(
                          (task) => (
                            <tr
                              key={task.id}
                              className="border-b last:border-0"
                            >
                              <td className="px-3 py-3 font-medium">
                                {task.title || "Untitled task"}
                              </td>

                              <td className="px-3 py-3 text-muted-foreground">
                                {projectNameById.get(
                                  task.project_id
                                ) || "—"}
                              </td>

                              <td className="px-3 py-3">
                                {formatStatus(
                                  task.status
                                )}
                              </td>

                              <td className="px-3 py-3">
                                {formatStatus(
                                  task.priority
                                )}
                              </td>

                              <td
                                className={[
                                  "px-3 py-3",
                                  isOverdue(task)
                                    ? "font-semibold text-destructive"
                                    : "text-muted-foreground",
                                ].join(" ")}
                              >
                                {formatDate(
                                  task.due_date
                                )}
                                {isOverdue(task)
                                  ? " · Overdue"
                                  : ""}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}