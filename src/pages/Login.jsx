
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

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),

  password: z
    .string()
    .min(
      6,
      "Password must contain at least 6 characters."
    ),
});

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [serverError, setServerError] =
    useState("");

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    setServerError("");

    try {
      const {
        data,
        error,
      } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setServerError(
          error.message ||
            "Unable to sign in."
        );
        return;
      }

      dispatch(
        setSession(data.session)
      );

      const destination =
        location.state?.from?.pathname ||
        "/";

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Login Error:",
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
                className="space-y-5"
              >
                {serverError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {serverError}
                  </div>
                )}

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
                      placeholder="••••••••"
                      className="pl-10"
                      autoComplete="current-password"
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
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

