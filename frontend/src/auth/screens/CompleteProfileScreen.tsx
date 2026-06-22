"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/common/atoms/Button";
import { Input } from "@/common/atoms/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import { AuthShell } from "@/auth/organisms/AuthShell";
import { authService } from "@/auth/services";

export function CompleteProfileScreen() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const orgId = crypto.randomUUID();
      const { error: updateError } = await authService.updateUserMetadata({
        org_id: orgId,
        org_name: orgName.trim(),
        role: "admin",
      });
      if (updateError) throw updateError;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      headline="Finish setup"
      description="SSO sign-in succeeded. Name your organization to finish onboarding."
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Organization name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Corp"
            />
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" isLoading={busy} className="w-full">
              Continue to dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
