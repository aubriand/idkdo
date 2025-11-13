"use client";

import Button from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import Input from "@/app/components/ui/Input";
import { useToast } from "@/app/components/ui/ToastProvider";
import { GiftList, Idea } from "@/generated/prisma";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import IdeaCard from "../components/IdeaCard";

export default function MyListClient() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  // Fetch list
  const {
    data: list,
    isLoading: loadingList,
    error: listError
  } = useQuery<GiftList | null>({
    queryKey: ['my-list'],
    queryFn: async () => {
      const res = await fetch('/api/lists', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: GiftList[] = await res.json();
      return data.length > 0 ? data[0] : null;
    }
  });

  // Fetch ideas
  const {
    data: ideas = [],
    isLoading: loadingIdeas,
    error: ideasError
  } = useQuery<Idea[]>({
    queryKey: ['ideas', list?.id],
    queryFn: async () => {
      if (!list?.id) return [];
      const res = await fetch(`/api/ideas?listId=${encodeURIComponent(list.id)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      return await res.json();
    },
    enabled: !!list?.id
  });

  // Mutation pour créer une idée
  const createIdeaMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!list) throw new Error('Liste introuvable');
      const priceStr = String(formData.get('price') || '').trim();
      const priceCents = priceStr ? Math.round(parseFloat(priceStr.replace(',', '.')) * 100) : undefined;
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: list.id,
          title: String(formData.get('title') || ''),
          url: String(formData.get('url') || '') || null,
          image: String(formData.get('image') || '') || null,
          notes: String(formData.get('notes') || '') || null,
          ...(priceCents !== undefined ? { priceCents } : {})
        })
      });
      if (!res.ok) throw new Error('Erreur de création d\'idée');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', list?.id] });
      success({ title: 'Idée ajoutée avec succès !' });
    },
    onError: (e: Error) => {
      toastError({ title: 'Erreur', description: e.message || 'Impossible d\'ajouter l\'idée' });
    }
  });

  // Mutation pour renommer la liste
  const renameListMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!list) throw new Error('Liste introuvable');
      const res = await fetch(`/api/lists/${list.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error('Erreur de renommage');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-list'] });
      success({ title: 'Liste renommée !' });
    },
    onError: () => {
      toastError({ title: 'Erreur', description: 'Impossible de renommer la liste' });
    }
  });

  if (loadingList || loadingIdeas) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-[var(--foreground-secondary)]">Chargement de votre liste...</p>
      </div>
    );
  }

  if (listError || ideasError) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-[var(--error)] font-medium">{listError?.message || ideasError?.message}</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['my-list'] })} className="mt-4">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!list) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Aucune liste trouvée
          </h3>
          <p className="text-[var(--foreground-secondary)]">
            Votre liste sera créée automatiquement lors de votre première connexion.
          </p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['my-list'] })} className="mt-4">
            Actualiser
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* List Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <CardTitle className="text-2xl">{list.title}</CardTitle>
                {list.description && (
                  <p className="text-[var(--foreground-secondary)] mt-1">{list.description}</p>
                )}
              </div>
            </div>
            <Button onClick={() => {
              const title = prompt('Nouveau titre de votre liste ?', list.title);
              if (title) renameListMutation.mutate(title);
            }} variant="ghost" size="sm">
              <span className="text-sm">✏️</span> Renommer
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add Idea Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">➕</span>
            Ajouter une nouvelle idée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={async (e) => { 
            e.preventDefault(); 
            const form = e.currentTarget;
            await createIdeaMutation.mutateAsync(new FormData(form)); 
            form.reset(); 
          }} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input 
                name="title" 
                label="Nom de l'idée" 
                placeholder="Montre connectée" 
                required 
              />
              <Input 
                name="url" 
                label="Lien (optionnel)" 
                placeholder="https://..." 
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input 
                name="image" 
                label="Image (URL)" 
                placeholder="https://.../photo.jpg" 
              />
              <Input 
                name="price" 
                label="Prix estimé" 
                placeholder="49.99" 
                prefix="€" 
              />
            </div>
            <Input 
              name="notes" 
              label="Notes / Détails" 
              placeholder="Taille M, couleur bleue..." 
            />
            <Button type="submit" variant="primary" size="lg" disabled={createIdeaMutation.isPending}>
              {createIdeaMutation.isPending ? 'Ajout en cours...' : (
                <>
                  <span className="text-lg">✨</span> Ajouter l'idée
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Ideas List */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          Mes idées ({ideas.length})
        </h2>

        {ideas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">💭</div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                Aucune idée pour l'instant
              </h3>
              <p className="text-[var(--foreground-secondary)]">
                Ajoutez votre première idée de cadeau ci-dessus !
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {ideas.map((idea: Idea) => (
              <IdeaCard 
                key={idea.id}
                idea={{
                  id: idea.id,
                  title: idea.title,
                  image: idea.image ?? null,
                  url: idea.url ?? null,
                  priceCents: idea.priceCents ?? null,
                  createdAt: idea.createdAt,
                  notes: idea.notes ?? null,
                  listId: idea.listId,
                }}
                isOwner={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
