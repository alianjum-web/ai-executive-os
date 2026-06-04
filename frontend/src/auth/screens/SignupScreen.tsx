"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/common/atoms/Button";
import { Input } from "@/common/atoms/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { AuthShell } from "@/auth/organisms/AuthShell";
import { Logo } from "@/common/atoms/Logo";
import { authService, formatAuthError } from "@/auth/services";
import {
  signupResolver,
  type SignupFormValues,
} from "@/auth/services/form-resolvers";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";

export function SignupScreen() {
  const authEnabled = useFeatureFlag("BASIC_AUTH_ENABLED");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: signupResolver,
    defaultValues: { email: "", password: "", orgName: "" },
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      const { error: signUpError } = await authService.signUp({
        email: data.email,
        password: data.password,
        metadata: {
          org_id: crypto.randomUUID(),
          org_name: data.orgName,
          role: "admin",
        },
      });
      if (signUpError) throw signUpError;
      setSuccessMessage(
        "Account created. Check your email for a confirmation link, then sign in with the same credentials."
      );
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Sign up failed";
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
      headline="Create your workspace"
      description="Register your organization once. After email confirmation, sign in to upload knowledge and use the AI assistant."
    >
      <Card className="shadow-lg">
        <CardHeader>
          <div className="mb-2 lg:hidden">
            <Logo showWordmark href="/welcome" />
          </div>
          <CardTitle className="text-xl">Register</CardTitle>
          <p className="text-sm text-muted-foreground">
            For new teams and administrators setting up Executive OS.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Input
              label="Work email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              error={errors.password?.message}
              {...register("password")}
            />
            <Input
              label="Organization name"
              placeholder="Your company or team name"
              autoComplete="organization"
              error={errors.orgName?.message}
              {...register("orgName")}
            />
            {successMessage ? (
              <p
                className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
                role="status"
              >
                {successMessage}
              </p>
            ) : null}
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
              Create account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-medium text-accent-blue hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
