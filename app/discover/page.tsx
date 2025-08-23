import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { api } from '../lib/auth';
import Header from '../components/Header';
import DiscoverClient from './DiscoverClient';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
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
              <div className="text-5xl">🔍</div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                  Découvrir les listes
                </h1>
                <p className="text-[var(--foreground-secondary)] text-lg">
                  Explorez les listes de souhaits de votre famille et vos amis
                </p>
              </div>
            </div>

            {/* Discover Content */}
            <DiscoverClient />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Discover page error:', error);
    redirect('/');
  }
}
