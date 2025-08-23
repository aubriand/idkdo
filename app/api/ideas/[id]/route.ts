import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

type UpdateIdeaBody = Partial<{
  title: string;
  url: string | null;
  notes: string | null;
  priceCents: number | null;
  image: string | null;
}>;

async function getIdeaAccess(userId: string, ideaId: string) {
  const idea = await prisma.idea.findUnique({ where: { id: ideaId }, select: { id: true, listId: true, createdById: true } });
  if (!idea) return { status: 404 as const };
  const list = await prisma.giftList.findUnique({ where: { id: idea.listId }, select: { ownerId: true } });
  if (!list) return { status: 404 as const };
  if (list.ownerId !== userId) return { status: 403 as const };
  return { status: 200 as const, idea };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { id } = await params;

  const access = await getIdeaAccess(session.user.id, id);
  if (access.status !== 200) return new Response(JSON.stringify({ error: access.status === 404 ? 'Not found' : 'Forbidden' }), { status: access.status });

  const raw: unknown = await req.json().catch(() => ({}));
  const body = (raw ?? {}) as Record<string, unknown>;
  const data: UpdateIdeaBody = {};
  if (typeof body.title === 'string') data.title = body.title.trim();
  if (typeof body.url === 'string' || body.url === null) data.url = (body.url as string | null) || null;
  if (typeof body.notes === 'string' || body.notes === null) data.notes = (body.notes as string | null) || null;
  if (body.priceCents === null) data.priceCents = null;
  else if (typeof body.priceCents === 'number') data.priceCents = body.priceCents;
  if (typeof body.image === 'string' || body.image === null) data.image = (body.image as string | null) || null;
  if (Object.keys(data).length === 0) return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400 });

  const updated = await prisma.idea.update({ where: { id }, data });
  return new Response(JSON.stringify(updated), { status: 200 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { id } = await params;

  const access = await getIdeaAccess(session.user.id, id);
  if (access.status !== 200) return new Response(JSON.stringify({ error: access.status === 404 ? 'Not found' : 'Forbidden' }), { status: access.status });

  // Only list owner can delete
  await prisma.idea.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
