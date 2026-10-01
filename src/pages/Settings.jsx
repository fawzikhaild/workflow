
import {
  useEffect,
  useState,
} from "react";

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
  CheckCircle2,
  Mail,
  Moon,
  Save,
  Sun,
  User,
} from "lucide-react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import ThemeToggle from "@/components/theme-toggle";

import {
  useGetMyProfileQuery,
} from "@/store/api/apiSlice";

import {
  apiSlice,
} from "@/store/api/apiSlice";

import {
  supabase,
} from "@/lib/supabaseClient";

import {
  useTheme,
} from "@/components/theme-provider";

const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(
      2,
      "Full name must contain at least 2 characters."
    )
    .max(
      100,
      "Full name is too long."
    ),

  username: z
    .string()
    .trim()
    .min(
      3,
      "Username must contain at least 3 characters."
    )
    .max(
      30,
      "Username is too long."
    )
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Username can only contain letters, numbers, dots, underscores, and hyphens."
    ),
});

export default function Settings() {
  const dispatch = useDispatch();

  const user = useSelector(
    (state) =>
      state.auth.user
  );

  const {
    theme,
  } = useTheme();

  const {
    data: profile,
    isLoading,
    isFetching,
    refetch,
  } =
    useGetMyProfileQuery(
      user?.id,
      {
        skip: !user?.id,
      }
    );

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isDirty,
      isSubmitting,
    },
  } = useForm({
    resolver:
      zodResolver(
        profileSchema
      ),
    defaultValues: {
      full_name: "",
      username: "",
    },
  });

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    if (!profile) {
      return;
    }

    reset({
      full_name:
        profile.full_name || "",
      username:
        profile.username || "",
    });

    setSuccessMessage("");
    setErrorMessage("");
  }, [
    profile,
    reset,
  ]);

  async function handleProfileSubmit(
    values
  ) {
    if (!user?.id) {
      return;
    }

    try {
      setSuccessMessage("");
      setErrorMessage("");

      const {
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            full_name:
              values.full_name.trim(),
            username:
              values.username.trim(),
          })
          .eq("id", user.id);

      if (error) {
        throw error;
      }

      await refetch();

      dispatch(
        apiSlice.util.invalidateTags([
          {
            type: "Profile",
            id: user.id,
          },
        ])
      );

      reset({
        full_name:
          values.full_name.trim(),
        username:
          values.username.trim(),
      });

      setSuccessMessage(
        "Your profile has been updated successfully."
      );
    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to update your profile."
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
      {/* Header */}

      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="size-5" />
          </div>

          <span className="text-sm font-medium text-muted-foreground">
            Account Settings
          </span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Manage your profile and application preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Profile */}

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>
              Profile
            </CardTitle>

            <CardDescription>
              Update the information displayed across your workspace.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-5">
                <div className="h-10 animate-pulse rounded-xl bg-muted" />
                <div className="h-10 animate-pulse rounded-xl bg-muted" />
                <div className="h-10 animate-pulse rounded-xl bg-muted" />
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(
                  handleProfileSubmit
                )}
                className="space-y-6"
              >
                {/* Full name */}

                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Full name
                  </Label>

                  <Input
                    id="full_name"
                    placeholder="Your full name"
                    {...register(
                      "full_name"
                    )}
                  />

                  {errors.full_name && (
                    <p className="text-sm text-destructive">
                      {
                        errors
                          .full_name
                          .message
                      }
                    </p>
                  )}
                </div>

                {/* Username */}

                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username
                  </Label>

                  <Input
                    id="username"
                    placeholder="username"
                    {...register(
                      "username"
                    )}
                  />

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

                {/* Email */}

                <div className="space-y-2">
                  <Label>
                    Email
                  </Label>

                  <div className="flex items-center gap-3 rounded-xl border bg-muted/40 px-3">
                    <Mail className="size-4 shrink-0 text-muted-foreground" />

                    <Input
                      value={
                        user?.email ||
                        ""
                      }
                      readOnly
                      className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Your authentication email is managed by Supabase Auth.
                  </p>
                </div>

                {/* Messages */}

                {successMessage && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />

                    <span>
                      {successMessage}
                    </span>
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    {errorMessage}
                  </div>
                )}

                {/* Submit */}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !isDirty
                    }
                  >
                    <Save className="size-4" />

                    {isSubmitting
                      ? "Saving..."
                      : "Save changes"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Preferences */}

        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>
                Appearance
              </CardTitle>

              <CardDescription>
                Choose how WorkFlow looks on your device.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between gap-4 rounded-2xl border p-4">
                <div className="flex items-center gap-3">
                  {theme ===
                  "dark" ? (
                    <Moon className="size-5 text-primary" />
                  ) : (
                    <Sun className="size-5 text-primary" />
                  )}

                  <div>
                    <p className="text-sm font-medium">
                      Theme
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Current:{" "}
                      {theme ===
                      "dark"
                        ? "Dark"
                        : "Light"}
                    </p>
                  </div>
                </div>

                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Account */}

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>
                Account
              </CardTitle>

              <CardDescription>
                Basic information about your WorkFlow account.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Account email
                  </p>

                  <p className="mt-1 break-all text-sm font-medium">
                    {user?.email ||
                      "Unavailable"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    User ID
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {user?.id ||
                      "Unavailable"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Theme
                  </p>

                  <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                    {theme ===
                    "dark" ? (
                      <Moon className="size-4" />
                    ) : (
                      <Sun className="size-4" />
                    )}

                    {theme ===
                    "dark"
                      ? "Dark mode"
                      : "Light mode"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom loading state */}

      {isFetching &&
        !isLoading && (
          <p className="mt-4 text-xs text-muted-foreground">
            Refreshing profile...
          </p>
        )}
    </div>
  );
}

