import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import Header from '@/app/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import ButtonLink from '@/app/components/ui/ButtonLink';
import InviteCopyButton from '@/app/components/InviteCopyButton';
import OwnerActions from './OwnerActions';
import { createMetadata } from '@/app/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // minimal metadata; title will be finalized server-side after query if desired
  return createMetadata({
    title: 'Groupe — IDKDO',
    description: 'Détails du groupe',
    path: `/groups/${params.id}`,
  });
}

export default async function GroupDetailsPage({ params }: { params: { id: string } }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) redirect('/');
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: { memberships: { include: { user: { select: { id: true, name: true, giftList: { select: { id: true, title: true } } } } } } }
  });
  if (!group) return notFound();

  const isMember = group.ownerId === session.user.id || group.memberships.some(m => m.userId === session.user.id);
  if (!isMember) return notFound();

  const isOwner = group.ownerId === session.user.id;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><span>🎪</span> {group.name}</CardTitle>
              <div className="flex gap-2 items-center">
                {isOwner && <OwnerActions groupId={group.id} initialName={group.name} />}
                <InviteCopyButton groupId={group.id} />
                <ButtonLink href="/groups" variant="outline" size="sm">Retour</ButtonLink>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-[var(--foreground-secondary)]">
                {group.memberships.length} membre{group.memberships.length > 1 ? 's' : ''}
              </div>
              <div className="text-sm text-[var(--foreground-secondary)]">
                Groupe créé le {group.createdAt.toLocaleDateString()} par {group.memberships.filter(m => m.userId === group.ownerId)[0]?.user.name || 'un membre'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membres</CardTitle>
            </CardHeader>
            <CardContent>
              {group.memberships.length === 0 ? (
                <div className="text-[var(--foreground-secondary)] text-sm">Aucun membre.</div>
              ) : (
                <ul className="flex flex-col">
                  {group.memberships.map((m) => (
                    <li key={m.user.id} className="bg-[var(--surface)] rounded-lg p-3 border border-[var(--border)] flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--foreground)] truncate">{m.user.name}</div>
                        <div className="text-sm text-[var(--foreground-secondary)] truncate">{m.user.giftList ? `📝 ${m.user.giftList.title}` : '📝 Aucune liste'}</div>
                      </div>
                      {m.user.giftList && (
                        <ButtonLink href={`/list/${m.user.giftList.id}`} size="sm" variant="secondary">Voir la liste</ButtonLink>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
