"use client";

import { useEffect, useState } from "react";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Modal from "@/app/components/ui/Modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { useToast } from "@/app/components/ui/ToastProvider";
import Link from "next/link";
import ButtonLink from "@/app/components/ui/ButtonLink";

type Group = { id: string; name: string; slug: string };
type Member = { userId: string; name: string; list: { id: string; title: string } | null };

export default function GroupsClient() {
  const [groups, setGroups] = useState<Group[]>([]);
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
    setLoading(true); 
    setError(null);
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
    setError(null); 
    setLoading(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: String(formData.get('name') || ''), 
          slug: String(formData.get('slug') || '') 
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erreur ${res.status}`);
      }
      await refreshGroups();
      success({ title: 'Groupe créé avec succès !' });
    } catch (e: any) {
      const msg = e.message || 'Erreur';
      setError(msg);
      toastError({ title: 'Erreur', description: msg });
    } finally { 
      setLoading(false); 
    }
  }

  async function loadMembers(groupId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setMembers(prev => ({ ...prev, [groupId]: data }));
    } catch (e) { /* ignore */ }
  }

  async function renameGroup(groupId: string) {
    const name = prompt('Nouveau nom du groupe ?');
    if (!name) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ name }) 
      });
      if (res.ok) {
        refreshGroups();
        success({ title: 'Groupe renommé !' });
      }
    } catch (e) {
      toastError({ title: 'Erreur', description: 'Impossible de renommer le groupe' });
    }
  }

  async function deleteGroup(groupId: string) {
    setConfirm({ 
      open: true, 
      title: 'Supprimer ce groupe et son contenu ?', 
      onYes: async () => {
        try {
          const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
          if (res.ok) { 
            await refreshGroups(); 
            success({ title: 'Groupe supprimé !' }); 
          }
        } catch (e) {
          toastError({ title: 'Erreur', description: 'Impossible de supprimer le groupe' });
        }
        setConfirm(null);
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Create Group Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">➕</span>
            Créer un nouveau groupe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createGroup} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input 
                name="name" 
                label="Nom du groupe" 
                placeholder="Famille Martin 2025" 
                required 
              />
              <Input 
                name="slug" 
                label="Identifiant unique" 
                placeholder="famille-martin-2025" 
              />
            </div>
            <Button type="submit" size="lg" disabled={loading} variant="secondary">
              <span className="text-lg">🎪</span>
              {loading ? 'Création...' : 'Créer le groupe'}
            </Button>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <span className="text-lg">⚠️</span> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Groups List */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
          <span className="text-2xl">👨‍👩‍👧‍👦</span>
          Vos groupes
        </h2>
        
        {loading && groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-[var(--foreground-secondary)]">Chargement de vos groupes...</p>
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                Aucun groupe pour l'instant
              </h3>
              <p className="text-[var(--foreground-secondary)]">
                Créez votre premier groupe familial ci-dessus !
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {groups.map(group => (
              <Card key={group.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🎪</span>
                        <CardTitle className="text-xl">{group.name}</CardTitle>
                      </div>
                      <div className="text-sm text-[var(--foreground-secondary)] bg-[var(--surface)] rounded-lg px-3 py-1 inline-block font-mono">
                        /{group.slug}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => loadMembers(group.id)} variant="primary" size="sm">
                      <span className="text-sm">👥</span> Voir les membres
                    </Button>
                    <ButtonLink href="/my-list" variant="accent" size="sm">
                      <span className="text-sm">📝</span> Ma liste
                    </ButtonLink>
                    <Button onClick={() => renameGroup(group.id)} variant="ghost" size="sm">
                      <span className="text-sm">✏️</span> Renommer
                    </Button>
                    <Button onClick={() => deleteGroup(group.id)} variant="danger" size="sm">
                      <span className="text-sm">🗑️</span> Supprimer
                    </Button>
                  </div>

                  {/* Members */}
                  {members[group.id] && (
                    <div className="border-t border-[var(--border)] pt-4">
                      <h5 className="font-semibold mb-3 flex items-center gap-2 text-[var(--foreground)]">
                        <span className="text-lg">👥</span>
                        Membres du groupe
                      </h5>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {members[group.id].map(member => (
                          <div key={member.userId} className="bg-[var(--surface)] rounded-lg p-3 border border-[var(--border)]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-xl">👤</div>
                                <div>
                                  <div className="font-medium text-[var(--foreground)]">{member.name}</div>
                                  <div className="text-sm text-[var(--foreground-secondary)]">
                                    {member.list ? `📝 ${member.list.title}` : '📝 Aucune liste'}
                                  </div>
                                </div>
                              </div>
                              {member.list && (
                                <ButtonLink href={`/list/${member.list.id}`} size="sm" variant="outline">
                                  <span className="text-sm">👀</span> Voir
                                </ButtonLink>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
