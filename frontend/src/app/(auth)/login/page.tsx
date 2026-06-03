"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { createClient } from "@/lib/supabase/client";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export default function LoginPage() {
  const router = useRouter();
  const authEnabled = useFeatureFlag("BASIC_AUTH_ENABLED");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      setError("Check your email to confirm your account, then sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!authEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-600">Authentication is disabled.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-zinc-900">Sign in</h1>
        <p className="text-sm text-zinc-500">
          Powered by Supabase Auth (email & password)
        </p>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            Sign in
          </Button>
          <Button type="button" variant="secondary" onClick={handleSignUp} disabled={isLoading}>
            Sign up
          </Button>
        </div>
      </form>
    </div>
  );
}
