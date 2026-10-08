
import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  z,
} from "zod";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useDispatch,
} from "react-redux";

import {
  motion,
} from "motion/react";

import {
  LoaderCircle,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabaseClient";

import {
  setSession,
} from "@/features/auth/authSlice";

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
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  showAppToast,
} from "@/components/AppToast";

// ==========================================================
// Validation
// ==========================================================

const loginSchema =
  z.object({
    email: z
      .string()
      .trim()
      .email(
        "Please enter a valid email address."
      ),

    password: z
      .string()
      .min(
        6,
        "Password must contain at least 6 characters."
      ),
  });

// ==========================================================
// Safe authentication error message
// ==========================================================

function getLoginErrorMessage(
  error
) {
  const code =
    error?.code ||
    error?.status;

  switch (code) {
    case "invalid_credentials":
      return "The email or password is incorrect.";

    case "email_not_confirmed":
      return "Please confirm your email before signing in.";

    case "user_not_found":
      return "The email or password is incorrect.";

    case "too_many_requests":
      return "Too many sign-in attempts. Please try again later.";

    case "network_error":
      return "Unable to connect to the authentication service.";

    default:
      return "Unable to sign in. Please check your credentials and try again.";
  }
}

// ==========================================================
// Component
// ==========================================================

export default function Login() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const dispatch =
    useDispatch();

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm({
      resolver:
        zodResolver(
          loginSchema
        ),

      defaultValues: {
        email: "",
        password: "",
      },
    });

  // ========================================================
  // Submit
  // ========================================================

  async function onSubmit(
    values
  ) {
    try {
      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              values.email.trim(),
            password:
              values.password,
          }
        );

      if (error) {
        console.error(
          "Login authentication error:",
          error
        );

        showAppToast({
          type: "error",
          title:
            "Sign in failed",
          message:
            getLoginErrorMessage(
              error
            ),
        });

        return;
      }

      if (!data?.session) {
        showAppToast({
          type: "error",
          title:
            "Sign in failed",
          message:
            "No valid session was created. Please try again.",
        });

        return;
      }

      dispatch(
        setSession(
          data.session
        )
      );

      showAppToast({
        type: "success",
        title:
          "Welcome back",
        message:
          "You have been signed in successfully.",
      });

      const destination =
        location.state?.from
          ?.pathname ||
        "/";

      navigate(
        destination,
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Login Error:",
        error
      );

      showAppToast({
        type: "error",
        title:
          "Sign in failed",
        message:
          "Something went wrong. Please try again.",
      });
    }
  }

  // ========================================================
  // Render
  // ========================================================

  return (
    <main className="min-h-svh bg-background px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100svh-6rem)] max-w-md items-center justify-center">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
          }}
          className="w-full"
        >
          <Card className="border-border/60 shadow-xl">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="size-4" />

                WorkFlow
              </div>

              <div>
                <CardTitle className="text-3xl font-bold">
                  Welcome back
                </CardTitle>

                <CardDescription className="mt-2">
                  Sign in to continue to your workspace.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit(
                  onSubmit
                )}
                noValidate
                className="space-y-5"
              >
                {/* Email */}

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email
                  </Label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className={[
                        "pl-10",
                        errors.email
                          ? "border-destructive focus-visible:ring-destructive"
                          : "",
                      ].join(" ")}
                      autoComplete="email"
                      {...register(
                        "email"
                      )}
                    />
                  </div>

                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {
                        errors
                          .email
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Password */}

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password
                  </Label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className={[
                        "pl-10",
                        errors.password
                          ? "border-destructive focus-visible:ring-destructive"
                          : "",
                      ].join(" ")}
                      autoComplete="current-password"
                      {...register(
                        "password"
                      )}
                    />
                  </div>

                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {
                        errors
                          .password
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Submit */}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isSubmitting
                  }
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />

                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {/* Register */}

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}

                  <Link
                    to="/register"
                    className="font-semibold text-primary hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
