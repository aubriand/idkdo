export default function LoadingMyList() {
  return (
    <main className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-64 bg-[var(--surface)] rounded" />
        <div className="h-32 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
        <div className="h-24 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    </main>
  );
}
