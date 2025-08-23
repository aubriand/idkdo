export default function LoadingDiscover() {
  return (
    <main className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-56 bg-[var(--surface)] rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
        ))}
      </div>
    </main>
  );
}
