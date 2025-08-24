import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { api } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import Header from "@/app/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import ListItemCard from "@/app/components/ListItemCard";
import nextDynamic from "next/dynamic";
import ClaimButton from "@/app/components/ClaimButton";
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

  const ideas = await prisma.idea.findMany({
    where: { listId: list.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, url: true, image: true, priceCents: true, createdAt: true, _count: { select: { claims: true } } },
  });

  // Price formatting is handled in display components when needed

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
              {ideas.length === 0 ? (
                <div className="text-[var(--foreground-secondary)] text-sm">Aucune idée pour l'instant.</div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {ideas.map((i) => (
                    <li key={i.id} className="space-y-2">
                      <ListItemCard item={{ id: i.id, title: i.title, image: i.image ?? null, url: i.url ?? null, priceCents: i.priceCents ?? null, createdAt: i.createdAt, ownerName: list.owner.name ?? null, claimsCount: (i as { _count?: { claims?: number } })._count?.claims ?? 0 }} />
                      {!isOwner ? (<ClaimButton ideaId={i.id} />) : null}
                    </li>
                  ))}
                </ul>
              )}
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
