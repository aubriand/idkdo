import Header from "@/app/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { api } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import nextDynamic from "next/dynamic";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import ListClient from "./ListClient";
export const dynamic = 'force-dynamic';
const SuggestIdeaForm = nextDynamic(() => import("@/app/components/SuggestIdeaForm"));

export default async function PublicListPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const session = await api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  // Access: allow if this list belongs to a user who shares a group with me, or it's mine
  const list = await prisma.giftList.findUnique({
    where: { id: id },
    include: { owner: { select: { id: true, name: true, image: true } } },
  });
  if (!list) return notFound();

  const isOwner = list.ownerId === session.user.id;
  if (!isOwner) {
    // check shared group membership
    const shared = await prisma.group.findFirst({
      where: {
        AND: [
          { memberships: { some: { userId: session.user.id } } },
          { memberships: { some: { userId: list.ownerId } } },
        ],
      },
      select: { id: true },
    });
    if (!shared) return notFound();
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><span>🎁</span> Liste de {list.owner.name ?? "Membre"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ListClient initialsIdeas={[]} list={list} isOwner={isOwner} />
            </CardContent>
          </Card>
          {!isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Proposer une idée</CardTitle>
              </CardHeader>
              <CardContent>
                <SuggestIdeaForm listId={list.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}