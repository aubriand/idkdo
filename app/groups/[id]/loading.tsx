export default function LoadingGroupDetail() {
  return (
    <main className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-60 bg-[var(--surface)] rounded" />
        <div className="h-10 w-28 bg-[var(--surface)] rounded" />
        <div className="h-48 rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
      </div>
    </main>
  );
}
