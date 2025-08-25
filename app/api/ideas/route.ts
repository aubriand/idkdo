import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';

export async function GET(req: Request) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const url = new URL(req.url);
  const listId = url.searchParams.get('listId');
  if (!listId) return new Response(JSON.stringify({ error: 'listId required' }), { status: 400 });

  const list = await prisma.giftList.findUnique({ where: { id: listId }, select: { ownerId: true } });
  if (!list) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  // Access rule: you can view your own list, or if you share at least one group with the list owner
  if (list.ownerId !== session.user.id) {
    const sharedGroup = await prisma.group.findFirst({
      where: {
        OR: [
          { memberships: { some: { userId: session.user.id } } },
          { ownerId: session.user.id }
        ],
        memberships: { some: { userId: list.ownerId } }
      },
      select: { id: true }
    });
    if (!sharedGroup) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const ideas = await prisma.idea.findMany({ where: { listId, hiddenForOwner: list.ownerId !== session.user.id } });
  return new Response(JSON.stringify(ideas), { status: 200 });
}

export async function POST(req: Request) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = (body.title || '').trim();
  const listId = body.listId;
  if (!title || !listId) return new Response(JSON.stringify({ error: 'title and listId required' }), { status: 400 });

  const list = await prisma.giftList.findUnique({ where: { id: listId }, select: { ownerId: true } });
  if (!list) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  let hiddenForOwner = false;
  if (list.ownerId !== session.user.id) {
    // Vérifier que l'utilisateur et le propriétaire partagent un groupe
    const shared = await prisma.group.findFirst({
      where: {
        memberships: {
          some: { userId: session.user.id },
        },
        AND: [
          { memberships: { some: { userId: list.ownerId } } },
        ],
      },
      select: { id: true },
    });
    if (!shared) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    hiddenForOwner = true;
  }

  const idea = await prisma.idea.create({
    data: {
      title,
      url: body.url || null,
      notes: body.notes || null,
      priceCents: body.priceCents ? Number(body.priceCents) : null,
      image: body.image || null,
      createdById: session.user.id,
      listId,
      hiddenForOwner,
    }
  });

  return new Response(JSON.stringify(idea), { status: 201 });
}
