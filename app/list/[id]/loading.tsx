export default function LoadingListDetail() {
  return (
    <main className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-64 bg-[var(--surface)] rounded" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    </main>
  );
}
