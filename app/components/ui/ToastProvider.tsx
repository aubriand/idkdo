"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: string; title?: string; description?: string; variant?: "default" | "success" | "error" };
type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void;
  success: (t: Omit<Toast, "id" | "variant">) => void;
  error: (t: Omit<Toast, "id" | "variant">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, ...t };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  const value = useMemo<ToastContextValue>(() => ({
    toast: push,
    success: (t) => push({ ...t, variant: "success" }),
    error: (t) => push({ ...t, variant: "error" }),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toaster */}
  <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(420px,90vw)] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={[
            "pointer-events-auto rounded-md border p-3 shadow-sm backdrop-blur",
    "bg-[color-mix(in_srgb,var(--card-bg)_95%,transparent)] border-[var(--border)] text-[var(--foreground)]",
            t.variant === "success" ? "border-emerald-300/60 ring-1 ring-emerald-500/20" : "",
            t.variant === "error" ? "border-red-300/60 ring-1 ring-red-500/20" : "",
          ].join(" ")}
          >
            {t.title && <div className="text-sm font-semibold">{t.title}</div>}
    {t.description && <div className="text-sm text-[var(--foreground-secondary)]">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
