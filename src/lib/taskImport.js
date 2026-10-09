

export const TASK_IMPORT_MAX_FILE_SIZE =
  10 * 1024 * 1024;

export const TASK_IMPORT_MAX_ROWS = 500;

export const TASK_IMPORT_FIELDS = [
  {
    key: "title",
    label: "Task title",
    required: true,
  },
  {
    key: "description",
    label: "Description",
    required: false,
  },
  {
    key: "status",
    label: "Status",
    required: false,
  },
  {
    key: "priority",
    label: "Priority",
    required: false,
  },
  {
    key: "due_date",
    label: "Due date",
    required: false,
  },
  {
    key: "assignee_id",
    label: "Assignee user ID",
    required: false,
  },
];

const HEADER_ALIASES = {
  title: [
    "title",
    "task",
    "task title",
    "task name",
    "name",
    "عنوان",
    "عنوان المهمة",
    "المهمة",
  ],

  description: [
    "description",
    "details",
    "notes",
    "task description",
    "الوصف",
    "وصف",
    "تفاصيل",
  ],

  status: [
    "status",
    "state",
    "حالة",
    "الحالة",
  ],

  priority: [
    "priority",
    "importance",
    "الأولوية",
    "اولوية",
  ],

  due_date: [
    "due date",
    "due_date",
    "deadline",
    "due",
    "تاريخ الاستحقاق",
    "الموعد النهائي",
  ],

  assignee_id: [
    "assignee_id",
    "assignee id",
    "assignee uuid",
    "assignee user id",
    "user id",
    "معرف المسؤول",
    "معرف المستخدم",
  ],
};

const STATUS_ALIASES = {
  todo: "todo",
  backlog: "todo",
  todo_list: "todo",

  inprogress: "in_progress",
  doing: "in_progress",
  active: "in_progress",

  review: "review",
  inreview: "review",
  awaitingreview: "review",

  done: "done",
  complete: "done",
  completed: "done",
};

const PRIORITY_ALIASES = {
  low: "low",
  normal: "medium",
  medium: "medium",
  moderate: "medium",
  high: "high",
  urgent: "urgent",
  critical: "urgent",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ============================================================
// General Helpers
// ============================================================

function normalizeHeader(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function isBlankRow(values) {
  return !values.some(
    (value) =>
      String(value ?? "").trim() !== ""
  );
}

function normalizeStatus(value) {
  const key = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return STATUS_ALIASES[
    key.replace(/_/g, "")
  ] || null;
}

function normalizePriority(value) {
  const key = String(value ?? "")
    .trim()
    .toLowerCase();

  return PRIORITY_ALIASES[key] || null;
}

function validDateParts(year, month, day) {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function dateToIso(year, month, day) {
  if (!validDateParts(year, month, day)) {
    return null;
  }

  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

// ============================================================
// Date Parsing
// ============================================================

function normalizeDueDate(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return {
      value: null,
      error: null,
    };
  }

  // Excel date cells.
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return {
        value: null,
        error: "Invalid date.",
      };
    }

    return {
      value: dateToIso(
        value.getFullYear(),
        value.getMonth() + 1,
        value.getDate()
      ),
      error: null,
    };
  }

  // Excel serial date values.
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    if (value <= 0 || value > 2958465) {
      return {
        value: null,
        error: "Invalid Excel date.",
      };
    }

    const excelDate = new Date(
      Date.UTC(1899, 11, 30) +
        Math.floor(value) * 86400000
    );

    return {
      value: dateToIso(
        excelDate.getUTCFullYear(),
        excelDate.getUTCMonth() + 1,
        excelDate.getUTCDate()
      ),
      error: null,
    };
  }

  const text = String(value).trim();

  // Prefer unambiguous ISO dates.
  const isoMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/
  );

  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    const normalized = dateToIso(
      Number(year),
      Number(month),
      Number(day)
    );

    return {
      value: normalized,
      error: normalized
        ? null
        : "Invalid calendar date.",
    };
  }

  // Support dates such as 31/12/2026 or
  // 12/31/2026 only when the order is clear.
  const slashMatch = text.match(
    /^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/
  );

  if (slashMatch) {
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);

    let day;
    let month;

    if (first > 12 && second <= 12) {
      day = first;
      month = second;
    } else if (second > 12 && first <= 12) {
      month = first;
      day = second;
    } else {
      return {
        value: null,
        error:
          "Ambiguous date. Use YYYY-MM-DD.",
      };
    }

    const normalized = dateToIso(
      year,
      month,
      day
    );

    return {
      value: normalized,
      error: normalized
        ? null
        : "Invalid calendar date.",
    };
  }

  return {
    value: null,
    error: "Use a valid date in YYYY-MM-DD format.",
  };
}

// ============================================================
// Read File
// ============================================================

export async function parseTaskImportFile(file) {
  if (!file) {
    throw new Error("Choose a file first.");
  }

  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() || "";

  if (
    !["xlsx", "xls", "csv"].includes(
      extension
    )
  ) {
    throw new Error(
      "Only .xlsx, .xls, and .csv files are supported."
    );
  }

  if (file.size === 0) {
    throw new Error("The selected file is empty.");
  }

  if (
    file.size > TASK_IMPORT_MAX_FILE_SIZE
  ) {
    throw new Error(
      "File size must not exceed 10 MB."
    );
  }

  // Dynamic import keeps the spreadsheet parser
  // out of the initial application bundle.
  const importedModule = await import("xlsx");

  const XLSX =
    importedModule.default?.read
      ? importedModule.default
      : importedModule;

  const workbook = XLSX.read(
    await file.arrayBuffer(),
    {
      type: "array",
      cellDates: true,
    }
  );

  const firstSheetName =
    workbook.SheetNames?.[0];

  if (!firstSheetName) {
    throw new Error(
      "The file does not contain a worksheet."
    );
  }

  const worksheet =
    workbook.Sheets[firstSheetName];

  if (!worksheet?.["!ref"]) {
    throw new Error(
      "The selected worksheet is empty."
    );
  }

  const range = XLSX.utils.decode_range(
    worksheet["!ref"]
  );

  const rowSpan =
    range.e.r - range.s.r + 1;

  const columnSpan =
    range.e.c - range.s.c + 1;

  // Protect the browser from unexpectedly
  // large worksheet dimensions.
  if (rowSpan > 5000) {
    throw new Error(
      "The worksheet contains too many rows to scan safely."
    );
  }

  if (columnSpan > 100) {
    throw new Error(
      "The worksheet contains too many columns."
    );
  }

  const sheetRows =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        header: 1,
        raw: true,
        defval: "",
        blankrows: true,
      }
    );

  const headerIndex =
    sheetRows.findIndex(
      (row) =>
        Array.isArray(row) &&
        !isBlankRow(row)
    );

  if (headerIndex === -1) {
    throw new Error(
      "No column headers were found in the first worksheet."
    );
  }

  const headerValues =
    sheetRows[headerIndex];

  const headers =
    headerValues.map(
      (value, index) =>
        String(value ?? "").trim() ||
        `Column ${index + 1}`
    );

  if (headers.length === 0) {
    throw new Error(
      "The worksheet has no columns."
    );
  }

  const rows =
    sheetRows
      .slice(headerIndex + 1)
      .map((values, index) => ({
        rowNumber:
          headerIndex + index + 2,

        values: Array.isArray(values)
          ? values
          : [],
      }))
      .filter(
        (row) =>
          !isBlankRow(row.values)
      );

  if (rows.length === 0) {
    throw new Error(
      "No task rows were found below the header row."
    );
  }

  if (rows.length > TASK_IMPORT_MAX_ROWS) {
    throw new Error(
      `The file contains ${rows.length} task rows. Import up to ${TASK_IMPORT_MAX_ROWS} rows per batch.`
    );
  }

  return {
    headers,
    rows,
    sheetName: firstSheetName,
    totalRows: rows.length,
  };
}

// ============================================================
// Suggested Column Mapping
// ============================================================

export function suggestTaskColumnMapping(
  headers
) {
  const mapping = {};

  TASK_IMPORT_FIELDS.forEach(
    (field) => {
      const aliases =
        HEADER_ALIASES[field.key].map(
          normalizeHeader
        );

      const index =
        headers.findIndex(
          (header) =>
            aliases.includes(
              normalizeHeader(header)
            )
        );

      mapping[field.key] =
        index === -1
          ? ""
          : String(index);
    }
  );

  return mapping;
}

// ============================================================
// Validate Rows
// ============================================================

export function validateTaskImportRows(
  rows,
  mapping
) {
  const mappingErrors = [];

  const titleColumn = mapping.title;

  if (
    titleColumn === "" ||
    titleColumn === undefined
  ) {
    mappingErrors.push(
      "Map a spreadsheet column to Task title."
    );
  }

  const mappedColumns =
    TASK_IMPORT_FIELDS
      .filter(
        (field) =>
          mapping[field.key] !== "" &&
          mapping[field.key] !== undefined
      )
      .map((field) => ({
        key: field.key,
        label: field.label,
        column: String(mapping[field.key]),
      }));

  const columnOwners = new Map();

  mappedColumns.forEach((field) => {
    if (
      columnOwners.has(field.column)
    ) {
      mappingErrors.push(
        `"${field.label}" and "${columnOwners.get(field.column)}" use the same source column.`
      );
    } else {
      columnOwners.set(
        field.column,
        field.label
      );
    }
  });

  if (mappingErrors.length > 0) {
    return {
      validRows: [],
      issues: [],
      mappingErrors,
      totalRows: rows.length,
    };
  }

  const validRows = [];
  const issues = [];

  rows.forEach((row) => {
    const readField = (key) => {
      const column = mapping[key];

      if (
        column === "" ||
        column === undefined
      ) {
        return "";
      }

      return row.values[
        Number(column)
      ] ?? "";
    };

    const rowErrors = [];

    const title = String(
      readField("title") ?? ""
    ).trim();

    const description = String(
      readField("description") ?? ""
    ).trim();

    const rawStatus = String(
      readField("status") ?? ""
    ).trim();

    const rawPriority = String(
      readField("priority") ?? ""
    ).trim();

    const rawAssigneeId = String(
      readField("assignee_id") ?? ""
    ).trim();

    if (!title) {
      rowErrors.push(
        "Task title is required."
      );
    }

    if (title.length > 500) {
      rowErrors.push(
        "Task title must not exceed 500 characters."
      );
    }

    if (description.length > 10000) {
      rowErrors.push(
        "Description must not exceed 10,000 characters."
      );
    }

    let status = "todo";

    if (rawStatus) {
      status = normalizeStatus(rawStatus);

      if (!status) {
        rowErrors.push(
          `Unsupported status "${rawStatus}". Use todo, in_progress, review, or done.`
        );
      }
    }

    let priority = "medium";

    if (rawPriority) {
      priority = normalizePriority(rawPriority);

      if (!priority) {
        rowErrors.push(
          `Unsupported priority "${rawPriority}". Use low, medium, high, or urgent.`
        );
      }
    }

    const dueDateResult =
      normalizeDueDate(
        readField("due_date")
      );

    if (dueDateResult.error) {
      rowErrors.push(
        `Due date: ${dueDateResult.error}`
      );
    }

    let assigneeId = null;

    if (rawAssigneeId) {
      if (!UUID_REGEX.test(rawAssigneeId)) {
        rowErrors.push(
          "Assignee user ID must be a valid UUID. Leave it blank to assign the task later."
        );
      } else {
        assigneeId = rawAssigneeId;
      }
    }

    if (rowErrors.length > 0) {
      issues.push({
        rowNumber: row.rowNumber,
        messages: rowErrors,
      });

      return;
    }

    validRows.push({
      rowNumber: row.rowNumber,

      task: {
        title,
        description,
        status,
        priority,
        due_date: dueDateResult.value,
        assignee_id: assigneeId,
      },
    });
  });

  return {
    validRows,
    issues,
    mappingErrors,
    totalRows: rows.length,
  };
}

// ============================================================
// Preview Helper
// ============================================================

export function getMappedPreviewValue(
  row,
  mapping,
  key
) {
  const column = mapping[key];

  if (
    column === "" ||
    column === undefined
  ) {
    return "";
  }

  const value =
    row.values[Number(column)] ?? "";

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? ""
      : value.toLocaleDateString();
  }

  return String(value).trim();
}
