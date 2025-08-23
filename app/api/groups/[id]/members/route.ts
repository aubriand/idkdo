import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { id } = await params;

  // Ensure access to the group
  const canAccess = await prisma.group.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } }
      ]
    },
    select: { id: true }
  });
  if (!canAccess) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const members = await prisma.membership.findMany({
    where: { groupId: id },
    include: { user: { select: { id: true, name: true, giftList: { select: { id: true, title: true } } } } }
  });

  const payload = members.map(m => ({
    userId: m.user.id,
    name: m.user.name,
    list: m.user.giftList ? { id: m.user.giftList.id, title: m.user.giftList.title } : null
  }));

  return new Response(JSON.stringify(payload), { status: 200 });
}
