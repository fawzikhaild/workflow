
import {
  Toaster,
  toast,
} from "sonner";

// ============================================================
// Map application toast types to Sonner types
// ============================================================

function getToastMethod(type) {
  switch (type) {
    case "success":
      return toast.success;

    case "error":
      return toast.error;

    case "warning":
      return toast.warning;

    case "info":
      return toast.info;

    // Existing application types
    case "edit":
      return toast.info;

    case "lock":
      return toast.warning;

    default:
      return toast;
  }
}

// ============================================================
// Public Toast API
// ============================================================

export function showAppToast({
  type = "info",
  title = "",
  message = "",
  duration = 4000,
}) {
  const toastMethod =
    getToastMethod(type);

  const safeTitle =
    title || "WorkFlow";

  toastMethod(safeTitle, {
    description: message || undefined,
    duration,
    closeButton: true,
  });
}

// ============================================================
// Global Toast Provider
// ============================================================

export default function AppToast() {
  return (
    <Toaster
      position="top-center"
      expand={false}
      richColors
      closeButton
      duration={4000}
      visibleToasts={4}
      toastOptions={{
        className:
          "rounded-2xl border shadow-lg",
      }}
    />
  );
}

