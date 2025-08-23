import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { id } = await params;

  // allow any member or owner to generate invite
  const canCreate = await prisma.group.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
    select: { id: true },
  });
  if (!canCreate) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const token = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invite = await prisma.invitation.create({
    data: { token, groupId: id, createdById: session.user.id, expiresAt },
  });

  const h = await headers();
  const proto = (h.get('x-forwarded-proto') ?? 'http');
  const host = h.get('host');
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? (host ? `${proto}://${host}` : '');
  const url = `${base}/invite/${invite.token}`;
  return new Response(JSON.stringify({ url, token: invite.token }), { status: 201 });
}
