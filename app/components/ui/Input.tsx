"use client";

import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  id?: string;
};

export default function Input({ label, hint, prefix, suffix, className = "", id, ...props }: InputProps) {
  const inputId = React.useId();
  const resolvedId = id ?? inputId;
  const hintId = hint ? `${resolvedId}-hint` : undefined;

  return (
    <div className="grid gap-2">
      {label && (
        <label htmlFor={resolvedId} className="text-sm font-medium text-[var(--foreground-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-secondary)] text-sm font-medium">
            {prefix}
          </span>
        )}
        <input
          id={resolvedId}
          aria-describedby={hintId}
          className={[
            "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--foreground)] outline-none transition-shadow placeholder:text-[var(--foreground-secondary)]/70 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20",
            prefix ? 'pl-8 pr-3' : suffix ? 'pl-3 pr-8' : 'px-3',
            className,
          ].join(" ")}
          {...props}
        />
        {suffix && (
          <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-secondary)] text-sm font-medium">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <span id={hintId} className="text-xs text-[var(--foreground-secondary)]">
          {hint}
        </span>
      )}
    </div>
  );
}
