"use client";

import Link, { LinkProps } from "next/link";
import * as React from "react";

type ButtonLinkProps = LinkProps & {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  ariaLabel?: string;
  prefetch?: boolean;
};

export default function ButtonLink({
  children,
  className = "",
  variant = "primary",
  size = "md",
  fullWidth = false,
  ariaLabel,
  prefetch = true,
  ...props
}: ButtonLinkProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:opacity-60";
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-sm gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2",
  };
  const variants: Record<string, string> = {
    primary: "text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-sm",
    secondary: "text-white bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] shadow-sm",
    accent: "text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-sm",
    outline: "bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface)]",
    ghost: "bg-transparent text-[var(--foreground-secondary)] border border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
    danger: "bg-[var(--error)] text-white hover:bg-red-600 shadow-sm",
  };
  return (
    <Link
      {...props}
      prefetch={prefetch}
      aria-label={ariaLabel}
      className={[base, sizes[size], variants[variant], fullWidth ? "w-full" : "", className].join(" ")}
    >
      {children}
    </Link>
  );
}
