import Header from "@/app/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { api } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { createMetadata } from "@/app/lib/seo";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { updateProfile } from "./actions";
import { ProfileClient } from "./ProfileClient";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return await createMetadata({ title: "Mon profil", path: "/profile" });
}

export default async function ProfilePage() {
  const session = await api.getSession({ headers: await headers() });
  if (!session) redirect('/');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true, email: true },
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Mon profil</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileClient initialName={user?.name ?? ''} initialImage={user?.image ?? ''} email={user?.email ?? ''} saveAction={updateProfile} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}