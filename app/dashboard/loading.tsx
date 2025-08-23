export default function LoadingDashboard() {
  return (
    <main className="container py-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-[var(--surface)] rounded" />
          <div className="h-8 w-28 bg-[var(--surface)] rounded" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
              <div className="h-5 w-40 bg-[var(--surface)] rounded" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-[var(--surface)] rounded" />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
              <div className="h-5 w-56 bg-[var(--surface)] rounded" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-[var(--surface)] rounded" />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
              <div className="h-5 w-28 bg-[var(--surface)] rounded" />
              <div className="h-10 bg-[var(--surface)] rounded" />
            </div>
            <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
              <div className="h-5 w-32 bg-[var(--surface)] rounded" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-[var(--surface)] rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
