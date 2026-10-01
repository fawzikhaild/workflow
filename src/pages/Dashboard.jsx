import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  CheckCircle2,
  FolderKanban,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useSelector } from "react-redux";

import {
  useCreateTeamMutation,
  useGetMyProfileQuery,
  useGetMyTeamsQuery,
} from "@/store/api/apiSlice";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Team name must be at least 2 characters."
    )
    .max(
      80,
      "Team name must be less than 80 characters."
    ),

  description: z
    .string()
    .trim()
    .max(
      300,
      "Description must be less than 300 characters."
    )
    .optional(),
});

function getApiErrorMessage(error, fallback) {
  if (!error) {
    return fallback;
  }

  return (
    error?.data?.message ||
    error?.data?.error ||
    error?.error ||
    error?.message ||
    fallback
  );
}

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-10">
      <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useSelector(
    (state) => state.auth
  );

  const [createSuccess, setCreateSuccess] =
    useState("");

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileIsError,
    error: profileError,
  } = useGetMyProfileQuery(
    user?.id,
    {
      skip: !user?.id,
    }
  );

  const {
    data: teams = [],
    isLoading: teamsLoading,
    isError: teamsIsError,
    error: teamsError,
  } = useGetMyTeamsQuery(
    user?.id,
    {
      skip: !user?.id,
    }
  );

  const [createTeam, createState] =
    useCreateTeamMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(teamSchema),

    defaultValues: {
      name: "",
      description: "",
    },
  });

  async function onSubmit(values) {
    setCreateSuccess("");

    try {
      const newTeam =
        await createTeam({
          name: values.name,
          description: values.description,
        }).unwrap();

      reset();

      setCreateSuccess(
        `Team "${newTeam.name}" was created successfully.`
      );
    } catch (error) {
      console.error(
        "Create team error:",
        error
      );
    }
  }

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const username =
    profile?.username ||
    user?.user_metadata?.username ||
    "No username";

  const profileErrorMessage =
    getApiErrorMessage(
      profileError,
      "Unable to load your profile."
    );

  const teamsErrorMessage =
    getApiErrorMessage(
      teamsError,
      "Unable to load your teams."
    );

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
          }}
          className="mb-8"
        >
          <p className="mb-2 text-sm font-medium text-primary">
            WorkFlow Workspace
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back, {displayName}.
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage your teams, projects, tasks,
            and collaboration from one workspace.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{
              opacity: 0,
              x: -18,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.45,
              delay: 0.08,
            }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>
                      My Profile
                    </CardTitle>

                    <CardDescription>
                      Your WorkFlow account
                      information.
                    </CardDescription>
                  </div>

                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-5" />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {profileLoading ? (
                  <SectionLoader />
                ) : profileIsError ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-sm text-destructive">
                      {profileErrorMessage}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Full name
                      </p>

                      <p className="mt-1 font-medium">
                        {profile?.full_name ||
                          "Not set"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Username
                      </p>

                      <p className="mt-1 font-medium">
                        @{username}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Email
                      </p>

                      <p className="mt-1 break-all font-medium">
                        {user?.email ||
                          "No email"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Account role
                      </p>

                      <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium">
                        <ShieldCheck className="size-4" />
                        {profile?.role ||
                          "user"}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              x: 18,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.45,
              delay: 0.14,
            }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>
                      Create a Team
                    </CardTitle>

                    <CardDescription>
                      Start a workspace for your
                      project members.
                    </CardDescription>
                  </div>

                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Plus className="size-5" />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <form
                  onSubmit={handleSubmit(
                    onSubmit
                  )}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="team-name">
                      Team name
                    </Label>

                    <Input
                      id="team-name"
                      placeholder="e.g. Product Team"
                      {...register("name")}
                    />

                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team-description">
                      Description
                    </Label>

                    <textarea
                      id="team-description"
                      placeholder="What does this team work on?"
                      {...register(
                        "description"
                      )}
                      className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    {errors.description && (
                      <p className="text-sm text-destructive">
                        {
                          errors
                            .description
                            .message
                        }
                      </p>
                    )}
                  </div>

                  {createSuccess && (
                    <div className="flex items-start gap-2 rounded-xl border border-green-500/30 bg-green-500/5 p-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />

                      <p className="text-sm text-green-700 dark:text-green-400">
                        {createSuccess}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      createState.isLoading
                    }
                  >
                    {createState.isLoading ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="size-4" />
                        Create team
                      </>
                    )}
                  </Button>

                  {createState.error && (
                    <p className="text-sm text-destructive">
                      {getApiErrorMessage(
                        createState.error,
                        "Unable to create the team."
                      )}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.section
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            delay: 0.2,
          }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>
                    My Teams
                  </CardTitle>

                  <CardDescription>
                    Teams you currently belong to.
                  </CardDescription>
                </div>

                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="size-5" />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {teamsLoading ? (
                <SectionLoader />
              ) : teamsIsError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">
                    {teamsErrorMessage}
                  </p>
                </div>
              ) : teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                    <FolderKanban className="size-6 text-muted-foreground" />
                  </div>

                  <h3 className="font-semibold">
                    No teams yet
                  </h3>

                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Create your first team above
                    and start organizing your
                    work.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="rounded-xl border p-5 transition hover:bg-muted/40"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Users className="size-5" />
                        </div>

                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">
                          {team.memberRole}
                        </span>
                      </div>

                      <h3 className="font-semibold">
                        {team.name}
                      </h3>

                      <p className="mt-1 min-h-10 text-sm text-muted-foreground">
                        {team.description ||
                          "No description provided."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </main>
  );
}

