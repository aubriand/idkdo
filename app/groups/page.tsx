import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { api } from '../lib/auth';
import Header from '../components/Header';
import GroupsClient from './GroupsClient';
import { createMetadata } from "../lib/seo";

export async function generateMetadata() {
  return createMetadata({
    title: "Mes groupes",
    description: "Créez et rejoignez des groupes pour partager vos listes de cadeaux.",
    path: "/groups",
  });
}

export default async function GroupsPage() {
  try {
    const session = await api.getSession({
      headers: await headers()
    });
    if (!session) redirect('/');

    return (
      <div className="min-h-screen">
        <Header />
        <main className="container py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="text-center space-y-4">
              <div className="text-5xl">👥</div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                  Mes groupes familiaux
                </h1>
                <p className="text-[var(--foreground-secondary)] text-lg">
                  Créez des groupes pour partager vos listes avec votre famille et vos amis
                </p>
              </div>
            </div>

            {/* Groups Management */}
            <GroupsClient />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Groups page error:', error);
    redirect('/');
  }
}
