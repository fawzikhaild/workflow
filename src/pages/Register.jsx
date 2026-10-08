
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
  UserRound,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabaseClient";

import {
  setSession,
} from "@/features/auth/authSlice";

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
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

// ==========================================================
// Validation
// ==========================================================

const registerSchema =
  z
    .object({
      username: z
        .string()
        .trim()
        .min(
          3,
          "Username must contain at least 3 characters."
        )
        .max(
          30,
          "Username must contain at most 30 characters."
        ),

      fullName: z
        .string()
        .trim()
        .min(
          2,
          "Please enter your full name."
        ),

      email: z
        .string()
        .trim()
        .email(
          "Please enter a valid email address."
        ),

      password: z
        .string()
        .min(
          8,
          "Password must contain at least 8 characters."
        ),

      confirmPassword:
        z.string(),
    })
    .refine(
      (values) =>
        values.password ===
        values.confirmPassword,
      {
        message:
          "Passwords do not match.",
        path: [
          "confirmPassword",
        ],
      }
    );

// ==========================================================
// Safe registration error message
// ==========================================================

function getRegisterErrorMessage(
  error
) {
  const code =
    error?.code ||
    error?.status;

  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists.";

    case "email_address_invalid":
      return "Please use a valid email address.";

    case "weak_password":
      return "Please choose a stronger password.";

    case "signup_disabled":
      return "Account registration is currently unavailable.";

    case "too_many_requests":
      return "Too many registration attempts. Please try again later.";

    case "network_error":
      return "Unable to connect to the authentication service.";

    default:
      return "Unable to create your account. Please try again.";
  }
}

// ==========================================================
// Component
// ==========================================================

export default function Register() {
  const navigate =
    useNavigate();

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
          registerSchema
        ),

      defaultValues: {
        username: "",
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
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
        await supabase.auth.signUp({
          email:
            values.email.trim(),

          password:
            values.password,

          options: {
            data: {
              username:
                values.username.trim(),

              full_name:
                values.fullName.trim(),
            },
          },
        });

      if (error) {
        console.error(
          "Register authentication error:",
          error
        );

        showAppToast({
          type: "error",
          title:
            "Registration failed",
          message:
            getRegisterErrorMessage(
              error
            ),
        });

        return;
      }

      // ====================================================
      // Email confirmation required
      // ====================================================

      if (!data?.session) {
        showAppToast({
          type: "success",
          title:
            "Account created",
          message:
            "Your account was created. Please check your email to confirm your account before signing in.",
          duration: 6000,
        });

        navigate(
          "/login",
          {
            replace: true,
          }
        );

        return;
      }

      // ====================================================
      // Session created immediately
      // ====================================================

      dispatch(
        setSession(
          data.session
        )
      );

      showAppToast({
        type: "success",
        title:
          "Account created",
        message:
          "Your account has been created successfully.",
      });

      navigate(
        "/",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Register Error:",
        error
      );

      showAppToast({
        type: "error",
        title:
          "Registration failed",
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
                  Create your account
                </CardTitle>

                <CardDescription className="mt-2">
                  Set up your workspace profile in a few seconds.
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
                {/* Username */}

                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username
                  </Label>

                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="username"
                      placeholder="ahmed_dev"
                      className={[
                        "pl-10",
                        errors.username
                          ? "border-destructive focus-visible:ring-destructive"
                          : "",
                      ].join(" ")}
                      autoComplete="username"
                      {...register(
                        "username"
                      )}
                    />
                  </div>

                  {errors.username && (
                    <p className="text-sm text-destructive">
                      {
                        errors
                          .username
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Full Name */}

                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name
                  </Label>

                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="fullName"
                      placeholder="Ahmed Ali"
                      className={[
                        "pl-10",
                        errors.fullName
                          ? "border-destructive focus-visible:ring-destructive"
                          : "",
                      ].join(" ")}
                      autoComplete="name"
                      {...register(
                        "fullName"
                      )}
                    />
                  </div>

                  {errors.fullName && (
                    <p className="text-sm text-destructive">
                      {
                        errors
                          .fullName
                          .message
                      }
                    </p>
                  )}
                </div>

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
                        errors.email
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
                      placeholder="At least 8 characters"
                      className={[
                        "pl-10",
                        errors.password
                          ? "border-destructive focus-visible:ring-destructive"
                          : "",
                      ].join(" ")}
                      autoComplete="new-password"
                      {...register(
                        "password"
                      )}
                    />
                  </div>

                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {
                        errors.password
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Confirm Password */}

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password
                  </Label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repeat your password"
                      className={[
                        "pl-10",
                        errors.confirmPassword
                          ? "border-destructive focus-visible:ring-destructive"
                          : "",
                      ].join(" ")}
                      autoComplete="new-password"
                      {...register(
                        "confirmPassword"
                      )}
                    />
                  </div>

                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {
                        errors
                          .confirmPassword
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

                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {/* Login */}

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}

                  <Link
                    to="/login"
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign in
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
