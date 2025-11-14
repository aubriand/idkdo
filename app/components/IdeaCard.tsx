"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Button from "./ui/Button";
import ButtonLink from "./ui/ButtonLink";
import ClaimButton from "./ClaimButton";
import ImageModal from "./ImageModal";
import Modal from "./ui/Modal";
import SuggestIdeaForm from "./SuggestIdeaForm";
import { useToast } from "./ui/ToastProvider";
import { authClient } from "@/app/lib/auth-client";
import { useEffect, useState } from "react";

export type IdeaCardItem = {
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

interface IdeaCardProps {
  idea: IdeaCardItem;
  isOwner?: boolean;
  showClaimButton?: boolean;
  showViewListButton?: boolean;
  onEdit?: (id: string) => void;
  refetch?: () => void;
}

export default function IdeaCard({ 
  idea, 
  isOwner = false,
  showClaimButton = false,
  showViewListButton = false, 
  onEdit, 
  refetch 
}: IdeaCardProps) {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const session = authClient.useSession();

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; onYes: () => void } | null>(null);
  const [editingIdea, setEditingIdea] = useState<IdeaCardItem | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  // Déterminer si l'utilisateur peut modifier/supprimer
  useEffect(() => {
    if (isOwner) {
      setCanEdit(true);
    } else {
      if (!idea.creatorName) {
        setCanEdit(false);
        return;
      }
      if (session?.data?.user?.name === idea.creatorName) {
        setCanEdit(true);
      }
    }
  }, [isOwner, session?.data?.user?.name, idea.creatorName]);

  const price = idea.priceCents != null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(idea.priceCents / 100)
    : null;

  const updateIdeaMutation = useMutation({
    mutationFn: async (data: Partial<IdeaCardItem>) => {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Erreur de modification');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', idea.listId] });
      success({ title: 'Idée modifiée !' });
      setEditingIdea(null);
    },
    onError: (e: Error) => {
      toastError({ title: 'Erreur', description: e.message || 'Impossible de modifier l\'idée' });
    }
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ideas/${idea.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur de suppression');
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', idea.listId] });
      success({ title: 'Idée supprimée !' });
      refetch?.();
    },
    onError: () => {
      toastError({ title: 'Erreur', description: 'Impossible de supprimer l\'idée' });
    },
  });

  return (
    <>
      <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col h-full">
        
        {/* Image Section */}
        <div className="relative w-full h-40 bg-[var(--surface)] overflow-hidden flex items-center justify-center">
          {idea.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={idea.image} 
              alt={idea.title}
              className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
              onClick={() => setIsImageModalOpen(true)}
            />
          ) : (
            <span className="text-5xl">🎁</span>
          )}
          
          {/* Price Badge */}
          {price && (
            <div className="absolute top-3 right-3 bg-[var(--primary)] text-white px-3 py-1.5 rounded-lg font-semibold text-sm shadow-md">
              {price}
            </div>
          )}
          
          {/* Claimed Badge */}
          {(idea.claimsCount && idea.claimsCount > 0) ? (
            <div className="absolute top-3 left-3 bg-[var(--accent)] text-white px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-1 shadow-md">
              <span>✅</span> Pris
            </div>
          ) : null}
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 p-4">
          
          {/* Title */}
          <div className="mb-3">
            {idea.url ? (
              <a 
                href={idea.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--foreground)] font-semibold text-base hover:text-[var(--primary)] hover:underline line-clamp-2 transition-colors"
              >
                🔗 {idea.title}
              </a>
            ) : (
              <h4 className="text-[var(--foreground)] font-semibold text-base line-clamp-2">
                💡 {idea.title}
              </h4>
            )}
          </div>

          {/* Notes */}
          {idea.notes && (
            <p className="text-sm text-[var(--foreground-secondary)] mb-3">
              {idea.notes}
            </p>
          )}

          {/* Meta Info */}
          <div className="space-y-2 mb-4 text-xs text-[var(--foreground-secondary)]">
            {idea.ownerName && (
              <div className="flex items-center gap-1">
                {
                  idea.ownerImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={idea.ownerImage}
                      alt={idea.ownerName || "Utilisateur"}
                      className="size-4 rounded-full object-cover"
                    />
                  ) : (
                    <span>👤</span>
                  )
                }
                {idea.ownerName}
              </div>
            )}
            {idea.createdAt && (
              <div className="flex items-center gap-1">
                <span>📅</span>
                {new Date(idea.createdAt).toLocaleDateString('fr-FR')}
              </div>
            )}
            {idea.creatorName && idea.ownerName && idea.creatorName !== idea.ownerName && (
              <div className="flex items-center gap-1 text-[var(--primary)]">
                <span>✏️</span>
                Ajouté par {idea.creatorName}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-[var(--border)]">
            <div className="flex gap-2">
              {showClaimButton && !isOwner && (
                <div className="flex-1">
                  <ClaimButton ideaId={idea.id} />
                </div>
              )}
              {showViewListButton && (
                <ButtonLink href={`/list/${idea.listId}`} size="sm" variant="outline" className="flex-1">
                  Voir la liste
                </ButtonLink>
              )}
            </div>

            {canEdit && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingIdea(idea)} 
                  className="flex-1 h-9 inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--card-bg)] text-sm font-medium transition-colors"
                  aria-label="Modifier"
                >
                  <span>✏️</span> Modifier
                </button>
                <button 
                  disabled={deleteIdeaMutation.isPending}
                  onClick={() => setConfirm({ open: true, title: 'Supprimer cette idée ?', onYes: async () => { await deleteIdeaMutation.mutateAsync(); setConfirm(null); } })} 
                  className="flex-1 h-9 inline-flex items-center justify-center gap-2 rounded-md border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Supprimer"
                >
                  {deleteIdeaMutation.isPending ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <>
                      <span>🗑️</span> Supprimer
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {idea.image && (
        <ImageModal 
          src={idea.image} 
          alt={idea.title} 
          isOpen={isImageModalOpen} 
          onClose={() => setIsImageModalOpen(false)}
        />
      )}

      {/* Edit Idea Modal */}
      <Modal 
        open={!!editingIdea} 
        onClose={() => setEditingIdea(null)} 
        title="Modifier l'idée"
        footer={null}
      >
        {editingIdea && (
          <div className="space-y-4">
            <SuggestIdeaForm
              listId={editingIdea.listId}
              initialValues={{
                title: editingIdea.title,
                url: editingIdea.url || "",
                image: editingIdea.image || "",
                notes: editingIdea.notes || "",
                priceCents: editingIdea.priceCents || undefined,
              }}
              mode="edit"
              onSubmit={async (data) => {
                await updateIdeaMutation.mutateAsync(data);
              }}
            />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        open={!!confirm?.open} 
        onClose={() => setConfirm(null)} 
        title={confirm?.title} 
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={() => confirm?.onYes()}>
              Supprimer
            </Button>
          </div>
        }
      >
        <p className="text-[var(--foreground-secondary)]">
          Cette action est irréversible.
        </p>
      </Modal>
    </>
  );
}