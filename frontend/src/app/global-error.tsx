"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0b1020] px-6 font-sans text-[#f8fafc]">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-center text-sm text-[#94a3b8]">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-[#4f8cff] px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
