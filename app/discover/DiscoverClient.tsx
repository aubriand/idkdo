"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import ButtonLink from "@/app/components/ui/ButtonLink";
import Link from 'next/link';
import IdeaCard from '../components/IdeaCard';
import { GiftList, Group, Idea, Membership } from '@/generated/prisma';
import { authClient } from '../lib/auth-client';

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

type Member = Membership & { list: GiftList & { items: Idea[] }, name: string };
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

  const session = authClient.useSession();
  // Ne pas afficher l'utilisateur courant
  const filteredMembers = members.filter((member: Member) => member.userId !== session?.data?.user.id);
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
            {filteredMembers.filter((member: Member) => member.list)
              .map((member: Member) => (
                <MemberWithIdeas key={member.userId} member={member} />
              ))}
            {filteredMembers.filter((m: Member) => m.list).length === 0 && (
              <div className="text-[var(--foreground-secondary)] text-sm">Aucun membre avec une liste dans ce groupe.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MemberWithIdeas({ member }: { member: Member }) {

  if (!member.list) {
    return null;
  }

  return (
    <div className="border border-[var(--border)] rounded-lg p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👤</span>
          <div>
            <h4 className="font-semibold text-[var(--foreground)]">{member.name}</h4>
            <p className="text-sm text-[var(--foreground-secondary)]">
              📝 {member.list?.title}
            </p>
          </div>
        </div>
        <Link
          href={`/list/${member.list.id}`}
          className='self-end mt-4 md:mt-0'
        >
          <Button variant="secondary" size="sm">
            <span className="text-sm">👀</span> Voir la liste
          </Button>
        </Link>
      </div>
      {/* Show ideas if loaded */}
      <div className="border-t border-[var(--border)] pt-4">
        <h5 className="font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
          <span className="text-lg">💡</span>
          Les dernières idées
        </h5>
        {member.list.items.length === 0 ? (
          <p className="text-[var(--foreground-secondary)] text-center py-4">
            Aucune idée dans cette liste pour le moment.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {member.list.items.map((idea: Idea) => (
              <IdeaCard 
                key={idea.id}
                idea={idea}
                showClaimButton={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}