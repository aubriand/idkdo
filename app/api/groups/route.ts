import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';

export async function GET() {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const groups = await prisma.group.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } }
      ]
    },
    include: { memberships: true }
  });

  return new Response(JSON.stringify(groups), { status: 200 });
}

export async function POST(req: Request) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name || '').trim();
  const slug = (body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)/g, '');

  if (!name) return new Response(JSON.stringify({ error: 'Name required' }), { status: 400 });

  // Ensure slug unique
  const existing = await prisma.group.findUnique({ where: { slug } });
  if (existing) return new Response(JSON.stringify({ error: 'Slug already in use' }), { status: 409 });

  const group = await prisma.group.create({
    data: {
      name,
      slug,
      ownerId: session.user.id,
      memberships: { create: { userId: session.user.id, role: 'owner' } }
    }
  });

  return new Response(JSON.stringify(group), { status: 201 });
}
