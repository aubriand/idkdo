import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';

// Create a suggestion to someone else's list
export async function POST(req: Request) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { listId, title, url, notes, priceCents, image } = body || {};
  if (!listId || !(title && String(title).trim())) return new Response(JSON.stringify({ error: 'listId and title required' }), { status: 400 });

  const list = await prisma.giftList.findUnique({ where: { id: listId }, select: { ownerId: true } });
  if (!list) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (list.ownerId === session.user.id) return new Response(JSON.stringify({ error: 'Cannot suggest to your own list' }), { status: 400 });

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

  const s = await prisma.suggestion.create({
    data: {
      listId,
      title: String(title).trim(),
      url: url ? String(url) : null,
      notes: notes ? String(notes) : null,
      priceCents: priceCents != null ? Number(priceCents) : null,
      image: image ? String(image) : null,
      createdById: session.user.id,
    },
  });
  return new Response(JSON.stringify(s), { status: 201 });
}
