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
