"use client";

import * as React from "react";

export type ListItem = {
  id: string;
  title: string;
  image: string | null;
  url: string | null;
  priceCents: number | null;
  createdAt?: string | Date;
  ownerName?: string | null;
  ownerImage?: string | null;
  claimsCount?: number | null;
  creatorName?: string | null;
};

export default function ListItemCard({ item, onEdit, onDelete }: { item: ListItem; onEdit?: (id: string) => void; onDelete?: (id: string) => void; }) {
  const price = item.priceCents != null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.priceCents / 100)
    : null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-3">
      <div className="h-10 w-10 rounded-md bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg">🎁</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[var(--foreground)] truncate">{item.title}</div>
        {(item.ownerName || item.createdAt) && (
          <div className="text-xs text-[var(--foreground-secondary)] truncate">
            {item.ownerName ? `${item.ownerName}` : ''}
            {item.ownerName && item.createdAt ? ' • ' : ''}
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : ''}
          </div>
        )}
        {item.creatorName && item.ownerName && item.creatorName !== item.ownerName ? (
          <div className="text-xs text-[var(--primary)] mt-1">Ajouté par {item.creatorName}</div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {item.claimsCount && item.claimsCount > 0 ? (
          <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--accent-light)] text-[var(--accent)] font-medium whitespace-nowrap">Pris</span>
        ) : null}
        <div className="text-sm text-[var(--foreground)]">
          {price ?? (item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline">Lien</a> : null)}
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex gap-1 ml-2">
          {onEdit && (
            <button onClick={() => onEdit(item.id)} className="cursor-pointer h-8 w-8 inline-flex items-center justify-center rounded-md border border-[var(--border)] hover:bg-[var(--surface)]" aria-label="Modifier">✏️</button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(item.id)} className="cursor-pointer h-8 w-8 inline-flex items-center justify-center rounded-md border border-[var(--border)] text-[var(--error)] hover:bg-[var(--surface)]" aria-label="Supprimer">🗑️</button>
          )}
        </div>
      )}
    </div>
  );
}
