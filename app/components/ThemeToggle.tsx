"use client";

import * as React from "react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("theme");
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const dark = stored ? stored === "dark" : systemDark;
      setIsDark(dark);
    } catch {}
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      const theme = next ? "dark" : "light";
      localStorage.setItem("theme", theme);
      document.documentElement.classList.toggle("dark", next);
    } catch {}
  };

  // Avoid hydration mismatch: render a neutral button until mounted
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className={[
        "inline-flex items-center justify-center h-10 w-10 rounded-lg border border-[var(--border)] text-[var(--foreground)] bg-[var(--card-bg)] hover:bg-[var(--surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
        className,
      ].join(" ")}
    >
      {/* Icon: sun/moon */}
      <span aria-hidden="true" className="text-base">
  {!mounted ? "🌗" : isDark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
