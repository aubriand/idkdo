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
  if (!invite || !invite.active) {
    return new Response(JSON.stringify({ error: 'Invalid invite' }), { status: 404 });
  }
  return new Response(JSON.stringify({ group: invite.group }), { status: 200 });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await api.getSession({ headers: _req.headers });
  console.log(session)
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { token } = await params;
  const invite = await prisma.invitation.findUnique({ where: { token } });
  if (!invite || !invite.active) {
    return new Response(JSON.stringify({ error: 'Invalid invite' }), { status: 404 });
  }

  // Check if user is already a member
  const existingMembership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: invite.groupId } }
  });
  
  if (existingMembership) {
    return new Response(JSON.stringify({ error: 'Already a member' }), { status: 409 });
  }

  await prisma.group.update({
    where: { id: invite.groupId },
    data: { memberships: { create: { userId: session.user.id, role: 'member' } } }
  });

  // Notify group owner and existing members (excluding the joiner)
  try {
    const group = await prisma.group.findUnique({ where: { id: invite.groupId }, select: { name: true, ownerId: true, memberships: { select: { userId: true } } } })
    if (group) {
      const recipients = Array.from(new Set([group.ownerId, ...group.memberships.map(m => m.userId)])).filter(id => id !== session.user.id)
      if (recipients.length) {
        const { sendPushToUsers } = await import('@/app/lib/notify')
        await sendPushToUsers(recipients, { title: 'Nouveau membre', body: `${session.user.name || 'Quelqu\'un'} a rejoint \u00ab ${group.name} \u00bb` })
      }
    }
  } catch {}
  return new Response(JSON.stringify({ joined: true, groupId: invite.groupId }), { status: 200 });
}
