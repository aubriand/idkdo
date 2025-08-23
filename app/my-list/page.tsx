import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { api } from '../lib/auth';
import Header from '../components/Header';
import MyListClient from './MyListClient';
import { prisma } from "@/app/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";

export default async function MyListPage() {
  try {
    const session = await api.getSession({ 
      headers: await headers()
    });
    if (!session) redirect('/');

    // Fetch pending suggestions for this user's list
    const myList = await prisma.giftList.findUnique({ where: { ownerId: session.user.id } });
    const suggestions = myList ? await prisma.suggestion.findMany({
      where: { listId: myList.id, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true, image: true } } },
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

            {/* Suggestions Review */}
            <Card>
              <CardHeader>
                <CardTitle>Suggestions à valider</CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.length === 0 ? (
                  <div className="text-[var(--foreground-secondary)] text-sm">Aucune suggestion en attente.</div>
                ) : (
                  <ul className="space-y-2">
                    {suggestions.map((s) => (
                      <li key={s.id} className="rounded-md border border-[var(--border)] bg-[var(--card-bg)] p-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{s.title}</div>
                            <div className="text-xs text-[var(--foreground-secondary)] truncate">Proposé par {s.createdBy?.name ?? 'Un membre'}</div>
                          </div>
                          <div className="flex gap-2">
                            <form action={async () => { 'use server'; await fetch(`/api/suggestions/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject' }) }); }}>
                              <Button type="submit" size="sm" variant="outline">Refuser</Button>
                            </form>
                            <form action={async () => { 'use server'; await fetch(`/api/suggestions/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept' }) }); }}>
                              <Button type="submit" size="sm">Accepter</Button>
                            </form>
                          </div>
                        </div>
                        {(s.url || s.image || s.notes) && (
                          <div className="mt-2 text-sm text-[var(--foreground-secondary)] space-y-1">
                            {s.url ? (<div><a className="text-[var(--primary)] hover:underline" href={s.url} target="_blank" rel="noreferrer">Lien</a></div>) : null}
                            {s.image ? (<div className="flex items-center gap-2"><span>Image:</span><span className="truncate">{s.image}</span></div>) : null}
                            {s.notes ? (<div className="truncate">{s.notes}</div>) : null}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* List Management */}
            <MyListClient />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('My list page error:', error);
    redirect('/');
  }
}
