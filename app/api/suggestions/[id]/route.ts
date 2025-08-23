import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '').toLowerCase(); // 'accept' | 'reject'

  const s = await prisma.suggestion.findUnique({ where: { id }, select: { id: true, listId: true, title: true, url: true, notes: true, priceCents: true, image: true, status: true, createdById: true } });
  if (!s) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  const list = await prisma.giftList.findUnique({ where: { id: s.listId }, select: { ownerId: true } });
  if (!list || list.ownerId !== session.user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  if (action === 'reject') {
    const updated = await prisma.suggestion.update({ where: { id }, data: { status: 'rejected' } });
    return new Response(JSON.stringify(updated), { status: 200 });
  }
  if (action === 'accept') {
    const idea = await prisma.idea.create({
      data: {
        title: s.title,
        url: s.url,
        notes: s.notes,
        priceCents: s.priceCents,
        image: s.image,
        createdById: session.user.id,
        listId: s.listId,
      },
      select: { id: true },
    });
    await prisma.suggestion.update({ where: { id }, data: { status: 'accepted' } });
    // Notify the suggester that their idea was accepted
    try {
      if (s.createdById && s.createdById !== session.user.id) {
        const { sendPushToUser } = await import('@/app/lib/notify')
        await sendPushToUser(s.createdById, { title: 'Suggestion acceptée', body: `${session.user.name || 'Le propriétaire'} a accepté votre idée` })
      }
    } catch {}
    return new Response(JSON.stringify({ accepted: true, ideaId: idea.id }), { status: 200 });
  }
  return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
}
