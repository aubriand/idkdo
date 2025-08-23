import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';

// Toggle a secret claim for the current user on the idea
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { id } = await params;
  const claim = await prisma.claim.findFirst({ where: { ideaId: id, userId: session.user.id } });
  return new Response(JSON.stringify({ claimed: !!claim }), { status: 200 });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { id } = await params;

  // Ensure requester and idea owner share a group (and it's not their own idea/list)
  const idea = await prisma.idea.findUnique({ where: { id }, select: { id: true, listId: true } });
  if (!idea) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  const list = await prisma.giftList.findUnique({ where: { id: idea.listId }, select: { ownerId: true } });
  if (!list) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (list.ownerId === session.user.id) return new Response(JSON.stringify({ error: 'Cannot claim own list' }), { status: 400 });

  const shared = await prisma.group.findFirst({
    where: {
      AND: [
        { memberships: { some: { userId: session.user.id } } },
        { memberships: { some: { userId: list.ownerId } } },
      ],
    },
    select: { id: true },
  });
  if (!shared) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const existing = await prisma.claim.findFirst({ where: { ideaId: id, userId: session.user.id } });
  if (existing) {
    await prisma.claim.delete({ where: { id: existing.id } });
    return new Response(JSON.stringify({ claimed: false }), { status: 200 });
  }
  await prisma.claim.create({ data: { ideaId: id, userId: session.user.id } });
  return new Response(JSON.stringify({ claimed: true }), { status: 201 });
}
