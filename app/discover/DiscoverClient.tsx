"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import ButtonLink from "@/app/components/ui/ButtonLink";
import Link from "next/link";

type Group = { id: string; name: string; slug: string };
type Member = { 
  userId: string; 
  name: string; 
  list: { id: string; title: string } | null 
};
type Idea = { 
  id: string; 
  title: string; 
  url?: string | null; 
  image?: string | null; 
  priceCents?: number | null;
  notes?: string | null;
};

export default function DiscoverClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [ideas, setIdeas] = useState<Record<string, Idea[]>>({});
  const [loading, setLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/groups', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: Group[] = await res.json();
      setGroups(data);
      // Load members for each group
      for (const group of data) {
        // fire and forget
        void loadMembers(group.id);
      }
    } catch (e: unknown) {
      console.error('Error loading groups:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  

  async function loadMembers(groupId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: Member[] = await res.json();
      setMembers(prev => ({ ...prev, [groupId]: data }));
    } catch (e: unknown) {
      console.error('Error loading members:', e);
    }
  }

  async function loadIdeas(listId: string) {
    try {
      const res = await fetch(`/api/ideas?listId=${encodeURIComponent(listId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: Idea[] = await res.json();
      setIdeas(prev => ({ ...prev, [listId]: data }));
    } catch (e: unknown) {
      console.error('Error loading ideas:', e);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-[var(--foreground-secondary)]">Chargement des groupes...</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Aucun groupe trouvé
          </h3>
          <p className="text-[var(--foreground-secondary)] mb-4">
            Vous devez faire partie d&apos;un groupe pour découvrir les listes des autres membres.
          </p>
          <ButtonLink href="/groups" variant="accent">
            <span className="text-lg">➕</span>
            Créer ou rejoindre un groupe
          </ButtonLink>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(group => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🎪</span>
              {group.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members[group.id] ? (
              <div className="space-y-6">
                {members[group.id]
                  .filter(member => member.list) // Only show members with lists
                  .map(member => (
                    <div key={member.userId} className="border border-[var(--border)] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">👤</span>
                          <div>
                            <h4 className="font-semibold text-[var(--foreground)]">{member.name}</h4>
                            <p className="text-sm text-[var(--foreground-secondary)]">
                              📝 {member.list?.title}
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => member.list && loadIdeas(member.list.id)} 
                          variant="secondary" 
                          size="sm"
                        >
                          <span className="text-sm">👀</span> Voir la liste
                        </Button>
                      </div>

                      {/* Show ideas if loaded */}
                      {member.list && ideas[member.list.id] && (
                        <div className="border-t border-[var(--border)] pt-4">
                          <h5 className="font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                            <span className="text-lg">💡</span>
                            Idées de cadeaux ({ideas[member.list.id].length})
                          </h5>
                          
                          {ideas[member.list.id].length === 0 ? (
                            <p className="text-[var(--foreground-secondary)] text-center py-4">
                              Aucune idée dans cette liste pour le moment.
                            </p>
                          ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {ideas[member.list.id].map(idea => (
                                <div key={idea.id} className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--border)]">
                                  <div className="flex items-start gap-3">
                                    {idea.image && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img 
                                        src={idea.image} 
                                        alt="" 
                                        className="h-12 w-12 rounded-lg object-cover border border-[var(--border)] flex-shrink-0" 
                                      />
                                    )}
                                    
                                    <div className="flex-1 min-w-0">
                                      <h6 className="font-medium text-[var(--foreground)] mb-1 truncate">
                                        {idea.title}
                                      </h6>
                                      
                                      {idea.notes && (
                                        <p className="text-xs text-[var(--foreground-secondary)] mb-2 line-clamp-2">
                                          {idea.notes}
                                        </p>
                                      )}
                                      
                                      <div className="flex flex-wrap gap-2 text-xs">
                                        {idea.url && (
                                          <a 
                                            href={idea.url} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-[var(--primary)] hover:text-[var(--primary-hover)] underline flex items-center gap-1"
                                          >
                                            <span>🔗</span> Lien
                                          </a>
                                        )}
                                        {typeof idea.priceCents === 'number' && (
                                          <span className="bg-[var(--accent-light)] text-[var(--accent)] px-2 py-1 rounded font-medium">
                                            {(idea.priceCents / 100).toLocaleString(undefined, { 
                                              style: 'currency', 
                                              currency: 'EUR' 
                                            })}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                
                {members[group.id].filter(m => m.list).length === 0 && (
                  <p className="text-[var(--foreground-secondary)] text-center py-6">
                    Aucun membre n&apos;a encore créé de liste dans ce groupe.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-2xl mb-2">⏳</div>
                <p className="text-[var(--foreground-secondary)]">Chargement des membres...</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
