'use client'

import IdeaCard from "@/app/components/IdeaCard";
import { GiftList, Idea, User } from "@/generated/prisma";
import { useQuery } from "@tanstack/react-query";

type IdeaWithData = Idea & { _count?: { claims?: number } } & { createdBy: { name: string } };
export default function ListClient({ initialsIdeas, list, isOwner }: { initialsIdeas: IdeaWithData[], list: GiftList & { owner: { id: string, name: string, image: string | null } }, isOwner: boolean }) {

  const { data: ideas, refetch } = useQuery({
    queryKey: ['ideas', list.id],
    queryFn: async () => {
      const res = await fetch(`/api/lists/${list.id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch ideas');
      return res.json() as Promise<IdeaWithData[]>;
    },
    initialData: initialsIdeas
  })

  return (
    <>
      {ideas.length === 0 ? (
        <div className="text-[var(--foreground-secondary)] text-sm">Aucune idée pour l'instant.</div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {ideas.map((i) => (
            <li key={i.id}>
              <IdeaCard
                idea={{
                  id: i.id,
                  title: i.title,
                  image: i.image ?? null,
                  url: i.url ?? null,
                  priceCents: i.priceCents ?? null,
                  createdAt: i.createdAt,
                  ownerName: list.owner.name ?? null,
                  claimsCount: (i as { _count?: { claims?: number } })._count?.claims ?? 0,
                  creatorName: i.hiddenForOwner && i.createdBy?.name !== list.owner.name ? i.createdBy?.name ?? null : null,
                  notes: i.notes ?? null,
                  listId: list.id
                }}
                isOwner={isOwner}
                showClaimButton={!isOwner}
                refetch={refetch}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}