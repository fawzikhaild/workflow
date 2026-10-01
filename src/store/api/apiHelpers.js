

import { supabase } from "@/lib/supabaseClient";

export async function getAuthenticatedUser(
  expectedUserId = null
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return {
      user: null,
      error: {
        status: "AUTH_ERROR",
        message: error.message,
      },
    };
  }

  if (!user) {
    return {
      user: null,
      error: {
        status: "UNAUTHORIZED",
        message:
          "You are not authenticated.",
      },
    };
  }

  if (
    expectedUserId &&
    user.id !== expectedUserId
  ) {
    return {
      user: null,
      error: {
        status: "USER_MISMATCH",
        message:
          "Authenticated user mismatch.",
      },
    };
  }

  return {
    user,
    error: null,
  };
}

export function apiError(
  error,
  fallback
) {
  return {
    error: {
      status:
        error?.code || fallback,
      message:
        error?.message ||
        fallback,
    },
  };
}

