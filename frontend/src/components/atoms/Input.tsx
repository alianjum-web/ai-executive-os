"use client";

import clsx from "clsx";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={clsx(
          "rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
