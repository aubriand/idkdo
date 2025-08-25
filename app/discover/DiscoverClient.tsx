"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import ButtonLink from "@/app/components/ui/ButtonLink";

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
  // Chargement des groupes
  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await fetch('/api/groups', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      return await res.json();
    }
  });

  if (loadingGroups) {
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
      {groups.map((group: Group) => (
        <GroupWithMembers key={group.id} group={group} />
      ))}
    </div>
  );
}

function GroupWithMembers({ group }: { group: Group }) {
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['group-members', group.id],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${group.id}/members`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      return await res.json();
    },
    enabled: !!group.id
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">🎪</span>
          {group.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loadingMembers ? (
          <div className="text-center py-4">Chargement des membres...</div>
        ) : (
          <div className="space-y-6">
            {members.filter((member: Member) => member.list)
              .map((member: Member) => (
                <MemberWithIdeas key={member.userId} member={member} />
              ))}
            {members.filter((m: Member) => m.list).length === 0 && (
              <div className="text-[var(--foreground-secondary)] text-sm">Aucun membre avec une liste dans ce groupe.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MemberWithIdeas({ member }: { member: Member }) {
  const { data: ideas = [], isLoading: loadingIdeas } = useQuery({
    queryKey: ['list-ideas', member.list!.id],
    queryFn: async () => {
      const res = await fetch(`/api/ideas?listId=${encodeURIComponent(member.list!.id)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      return await res.json();
    },
    enabled: !!member.list?.id
  });

  return (
    <div className="border border-[var(--border)] rounded-lg p-4">
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
          variant="secondary" 
          size="sm"
          disabled
        >
          <span className="text-sm">👀</span> Voir la liste
        </Button>
      </div>
      {/* Show ideas if loaded */}
      {loadingIdeas ? (
        <div className="text-center py-4">Chargement des idées...</div>
      ) : (
        <div className="border-t border-[var(--border)] pt-4">
          <h5 className="font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
            <span className="text-lg">💡</span>
            Idées de cadeaux ({ideas.length})
          </h5>
          {ideas.length === 0 ? (
            <p className="text-[var(--foreground-secondary)] text-center py-4">
              Aucune idée dans cette liste pour le moment.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ideas.map((idea: Idea) => (
                <div key={idea.id} className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--border)]">
                  <div className="flex items-start gap-3">
                    {idea.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={idea.image} 
                        alt="" 
                        className="h-16 w-16 rounded-xl object-cover border-2 border-[var(--border)] shadow-sm flex-shrink-0" 
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h6 className="font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                        <span className="text-lg">💡</span>
                        {idea.title}
                      </h6>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}