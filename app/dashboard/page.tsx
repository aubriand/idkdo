import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { api } from '../lib/auth';
import { prisma } from '../lib/prisma';
import SessionClient from './SessionClient';
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import ListItemCard from "../components/ListItemCard";
import Link from 'next/link';
import ButtonLink from '../components/ui/ButtonLink';
import ClaimButton from "../components/ClaimButton";

export default async function DashboardPage() {
  try {
    const session = await api.getSession({ 
      headers: await headers()
    });
    if (!session) redirect('/');

    // Ensure the user's list exists, then fetch latest items
    let myList = await prisma.giftList.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true, title: true },
    });
    if (!myList) {
      myList = await prisma.giftList.create({
        data: {
          title: `🎁 Liste de ${session.user.name || 'mes envies'}`,
          ownerId: session.user.id,
        },
        select: { id: true, title: true },
      });
    }

    const myIdeas = await prisma.idea.findMany({
      where: { listId: myList.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, title: true, url: true, priceCents: true, image: true, createdAt: true },
    });

    // Groups (owned or member)
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { memberships: { some: { userId: session.user.id } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { memberships: true } } },
    });

    // Other members' recent ideas (people who share a group with me)
    const groupIds = groups.map((g) => g.id);
    let othersRecent: Array<{
      id: string;
      title: string;
      image: string | null;
      url: string | null;
      priceCents: number | null;
      createdAt: Date;
      listId: string;
      ownerName: string | null;
      ownerImage: string | null;
      claimsCount?: number | null;
    }> = [];
    if (groupIds.length) {
      const memberUserIdsRows = await prisma.membership.findMany({
        where: { groupId: { in: groupIds } },
        select: { userId: true },
      });
      const otherUserIds = Array.from(new Set(memberUserIdsRows.map((m) => m.userId).filter((id) => id !== session.user.id)));
      if (otherUserIds.length) {
        const lists = await prisma.giftList.findMany({
          where: { ownerId: { in: otherUserIds } },
          select: { id: true, owner: { select: { name: true, image: true, id: true } } },
        });
        const listIdToOwner = new Map(lists.map((l) => [l.id, l.owner] as const));
        if (lists.length) {
          const ideas = await prisma.idea.findMany({
            where: { listId: { in: lists.map((l) => l.id) } },
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: { id: true, title: true, url: true, priceCents: true, image: true, createdAt: true, listId: true, _count: { select: { claims: true } } },
          });
          othersRecent = ideas.map((i) => {
            const owner = listIdToOwner.get(i.listId)!;
            return {
              id: i.id,
              title: i.title,
              image: i.image ?? null,
              url: i.url ?? null,
              priceCents: i.priceCents ?? null,
              createdAt: i.createdAt,
        listId: i.listId,
              ownerName: owner?.name ?? null,
              ownerImage: owner?.image ?? null,
              claimsCount: (i as { _count?: { claims?: number } })._count?.claims ?? 0,
            };
          });
        }
      }
    }

    const formatPrice = (cents: number | null | undefined) => {
      if (cents == null) return null;
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    };

    return (
  <div className="min-h-screen">
        <Header />
        <main className="container py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Heading */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">Bonjour {session.user.name || '👋'}</h1>
                <p className="text-[var(--foreground-secondary)]">Un aperçu rapide de vos listes et groupes</p>
              </div>
              <ButtonLink href="/my-list" size="sm" variant="secondary">Voir ma liste</ButtonLink>
            </div>

            {/* Main content */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left: My latest ideas */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><span>🎁</span> Mes dernières idées</CardTitle>
                    <ButtonLink href="/my-list" size="sm" variant="outline">Tout voir</ButtonLink>
                  </CardHeader>
                  <CardContent>
                    {myIdeas.length === 0 ? (
                      <div className="text-[var(--foreground-secondary)] text-sm">Aucune idée pour le moment. Ajoutez votre première idée dans &quot;Ma liste&quot;.</div>
                    ) : (
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {myIdeas.map((i) => (
                          <li key={i.id}>
                            <ListItemCard item={{ id: i.id, title: i.title, image: i.image ?? null, url: i.url ?? null, priceCents: i.priceCents ?? null, createdAt: i.createdAt }} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><span>🧑‍🤝‍🧑</span> Idées des proches</CardTitle>
                    <ButtonLink href="/discover" size="sm" variant="outline">Découvrir</ButtonLink>
                  </CardHeader>
                  <CardContent>
                    {othersRecent.length === 0 ? (
                      <div className="text-[var(--foreground-secondary)] text-sm">Rien à afficher pour l’instant. Rejoignez un groupe pour voir les idées des autres.</div>
                    ) : (
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {othersRecent.map((i) => (
                          <li key={i.id} className="space-y-2">
                            <ListItemCard item={{ id: i.id, title: i.title, image: i.image ?? null, url: i.url ?? null, priceCents: i.priceCents ?? null, createdAt: i.createdAt, ownerName: i.ownerName ?? null, claimsCount: i.claimsCount ?? 0 }} />
                            <div className="flex items-center justify-between">
                              <ClaimButton ideaId={i.id} />
                              <ButtonLink href={`/list/${i.listId}`} size="sm" variant="secondary">Voir la liste</ButtonLink>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Profile and Groups */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><span>👤</span> Mon profil</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SessionClient />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><span>👥</span> Mes groupes</CardTitle>
                    <ButtonLink href="/groups" size="sm" variant="outline">Gérer</ButtonLink>
                  </CardHeader>
                  <CardContent>
                    {groups.length === 0 ? (
                      <div className="text-[var(--foreground-secondary)] text-sm">Aucun groupe. Créez-en un pour partager vos listes.</div>
                    ) : (
                      <ul className="space-y-2">
                        {groups.slice(0, 6).map((g) => (
                          <li key={g.id} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2">
                            <div className="min-w-0">
                              <div className="text-[var(--foreground)] truncate">{g.name}</div>
                              <div className="text-xs text-[var(--foreground-secondary)]">{g._count.memberships} membre{g._count.memberships > 1 ? 's' : ''}</div>
                            </div>
                            <ButtonLink href={`/groups`} size="sm" variant="ghost">Ouvrir</ButtonLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    redirect('/');
  }
}
