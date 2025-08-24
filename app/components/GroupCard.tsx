import Link from "next/link";
import ShareButton from "./ShareButton";

export default function GroupCard({ id, name, membersCount }: { id: string; name: string; membersCount: number }) {
  return (
    <li className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2">
      <div className="min-w-0">
        <div className="text-[var(--foreground)] truncate">{name}</div>
        <div className="text-xs text-[var(--foreground-secondary)]">{membersCount} membre{membersCount > 1 ? 's' : ''}</div>
      </div>
      <div className="flex items-center gap-2">
        <ShareButton groupId={id}>🔗 Partager</ShareButton>
        <Link href={`/groups/${id}`} className="inline-flex items-center h-8 px-3 rounded-md border border-[var(--border)] bg-[var(--surface)] text-sm">Ouvrir</Link>
      </div>
    </li>
  );
}
