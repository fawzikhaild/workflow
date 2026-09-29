
import { useState } from "react";

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

const registerSchema = z
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

    confirmPassword: z.string(),
  })
  .refine(
    (values) =>
      values.password ===
      values.confirmPassword,
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    }
  );

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [serverError, setServerError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(
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

  async function onSubmit(values) {
    setServerError("");
    setSuccessMessage("");

    try {
      const {
        data,
        error,
      } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,

        options: {
          data: {
            username: values.username,
            full_name: values.fullName,
          },
        },
      });

      if (error) {
        setServerError(
          error.message ||
            "Unable to create your account."
        );
        return;
      }

      if (!data.session) {
        setSuccessMessage(
          "Account created successfully. Please check your email to confirm your account before signing in."
        );
        return;
      }

      dispatch(
        setSession(data.session)
      );

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Register Error:",
        error
      );

      setServerError(
        "Something went wrong. Please try again."
      );
    }
  }

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
                className="space-y-5"
              >
                {serverError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {serverError}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                    {successMessage}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username
                  </Label>

                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="username"
                      placeholder="ahmed_dev"
                      className="pl-10"
                      autoComplete="username"
                      {...register(
                        "username"
                      )}
                    />
                  </div>

                  {errors.username && (
                    <p className="text-sm text-destructive">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name
                  </Label>

                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="fullName"
                      placeholder="Ahmed Ali"
                      className="pl-10"
                      autoComplete="name"
                      {...register(
                        "fullName"
                      )}
                    />
                  </div>

                  {errors.fullName && (
                    <p className="text-sm text-destructive">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

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
                      className="pl-10"
                      autoComplete="email"
                      {...register("email")}
                    />
                  </div>

                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

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
                      className="pl-10"
                      autoComplete="new-password"
                      {...register(
                        "password"
                      )}
                    />
                  </div>

                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

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
                      className="pl-10"
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isSubmitting ||
                    Boolean(successMessage)
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

