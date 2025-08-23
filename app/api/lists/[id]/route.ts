import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

async function isOwner(userId: string, listId: string) {
  const list = await prisma.giftList.findUnique({ where: { id: listId }, select: { ownerId: true } });
  if (!list) return { ok: false as const, status: 404 };
  if (list.ownerId !== userId) return { ok: false as const, status: 403 };
  return { ok: true as const };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim() : undefined;
  const description = typeof body.description === 'string' ? body.description : undefined;
  if (!title && description === undefined) return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400 });

  const access = await isOwner(session.user.id, id);
  if (!('ok' in access && access.ok)) return new Response(JSON.stringify({ error: access.status === 404 ? 'Not found' : 'Forbidden' }), { status: access.status });

  const updated = await prisma.giftList.update({ where: { id }, data: { ...(title ? { title } : {}), ...(description !== undefined ? { description } : {}) } });
  return new Response(JSON.stringify(updated), { status: 200 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { id } = await params;

  const access = await isOwner(session.user.id, id);
  if (!('ok' in access && access.ok)) return new Response(JSON.stringify({ error: access.status === 404 ? 'Not found' : 'Forbidden' }), { status: access.status });

  await prisma.$transaction([
    prisma.idea.deleteMany({ where: { listId: id } }),
    prisma.giftList.delete({ where: { id } })
  ]);
  return new Response(null, { status: 204 });
}
