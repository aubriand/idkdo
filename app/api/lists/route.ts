import { api } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { headers } from 'next/headers';

export async function GET() {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  let list = await prisma.giftList.findUnique({ where: { ownerId: session.user.id } });
  
  // If no list exists, create one automatically (fallback for existing users)
  if (!list) {
    list = await prisma.giftList.create({
      data: {
        title: `🎁 Liste de ${session.user.name || 'mes envies'}`,
        description: 'Ma liste de souhaits personnelle',
        ownerId: session.user.id
      }
    });
  }
  
  return new Response(JSON.stringify([list]), { status: 200 });
}

export async function POST() {
  const session = await api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  // Lists are auto-created, so this endpoint just returns the existing list
  const list = await prisma.giftList.findUnique({ where: { ownerId: session.user.id } });
  if (list) {
    return new Response(JSON.stringify(list), { status: 200 });
  }

  // Create if somehow missing
  const newList = await prisma.giftList.create({
    data: {
      title: `🎁 Liste de ${session.user.name || 'mes envies'}`,
      description: 'Ma liste de souhaits personnelle', 
      ownerId: session.user.id
    }
  });
  
  return new Response(JSON.stringify(newList), { status: 201 });
}
