"use client";

import { useEffect, useState } from "react";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Modal from "@/app/components/ui/Modal";
import { useToast } from "@/app/components/ui/ToastProvider";

type Group = { id: string; name: string; slug: string };
type GiftList = { id: string; title: string };
type Idea = { id: string; title: string; listId: string; url?: string | null; image?: string | null; priceCents?: number | null };
type Member = { userId: string; name: string; list: GiftList | null };

export default function GroupsClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [lists, setLists] = useState<Record<string, GiftList[]>>({});
  const [ideas, setIdeas] = useState<Record<string, Idea[]>>({});
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  // modal state
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; onYes: () => void } | null>(null);

  useEffect(() => {
    refreshGroups();
  }, []);

  async function refreshGroups() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/groups', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const data = await res.json();
  setGroups(data);
    } catch (e: any) {
  const msg = e.message || 'Erreur';
  setError(msg);
  toastError({ title: 'Erreur', description: msg });
    } finally {
      setLoading(false);
    }
  }

  async function createGroup(formData: FormData) {
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: String(formData.get('name') || ''), slug: String(formData.get('slug') || '') })
      });
  if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erreur ${res.status}`);
      }
      await refreshGroups();
  success({ title: 'Groupe créé' });
    } catch (e: any) {
  const msg = e.message || 'Erreur';
  setError(msg);
  toastError({ title: 'Erreur', description: msg });
    } finally { setLoading(false); }
  }

  async function loadLists(_groupId: string) {
    try {
      const res = await fetch(`/api/lists`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      // store under a fixed key since lists are per-user (single list)
      setLists(prev => ({ ...prev, ['me']: data }));
    } catch (e) { /* ignore for now */ }
  }  async function loadMembers(groupId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setMembers(prev => ({ ...prev, [groupId]: data }));
    } catch (e) { /* ignore */ }
  }

  async function createList(_groupId: string, formData: FormData) {
    // Lists are auto-created, this function is no longer needed
    await loadLists('me');
  }

  async function loadIdeas(listId: string) {
    try {
      const res = await fetch(`/api/ideas?listId=${encodeURIComponent(listId)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setIdeas(prev => ({ ...prev, [listId]: data }));
    } catch (e) { /* ignore */ }
  }

  async function createIdea(listId: string, formData: FormData) {
    try {
      const priceStr = String(formData.get('price') || '').trim();
      const priceCents = priceStr ? Math.round(parseFloat(priceStr.replace(',', '.')) * 100) : undefined;
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId,
          title: String(formData.get('title') || ''),
          url: String(formData.get('url') || ''),
          image: String(formData.get('image') || ''),
          notes: String(formData.get('notes') || ''),
          ...(priceCents !== undefined ? { priceCents } : {})
        })
      });
  if (!res.ok) throw new Error('Erreur de création d\'idée');
      await loadIdeas(listId);
  success({ title: 'Idée ajoutée' });
    } catch (e) { /* ignore */ }
  }

  // Updates / Deletes
  async function renameGroup(groupId: string) {
    const name = prompt('Nouveau nom du groupe ?');
    if (!name) return;
    const res = await fetch(`/api/groups/${groupId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    if (res.ok) refreshGroups();
  }
  async function deleteGroup(groupId: string) {
    setConfirm({ open: true, title: 'Supprimer ce groupe et son contenu ?', onYes: async () => {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (res.ok) { await refreshGroups(); success({ title: 'Groupe supprimé' }); }
      setConfirm(null);
    }});
  }
  async function renameList(listId: string) {
    const title = prompt('Nouveau titre de votre liste ?');
    if (!title) return;
    const res = await fetch(`/api/lists/${listId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    if (res.ok) {
      loadLists('me');
      success({ title: 'Liste renommée' });
    }
  }
  async function editIdea(ideaId: string, listId: string) {
    const title = prompt("Modifier l'idée");
    if (!title) return;
    const res = await fetch(`/api/ideas/${ideaId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    if (res.ok) loadIdeas(listId);
  }
  async function deleteIdea(ideaId: string, listId: string) {
    setConfirm({ open: true, title: 'Supprimer cette idée ?', onYes: async () => {
      const res = await fetch(`/api/ideas/${ideaId}`, { method: 'DELETE' });
      if (res.ok) { await loadIdeas(listId); success({ title: 'Idée supprimée' }); }
      setConfirm(null);
    }});
  }

  return (
  <div className="space-y-8">
  <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)]">
        <h4 className="font-bold mb-4 flex items-center gap-2 text-[var(--foreground)]">
          <span className="text-xl">➕</span>
          Créer un nouveau groupe familial
        </h4>
        <form action={createGroup} className="grid gap-4 md:grid-cols-3 md:items-end">
          <Input name="name" label="Nom du groupe" placeholder="Famille Martin 2025" required className="md:col-span-1" />
          <Input name="slug" label="Identifiant unique" placeholder="famille-martin-2025" className="md:col-span-1" />
          <Button type="submit" size="lg" className="md:col-span-1">
            <span className="text-lg">🎪</span>
            Créer
          </Button>
        </form>
        {error && (
          <div className="mt-4 p-3 bg-red-100 border-2 border-red-200 rounded-xl text-red-700 text-center">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}
      </div>

  <div>
        <h4 className="font-bold mb-6 flex items-center gap-2 text-2xl text-[var(--foreground)]">
          <span className="text-2xl">👨‍👩‍👧‍👦</span>
          Vos groupes familiaux
        </h4>
        {loading && groups.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-[var(--warm-gray)]">Chargement de vos groupes...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Aucun groupe pour l'instant</h3>
            <p className="text-[var(--warm-gray)]">Créez votre premier groupe familial ci-dessus !</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {groups.map(g => (
              <div key={g.id} className="bg-[var(--card-bg)] border-2 border-[var(--border)] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🎪</span>
                      <h3 className="text-xl font-bold text-[var(--foreground)]">{g.name}</h3>
                    </div>
                    <div className="text-sm text-[var(--warm-gray)] bg-[color-mix(in_srgb,var(--card-bg)_60%,transparent)] rounded-lg px-3 py-1 inline-block">
                      /{g.slug}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => loadLists('me')} variant="primary" size="sm">
                    <span className="text-sm">📝</span> Ma liste
                  </Button>
                  <Button onClick={() => loadMembers(g.id)} variant="secondary" size="sm">
                    <span className="text-sm">👥</span> Membres
                  </Button>
                  <Button onClick={() => renameGroup(g.id)} variant="ghost" size="sm">
                    <span className="text-sm">✏️</span> Renommer
                  </Button>
                  <Button onClick={() => deleteGroup(g.id)} variant="danger" size="sm">
                    <span className="text-sm">🗑️</span> Supprimer
                  </Button>
                </div>

                {/* User's personal list - auto-loaded */}
                {lists['me'] && (
                  <div className="mt-6 bg-[color-mix(in_srgb,var(--card-bg)_60%,transparent)] rounded-xl p-4 border border-[var(--border)]">
                    <h5 className="font-semibold mb-4 flex items-center gap-2 text-[var(--foreground)]">
                      <span className="text-lg">📝</span>
                      Ma liste personnelle
                    </h5>

                    <div className="space-y-3">
                      {lists['me'].map(l => (
                        <div key={l.id} className="bg-[var(--card-bg)] rounded-xl p-4 border-2 border-[var(--border)] shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h6 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                              <span className="text-lg">🎁</span>
                              {l.title}
                            </h6>
                            <div className="flex gap-2">
                              <Button onClick={() => loadIdeas(l.id)} variant="primary" size="sm">
                                <span className="text-sm">👀</span> Gérer mes idées
                              </Button>
                              <Button onClick={() => renameList(l.id)} variant="ghost" size="sm">
                                <span className="text-sm">✏️</span>
                              </Button>
                            </div>
                          </div>
                          
                          {ideas[l.id] && (
                            <div className="space-y-4">
                              <form onSubmit={async (e) => { e.preventDefault(); await createIdea(l.id, new FormData(e.currentTarget)); e.currentTarget.reset(); }} className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">
                                <h6 className="font-medium mb-3 text-[var(--foreground)]">
                                  ➕ Ajouter une nouvelle idée
                                </h6>
                                <div className="grid gap-3">
                                  <div className="grid md:grid-cols-2 gap-3">
                                    <Input name="title" label="Nom de l'idée" placeholder="Montre connectée" required />
                                    <Input name="url" label="Lien (optionnel)" placeholder="https://…" />
                                  </div>
                                  <div className="grid md:grid-cols-2 gap-3">
                                    <Input name="image" label="Image (URL)" placeholder="https://…/photo.jpg" />
                                    <Input name="price" label="Prix estimé" placeholder="49.99" prefix="€" />
                                  </div>
                                  <Input name="notes" label="Notes / Détails" placeholder="Taille M, couleur bleue..." />
                                  <Button type="submit" variant="primary" size="sm" className="justify-self-start">
                                    <span className="text-lg">✨</span> Ajouter l'idée
                                  </Button>
                                </div>
                              </form>
                              
                              <div className="space-y-3">
                                {ideas[l.id].map(it => (
                                  <div key={it.id} className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border)] hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-4">
                                      {it.image && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={it.image} alt="" className="h-16 w-16 rounded-xl object-cover border-2 border-[var(--border)] shadow-sm" />
                                      )}
                                      <div className="flex-1">
                                        <h6 className="font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                                          <span className="text-lg">💡</span>
                                          {it.title}
                                        </h6>
                                        <div className="flex flex-wrap gap-3 text-sm">
                                          {it.url && (
                                            <a href={it.url} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline flex items-center gap-1">
                                              <span>🔗</span> Voir le produit
                                            </a>
                                          )}
                                          {typeof it.priceCents === 'number' && (
                                            <span className="bg-[var(--accent-light)] text-[var(--accent)] px-2 py-1 rounded-lg font-medium">
                                              {(it.priceCents / 100).toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button onClick={() => editIdea(it.id, l.id)} size="sm" variant="ghost">
                                          <span className="text-sm">✏️</span>
                                        </Button>
                                        <Button onClick={() => deleteIdea(it.id, l.id)} size="sm" variant="danger">
                                          <span className="text-sm">🗑️</span>
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members with their lists */}
                {members[g.id] && (
                  <div className="mt-6 bg-[color-mix(in_srgb,var(--card-bg)_60%,transparent)] rounded-xl p-4 border border-[var(--border)]">
                    <h5 className="font-semibold mb-4 flex items-center gap-2 text-[var(--foreground)]">
                      <span className="text-lg">👥</span>
                      Membres du groupe
                    </h5>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {members[g.id].map(m => (
                        <div key={m.userId} className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border)] shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">👤</div>
                              <div>
                                <div className="font-semibold text-[var(--foreground)]">{m.name}</div>
                                <div className="text-sm text-[var(--warm-gray)]">
                                  {m.list ? `📝 ${m.list.title}` : '📝 Aucune liste'}
                                </div>
                              </div>
                            </div>
                            {m.list && (
                              <Button onClick={() => loadIdeas(m.list!.id)} size="sm" variant="secondary">
                                <span className="text-sm">👀</span> Voir
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!confirm?.open} onClose={() => setConfirm(null)} title={confirm?.title} footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setConfirm(null)}>Annuler</Button>
          <Button variant="danger" onClick={() => confirm?.onYes()}>Supprimer</Button>
        </div>
      }>
  <p className="text-sm text-[var(--foreground-secondary)]">Cette action est irréversible.</p>
      </Modal>
    </div>
  );
}
