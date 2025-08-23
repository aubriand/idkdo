import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { group: { select: { id: true, name: true, slug: true } } },
  });
  const now = new Date();
  if (!invite || !invite.active || (invite.expiresAt && invite.expiresAt < now) || invite.usedAt) {
    return new Response(JSON.stringify({ error: 'Invalid invite' }), { status: 404 });
  }
  return new Response(JSON.stringify({ group: invite.group }), { status: 200 });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { token } = await params;
  const invite = await prisma.invitation.findUnique({ where: { token } });
  const now = new Date();
  if (!invite || !invite.active || (invite.expiresAt && invite.expiresAt < now) || invite.usedAt) {
    return new Response(JSON.stringify({ error: 'Invalid invite' }), { status: 404 });
  }

  // create membership if not exists
  await prisma.membership.upsert({
    where: { userId_groupId: { userId: session.user.id, groupId: invite.groupId } },
    create: { userId: session.user.id, groupId: invite.groupId, role: 'member' },
    update: {},
  });
  // mark invite used
  await prisma.invitation.update({
    where: { token },
    data: { active: false, usedAt: now, usedById: session.user.id },
  });
  return new Response(JSON.stringify({ joined: true, groupId: invite.groupId }), { status: 200 });
}
