"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Button from "./ui/Button";
import ClaimButton from "./ClaimButton";
import { authClient } from "../lib/auth-client";
import { useEffect, useState } from "react";
import ButtonLink from "./ui/ButtonLink";
import ImageModal from "./ImageModal";

export type ListItem = {
  listId: string;
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
  notes?: string | null;
};

export default function ListItemCard({ item, onEdit, refetch, showViewListButton = false }: { item: ListItem; onEdit?: (id: string) => void; refetch?: () => void; showViewListButton?: boolean }) {
  const price = item.priceCents != null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.priceCents / 100)
    : null;

  const session = authClient.useSession();

  const [isOwner, setIsOwner] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  useEffect(() => {
    if (session?.data?.user.name) {
      setIsOwner(item.ownerName === session.data.user.name);
    }
  }, [session, item]);

  const handleDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Price formatting is handled in display components when needed
      const base = `${location.protocol}//${location.host}`;
      await fetch(`${base}/api/ideas/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      refetch && refetch();
    }
  })



  return (
    <>
      <div className="flex-col space-y-4 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-10 w-10 rounded-md bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => item.image && setIsImageModalOpen(true)}>
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg">🎁</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[var(--foreground)] wrap-normal">{item.title}</div>
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
          {(onEdit || refetch) && (
            <div className="flex gap-1 ml-2">
              {onEdit && (
                <button onClick={() => onEdit(item.id)} className="cursor-pointer h-8 w-8 inline-flex items-center justify-center rounded-md border border-[var(--border)] hover:bg-[var(--surface)]" aria-label="Modifier">✏️</button>
              )}
              {refetch && (
                <Button disabled={handleDeleteMutation.isPending} onClick={() => handleDeleteMutation.mutate(item.id)} className="cursor-pointer size-8 px-0! rounded-md border border-[var(--border)] hover:bg-[var(--surface)]" variant="ghost" aria-label="Supprimer">
                  {handleDeleteMutation.isPending ? <Loader2Icon className="size-6 animate-spin" /> : <span>🗑️</span>}
                </Button>
              )}
            </div>
          )}
        </div>
        <p className="flex-1">
          {item.notes}
        </p>
        <div className="flex items-center justify-between">
          {!isOwner ? (<ClaimButton ideaId={item.id} />) : null}
          {showViewListButton && <ButtonLink href={`/list/${item.listId}`} size="sm" variant="outline">Voir la liste</ButtonLink>}
        </div>
      </div>
      
      {item.image && (
        <ImageModal 
          src={item.image} 
          alt={item.title} 
          isOpen={isImageModalOpen} 
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </>
  );
}
