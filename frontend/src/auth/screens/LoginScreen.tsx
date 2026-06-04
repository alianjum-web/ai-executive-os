"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/common/atoms/Button";
import { Input } from "@/common/atoms/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { AuthShell } from "@/auth/organisms/AuthShell";
import { Logo } from "@/common/atoms/Logo";
import { authService, formatAuthError } from "@/auth/services";
import {
  loginResolver,
  type LoginFormValues,
} from "@/auth/services/form-resolvers";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";

export function LoginScreen() {
  const router = useRouter();
  const authEnabled = useFeatureFlag("BASIC_AUTH_ENABLED");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: loginResolver,
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null);
    try {
      const { error: signInError } = await authService.signIn({
        email: data.email,
        password: data.password,
      });
      if (signInError) throw signInError;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Login failed";
      setFormError(formatAuthError(raw));
    }
  });

  if (!authEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-muted-foreground">Authentication is disabled.</p>
      </div>
    );
  }

  return (
    <AuthShell
      headline="Welcome back"
      description="Sign in to your command center — knowledge, routing, and analytics in one calm workspace."
    >
      <Card className="shadow-lg">
        <CardHeader>
          <div className="mb-2 lg:hidden">
            <Logo showWordmark href="/welcome" />
          </div>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use the email and password from your registered account.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full"
            >
              Sign in
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              href="/signup"
              className="font-medium text-accent-blue hover:underline"
            >
              Create an account
            </Link>
          </p>
          <p className="mt-3 text-center text-sm">
            <Link
              href="/welcome"
              className="text-muted-foreground hover:text-foreground"
            >
              Learn about Executive OS
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
