import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';

// List suggestions for a given list (owner only)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { id } = await params;

  const list = await prisma.giftList.findUnique({ where: { id }, select: { ownerId: true } });
  if (!list) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (list.ownerId !== session.user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const suggestions = await prisma.suggestion.findMany({ where: { listId: id }, orderBy: { createdAt: 'desc' } });
  return new Response(JSON.stringify(suggestions), { status: 200 });
}
