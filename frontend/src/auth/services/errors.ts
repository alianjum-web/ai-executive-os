/** User-friendly messages for Supabase Auth API errors. */
export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return (
      "Too many sign-in attempts. Supabase has temporarily blocked further tries. " +
      "Wait 15–60 minutes, then try again with the correct email and password. " +
      "Avoid clicking Sign in repeatedly while testing."
    );
  }

  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Email or password is incorrect. Check your credentials and try again.";
  }

  if (lower.includes("email not confirmed")) {
    return "Confirm your email using the link Supabase sent you, then sign in.";
  }

  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Sign in instead of signing up.";
  }

  return message;
}
