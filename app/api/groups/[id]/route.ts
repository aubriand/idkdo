import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;
  const slugRaw = typeof body.slug === 'string' ? body.slug.trim() : undefined;
  const slug = slugRaw ? slugRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;

  // owner-only
  const group = await prisma.group.findUnique({ where: { id }, select: { id: true, ownerId: true, slug: true } });
  if (!group) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (group.ownerId !== session.user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  if (!name && !slug) return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400 });
  if (slug) {
    const exists = await prisma.group.findUnique({ where: { slug } });
    if (exists && exists.id !== id) return new Response(JSON.stringify({ error: 'Slug already in use' }), { status: 409 });
  }

  const updated = await prisma.group.update({ where: { id }, data: { ...(name ? { name } : {}), ...(slug ? { slug } : {}) } });
  return new Response(JSON.stringify(updated), { status: 200 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { id } = await params;

  const group = await prisma.group.findUnique({ where: { id }, select: { id: true, ownerId: true } });
  if (!group) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (group.ownerId !== session.user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  // Manually cascade: delete ideas -> lists -> memberships -> group
  await prisma.$transaction(async (tx) => {
  // Lists are now per-user, not per-group; no list deletion here
    await tx.membership.deleteMany({ where: { groupId: id } });
    await tx.group.delete({ where: { id } });
  });

  return new Response(null, { status: 204 });
}
