import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { api } from '../lib/auth';
import Header from '../components/Header';
import MyListClient from './MyListClient';
import { prisma } from "@/app/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import { createMetadata } from '../lib/seo';
import { revalidatePath } from 'next/cache';

export async function generateMetadata() {
  return await createMetadata({
    title: "Ma liste de souhaits",
    description: "Gérez vos idées de cadeaux et partagez-les avec votre famille.",
    path: "/my-list",
  });
}

export const dynamic = 'force-dynamic';

export default async function MyListPage() {
  try {
    const session = await api.getSession({ 
      headers: await headers()
    });
    if (!session) redirect('/');

    // Helpers server actions
    async function acceptSuggestion(id: string) {
      'use server';
      const h = await headers();
      const base = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`;
      await fetch(`${base}/api/suggestions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          cookie: h.get('cookie') ?? '',
        },
        body: JSON.stringify({ action: 'accept' }),
      });
      revalidatePath('/my-list');
    }

    async function rejectSuggestion(id: string) {
      'use server';
      const h = await headers();
      const base = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`;
      await fetch(`${base}/api/suggestions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          cookie: h.get('cookie') ?? '',
        },
        body: JSON.stringify({ action: 'reject' }),
      });
      revalidatePath('/my-list');
    }

    // Fetch ideas for this user's list, only those not hidden for owner
    const myList = await prisma.giftList.findUnique({ where: { ownerId: session.user.id } });
    const ideas = myList ? await prisma.idea.findMany({
      where: { listId: myList.id, hiddenForOwner: false },
      orderBy: { createdAt: 'desc' },
    }) : [];

    return (
      <div className="min-h-screen">
        <Header />
        <main className="container py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="text-center space-y-4">
              <div className="text-5xl">🎁</div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                  Ma liste de souhaits
                </h1>
                <p className="text-[var(--foreground-secondary)] text-lg">
                  Gérez vos idées de cadeaux et partagez-les avec votre famille
                </p>
              </div>
            </div>

            {/* List Management */}
            <Card>
              <CardHeader>
                <CardTitle>Mes idées</CardTitle>
              </CardHeader>
              <CardContent>
                {ideas.length === 0 ? (
                  <div className="text-[var(--foreground-secondary)] text-sm">Aucune idée dans votre liste.</div>
                ) : (
                  <ul className="space-y-2">
                    {ideas.map((i) => (
                      <li key={i.id} className="rounded-md border border-[var(--border)] bg-[var(--card-bg)] p-3">
                        <div className="font-medium truncate">{i.title}</div>
                        {(i.url || i.image || i.notes) && (
                          <div className="mt-2 text-sm text-[var(--foreground-secondary)] space-y-1">
                            {i.url ? (<div><a className="text-[var(--primary)] hover:underline" href={i.url} target="_blank" rel="noreferrer">Lien</a></div>) : null}
                            {i.image ? (<div className="flex items-center gap-2"><span>Image:</span><span className="truncate">{i.image}</span></div>) : null}
                            {i.notes ? (<div className="truncate">{i.notes}</div>) : null}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* List Management */}
            <MyListClient key={`ml-${ideas.length}`} />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('My list page error:', error);
    redirect('/');
  }
}
