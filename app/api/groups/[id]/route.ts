import { headers } from 'next/headers';
import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import type { NextRequest } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { id } = await params;
  const group = await prisma.group.findUnique({ where: { id }, select: { id: true, ownerId: true, slug: true } });
  if (!group) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (group.ownerId !== session.user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;
  let slug = typeof body.slug === 'string' ? body.slug.trim() : undefined;

  if (slug == null && typeof name === 'string' && name.length > 0) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const data: { name?: string; slug?: string } = {};
  if (name && name.length > 0) data.name = name;
  if (slug && slug !== group.slug) {
    const existing = await prisma.group.findUnique({ where: { slug } });
    if (existing && existing.id !== group.id) {
      return new Response(JSON.stringify({ error: 'Slug already in use' }), { status: 409 });
    }
    data.slug = slug;
  }

  const updated = await prisma.group.update({ where: { id: group.id }, data });
  return new Response(JSON.stringify(updated), { status: 200 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { id } = await params;
  const group = await prisma.group.findUnique({ where: { id }, select: { id: true, ownerId: true } });
  if (!group) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (group.ownerId !== session.user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  // Delete memberships explicitly to satisfy FK constraints, invitations cascade via schema
  await prisma.membership.deleteMany({ where: { groupId: group.id } });
  await prisma.group.delete({ where: { id: group.id } });

  return new Response(null, { status: 204 });
}

