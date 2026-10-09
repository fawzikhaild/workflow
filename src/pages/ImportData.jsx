
import {
  useMemo,
  useState,
} from "react";

import {
  useSelector,
} from "react-redux";

import {
  AlertTriangle,
  ArrowUpFromLine,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  ShieldCheck,
  Table2,
} from "lucide-react";

import {
  useGetMyProjectsQuery,
  useBulkImportTasksMutation,
} from "@/store/api/apiSlice";

import {
  showAppToast,
} from "@/components/AppToast";

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
  parseTaskImportFile,
  suggestTaskColumnMapping,
  validateTaskImportRows,
  getMappedPreviewValue,
  TASK_IMPORT_FIELDS,
  TASK_IMPORT_MAX_ROWS,
} from "@/lib/taskImport";

// ==========================================================
// Helpers
// ==========================================================

function getSafeImportErrorMessage(error) {
  const status =
    error?.status ||
    error?.data?.status;

  switch (status) {
    case "UNAUTHORIZED":
    case "AUTH_ERROR":
      return "Your session is no longer valid. Please sign in again.";

    case "PROJECT_NOT_FOUND":
    case "PROJECT_ACCESS_ERROR":
      return "You do not have access to the selected project.";

    case "INVALID_ASSIGNEE":
      return "Every assigned user must be a member of the selected project's team.";

    case "VALIDATION_ERROR":
      return (
        error?.data?.message ||
        error?.message ||
        "The import data is invalid."
      );

    case "MEMBER_VALIDATION_FAILED":
      return "Unable to verify team membership. No tasks were imported.";

    default:
      return "Import failed. Check the file, project permissions, and task data before trying again.";
  }
}

function formatCell(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? ""
      : value.toLocaleDateString();
  }

  return String(value).trim();
}

// ==========================================================
// Page
// ==========================================================

export default function ImportData() {
  const userId = useSelector(
    (state) =>
      state.auth.user?.id
  );

  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError: projectsError,
  } = useGetMyProjectsQuery(
    userId,
    {
      skip: !userId,
    }
  );

  const [
    bulkImportTasks,
    {
      isLoading: isImporting,
    },
  ] = useBulkImportTasksMutation();

  const projects = Array.isArray(projectsData)
    ? projectsData
    : projectsData?.data || [];

  const [selectedProjectId, setSelectedProjectId] =
    useState("");

  const [selectedFileName, setSelectedFileName] =
    useState("");

  const [parsedFile, setParsedFile] =
    useState(null);

  const [mapping, setMapping] =
    useState({});

  const [parseError, setParseError] =
    useState("");

  const [isParsing, setIsParsing] =
    useState(false);

  // ========================================================
  // Validate and prepare preview
  // ========================================================

  const validation = useMemo(() => {
    if (!parsedFile) {
      return {
        validRows: [],
        issues: [],
        mappingErrors: [],
        totalRows: 0,
      };
    }

    return validateTaskImportRows(
      parsedFile.rows,
      mapping
    );
  }, [parsedFile, mapping]);

  const previewRows = useMemo(
    () =>
      parsedFile?.rows?.slice(0, 8) || [],
    [parsedFile]
  );

  const canImport =
    Boolean(selectedProjectId) &&
    Boolean(parsedFile) &&
    validation.mappingErrors.length === 0 &&
    validation.validRows.length > 0 &&
    !isParsing &&
    !isImporting &&
    !projectsLoading &&
    !projectsError;

  // ========================================================
  // File selection
  // ========================================================

  async function handleFileSelect(event) {
    const file =
      event.target.files?.[0];

    // Reset the input so the same file can
    // be selected again after correcting it.
    event.target.value = "";

    if (!file) {
      return;
    }

    setSelectedFileName(file.name);
    setParsedFile(null);
    setMapping({});
    setParseError("");
    setIsParsing(true);

    try {
      const parsed =
        await parseTaskImportFile(file);

      const suggestedMapping =
        suggestTaskColumnMapping(
          parsed.headers
        );

      setParsedFile(parsed);
      setMapping(suggestedMapping);

      showAppToast({
        type: "success",
        title: "File ready",
        message:
          `${parsed.totalRows} rows found. Review the columns and validation results before importing.`,
      });
    } catch (error) {
      console.error(
        "Task Import Parsing Error:",
        error
      );

      setParseError(
        error?.message ||
          "Unable to read the selected file."
      );

      showAppToast({
        type: "error",
        title: "File could not be read",
        message:
          error?.message ||
          "Choose a supported Excel or CSV file.",
      });
    } finally {
      setIsParsing(false);
    }
  }

  // ========================================================
  // Column mapping
  // ========================================================

  function handleMappingChange(
    fieldKey,
    columnIndex
  ) {
    setMapping((current) => ({
      ...current,
      [fieldKey]: columnIndex,
    }));
  }

  // ========================================================
  // Clear current import
  // ========================================================

  function resetImport() {
    if (isImporting) {
      return;
    }

    setSelectedFileName("");
    setParsedFile(null);
    setMapping({});
    setParseError("");
  }

  // ========================================================
  // Import
  // ========================================================

  async function handleImport() {
    if (!selectedProjectId) {
      showAppToast({
        type: "warning",
        title: "Project required",
        message:
          "Choose the project where the tasks should be imported.",
      });

      return;
    }

    if (
      validation.mappingErrors.length > 0 ||
      validation.validRows.length === 0
    ) {
      showAppToast({
        type: "warning",
        title: "Fix the import data",
        message:
          "Map the required columns and correct at least one valid task row before importing.",
      });

      return;
    }

    const confirmed = window.confirm(
      [
        `Import ${validation.validRows.length} valid task(s)?`,
        validation.issues.length > 0
          ? `${validation.issues.length} invalid row(s) will be skipped.`
          : "All rows passed validation.",
        "This action will create tasks in the selected project.",
      ].join("\n\n")
    );

    if (!confirmed) {
      return;
    }

    try {
      const result = await bulkImportTasks({
        projectId: selectedProjectId,
        tasks: validation.validRows.map(
          (row) => row.task
        ),
      }).unwrap();

      const skippedCount =
        validation.issues.length;

      showAppToast({
        type: "success",
        title: "Import completed",
        message:
          `${result.importedCount} task(s) imported successfully.` +
          (
            skippedCount > 0
              ? ` ${skippedCount} invalid row(s) were skipped.`
              : ""
          ),
        duration: 6000,
      });

      resetImport();
    } catch (error) {
      console.error(
        "Bulk Task Import Error:",
        error
      );

      showAppToast({
        type: "error",
        title: "Import failed",
        message:
          getSafeImportErrorMessage(error),
        duration: 6000,
      });
    }
  }

  // ========================================================
  // Render
  // ========================================================

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
      {/* Header */}

      <div className="mb-7">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <FileSpreadsheet className="size-4" />

          Data Management
        </div>

        <h1 className="text-3xl font-bold tracking-tight">
          Import Tasks
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Import tasks from Excel or CSV. Review the column
          mapping, inspect validation errors, and confirm the
          import before any tasks are created.
        </p>
      </div>

      {/* Security note */}

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />

        <div>
          <p className="text-sm font-semibold">
            Import is subject to project permissions
          </p>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Only projects visible to your authenticated account
            are offered. The import API verifies the session,
            checks assignees against the selected team, and relies
            on Supabase RLS to authorize database writes.
          </p>
        </div>
      </div>

      {/* Project selection */}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            1. Choose a destination project
          </CardTitle>

          <CardDescription>
            Every imported task will belong to this project.
            Project IDs from the spreadsheet are not used.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {projectsError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Unable to load your projects. Refresh the page
              and try again.
            </div>
          )}

          <label
            htmlFor="import-project"
            className="text-sm font-medium"
          >
            Project
          </label>

          <select
            id="import-project"
            value={selectedProjectId}
            onChange={(event) =>
              setSelectedProjectId(
                event.target.value
              )
            }
            disabled={
              projectsLoading ||
              projectsError ||
              isImporting
            }
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">
              {projectsLoading
                ? "Loading projects..."
                : "Choose a project"}
            </option>

            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.name}
                {project.team?.name
                  ? ` — ${project.team.name}`
                  : project.teams?.name
                    ? ` — ${project.teams.name}`
                    : ""}
              </option>
            ))}
          </select>

          {!projectsLoading &&
            !projectsError &&
            projects.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No accessible projects are available. Create a
                project or request access before importing tasks.
              </p>
            )}
        </CardContent>
      </Card>

      {/* File selection */}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            2. Upload your spreadsheet
          </CardTitle>

          <CardDescription>
            Supported formats: XLSX, XLS, and CSV. Maximum
            file size: 10 MB. Maximum rows per batch:{" "}
            {TASK_IMPORT_MAX_ROWS}.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <label
            htmlFor="import-file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center transition hover:bg-muted/40"
          >
            {isParsing ? (
              <LoaderCircle className="mb-3 size-8 animate-spin text-primary" />
            ) : (
              <ArrowUpFromLine className="mb-3 size-8 text-muted-foreground" />
            )}

            <span className="font-medium">
              {isParsing
                ? "Reading spreadsheet..."
                : selectedFileName ||
                  "Choose an Excel or CSV file"}
            </span>

            <span className="mt-2 text-xs text-muted-foreground">
              {isParsing
                ? "Please wait while the file is parsed locally."
                : "The file is read in your browser and is not uploaded to file storage."}
            </span>

            <input
              id="import-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={handleFileSelect}
              disabled={isParsing || isImporting}
            />
          </label>

          {parseError && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {parseError}
            </div>
          )}

          {parsedFile && (
            <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-primary" />

                <div>
                  <p className="text-sm font-medium">
                    {selectedFileName}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Worksheet: {parsedFile.sheetName} ·{" "}
                    {parsedFile.totalRows} non-empty data row(s)
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={resetImport}
                disabled={isImporting}
              >
                Clear file
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {parsedFile && (
        <>
          {/* Mapping */}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                3. Map the columns
              </CardTitle>

              <CardDescription>
                WorkFlow suggests mappings based on header names.
                Review them before importing. Task title is required.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {TASK_IMPORT_FIELDS.map(
                  (field) => (
                    <div
                      key={field.key}
                      className="space-y-2"
                    >
                      <label
                        htmlFor={`mapping-${field.key}`}
                        className="text-sm font-medium"
                      >
                        {field.label}
                        {field.required
                          ? " *"
                          : ""}
                      </label>

                      <select
                        id={`mapping-${field.key}`}
                        value={
                          mapping[field.key] ?? ""
                        }
                        onChange={(event) =>
                          handleMappingChange(
                            field.key,
                            event.target.value
                          )
                        }
                        disabled={isImporting}
                        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">
                          Not mapped
                        </option>

                        {parsedFile.headers.map(
                          (header, index) => (
                            <option
                              key={`${index}-${header}`}
                              value={String(index)}
                            >
                              {header}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  )
                )}
              </div>

              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Status defaults to Todo and priority defaults to
                Medium when their columns are not mapped. An
                assignee column must contain a user UUID belonging
                to the selected project's team.
              </p>

              {validation.mappingErrors.length > 0 && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                >
                  <p className="text-sm font-semibold text-destructive">
                    Fix the column mapping
                  </p>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
                    {validation.mappingErrors.map(
                      (message, index) => (
                        <li key={`${index}-${message}`}>
                          {message}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation summary */}

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Rows detected
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {validation.totalRows}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Valid rows
                </p>

                <p className="mt-2 text-2xl font-semibold text-emerald-600">
                  {validation.validRows.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Invalid rows
                </p>

                <p className="mt-2 text-2xl font-semibold text-destructive">
                  {validation.issues.length}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Preview */}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="size-5" />

                4. Preview
              </CardTitle>

              <CardDescription>
                Showing up to 8 rows after mapping. Values are
                previewed only; nothing is imported yet.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="px-3 py-3 font-medium">
                        Row
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Title
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Status
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Priority
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Due date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {previewRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className="border-b last:border-0"
                      >
                        <td className="px-3 py-3 tabular-nums text-muted-foreground">
                          {row.rowNumber}
                        </td>

                        <td className="max-w-72 truncate px-3 py-3 font-medium">
                          {getMappedPreviewValue(
                            row,
                            mapping,
                            "title"
                          ) || "—"}
                        </td>

                        <td className="px-3 py-3">
                          {getMappedPreviewValue(
                            row,
                            mapping,
                            "status"
                          ) || "todo (default)"}
                        </td>

                        <td className="px-3 py-3">
                          {getMappedPreviewValue(
                            row,
                            mapping,
                            "priority"
                          ) || "medium (default)"}
                        </td>

                        <td className="px-3 py-3">
                          {formatCell(
                            mapping.due_date === "" ||
                              mapping.due_date === undefined
                              ? ""
                              : row.values[
                                  Number(mapping.due_date)
                                ]
                          ) || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Row errors */}

          {validation.issues.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-destructive" />

                  Row validation errors
                </CardTitle>

                <CardDescription>
                  Invalid rows will be skipped. Correct them in
                  the source spreadsheet and re-upload if you
                  want to import them.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="max-h-80 space-y-3 overflow-y-auto">
                  {validation.issues
                    .slice(0, 20)
                    .map((issue) => (
                      <div
                        key={issue.rowNumber}
                        className="rounded-xl border border-destructive/20 bg-destructive/[0.03] p-3"
                      >
                        <p className="text-sm font-semibold">
                          Spreadsheet row {issue.rowNumber}
                        </p>

                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {issue.messages.map(
                            (message, index) => (
                              <li key={`${index}-${message}`}>
                                {message}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    ))}
                </div>

                {validation.issues.length > 20 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Showing the first 20 of{" "}
                    {validation.issues.length} invalid rows.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Confirmation */}

          <Card className="mb-8">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  Ready to import?
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {validation.validRows.length} valid task(s) will
                  be created in the selected project
                  {validation.issues.length > 0
                    ? `. ${validation.issues.length} invalid row(s) will be skipped.`
                    : "."}
                </p>
              </div>

              <Button
                type="button"
                onClick={handleImport}
                disabled={!canImport}
                className="shrink-0"
              >
                {isImporting ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />

                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 size-4" />

                    Import{" "}
                    {validation.validRows.length}{" "}
                    Valid Tasks
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}

