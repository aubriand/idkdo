"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Modal from "@/app/components/ui/Modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { useToast } from "@/app/components/ui/ToastProvider";

type GiftList = { id: string; title: string; description?: string };
type Idea = { 
  id: string; 
  title: string; 
  listId: string; 
  url?: string | null; 
  image?: string | null; 
  priceCents?: number | null;
  notes?: string | null;
};

export default function MyListClient() {
  const [list, setList] = useState<GiftList | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  // modal state
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; onYes: () => void } | null>(null);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  const loadMyList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lists', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: GiftList[] = await res.json();
      if (data.length > 0) {
        setList(data[0]);
        void loadIdeas(data[0].id);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur lors du chargement';
      setError(msg);
      toastError({ title: 'Erreur', description: msg });
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadMyList();
  }, [loadMyList]);

  

  async function loadIdeas(listId: string) {
    try {
      const res = await fetch(`/api/ideas?listId=${encodeURIComponent(listId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: Idea[] = await res.json();
      setIdeas(data);
    } catch (e: unknown) {
      console.error('Error loading ideas:', e);
    }
  }

  async function createIdea(formData: FormData) {
    if (!list) return;
    
    try {
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
      
      await loadIdeas(list.id);
      success({ title: 'Idée ajoutée avec succès !' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Impossible d\'ajouter l\'idée';
      toastError({ title: 'Erreur', description: msg });
    }
  }

  async function updateIdea(ideaId: string, data: Partial<Idea>) {
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error('Erreur de modification');
      
      if (list) await loadIdeas(list.id);
      success({ title: 'Idée modifiée !' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Impossible de modifier l\'idée';
      toastError({ title: 'Erreur', description: msg });
    }
  }

  async function deleteIdea(ideaId: string) {
    setConfirm({ 
      open: true, 
      title: 'Supprimer cette idée ?', 
      onYes: async () => {
        try {
          const res = await fetch(`/api/ideas/${ideaId}`, { method: 'DELETE' });
          if (res.ok && list) { 
            await loadIdeas(list.id); 
            success({ title: 'Idée supprimée !' }); 
          }
        } catch (e) {
          toastError({ title: 'Erreur', description: 'Impossible de supprimer l\'idée' });
        }
        setConfirm(null);
      }
    });
  }

  async function renameList() {
    if (!list) return;
    const title = prompt('Nouveau titre de votre liste ?', list.title);
    if (!title) return;
    
    try {
      const res = await fetch(`/api/lists/${list.id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ title }) 
      });
      
      if (res.ok) {
        setList(prev => prev ? { ...prev, title } : null);
        success({ title: 'Liste renommée !' });
      }
    } catch (e) {
      toastError({ title: 'Erreur', description: 'Impossible de renommer la liste' });
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-[var(--foreground-secondary)]">Chargement de votre liste...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-[var(--error)] font-medium">{error}</p>
          <Button onClick={loadMyList} className="mt-4">
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
          <Button onClick={loadMyList} className="mt-4">
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
            <Button onClick={renameList} variant="ghost" size="sm">
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
            await createIdea(new FormData(e.currentTarget)); 
            e.currentTarget.reset(); 
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
            <Button type="submit" variant="primary" size="lg">
              <span className="text-lg">✨</span> Ajouter l'idée
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
            {ideas.map(idea => (
              <Card key={idea.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {idea.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={idea.image} 
                        alt="" 
                        className="h-20 w-20 rounded-xl object-cover border-2 border-[var(--border)] shadow-sm flex-shrink-0" 
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h6 className="font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                        <span className="text-lg">💡</span>
                        {idea.title}
                      </h6>
                      
                      {idea.notes && (
                        <p className="text-sm text-[var(--foreground-secondary)] mb-3 line-clamp-2">
                          {idea.notes}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-3 text-sm">
                        {idea.url && (
                          <a 
                            href={idea.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[var(--primary)] hover:text-[var(--primary-hover)] underline flex items-center gap-1"
                          >
                            <span>🔗</span> Voir le produit
                          </a>
                        )}
                        {typeof idea.priceCents === 'number' && (
                          <span className="bg-[var(--primary-light)] text-[var(--primary)] px-2 py-1 rounded-lg font-medium">
                            {(idea.priceCents / 100).toLocaleString(undefined, { 
                              style: 'currency', 
                              currency: 'EUR' 
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <Button 
                        onClick={() => setEditingIdea(idea)} 
                        size="sm" 
                        variant="ghost"
                      >
                        <span className="text-sm">✏️</span>
                      </Button>
                      <Button 
                        onClick={() => deleteIdea(idea.id)} 
                        size="sm" 
                        variant="danger"
                      >
                        <span className="text-sm">🗑️</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Idea Modal */}
      <Modal 
        open={!!editingIdea} 
        onClose={() => setEditingIdea(null)} 
        title="Modifier l'idée"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditingIdea(null)}>
              Annuler
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                if (editingIdea) {
                  const title = prompt('Nouveau nom:', editingIdea.title);
                  if (title) {
                    updateIdea(editingIdea.id, { title });
                    setEditingIdea(null);
                  }
                }
              }}
            >
              Modifier
            </Button>
          </div>
        }
      >
        {editingIdea && (
          <div className="space-y-4">
            <div>
              <strong>Nom actuel:</strong> {editingIdea.title}
            </div>
            <p className="text-[var(--foreground-secondary)]">
              Utilisez le bouton "Modifier" pour changer le nom de cette idée.
            </p>
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
    </div>
  );
}
