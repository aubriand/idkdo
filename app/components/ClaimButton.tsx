"use client";

import * as React from "react";
import Button from "./ui/Button";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";

export default function ClaimButton({ ideaId, initialClaimed = false }: { ideaId: string; initialClaimed?: boolean }) {
  const router = useRouter();

  const isClaimed = useQuery({
    queryKey: ['idea-claimed', ideaId],
    queryFn: async () => {
      const res = await fetch(`/api/ideas/${ideaId}/claim`, { method: 'GET' });
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json().catch(() => ({}));
      if (typeof data.claimed !== 'boolean') throw new Error('Erreur');
      return data.claimed as boolean;
    },
    initialData: initialClaimed
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ideas/${ideaId}/claim`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur');
      }
      const data = await res.json().catch(() => ({}));
      if (typeof data.claimed !== 'boolean') throw new Error('Erreur');
      return data.claimed as boolean;
    },
    onSuccess: (claimed) => {
      isClaimed.refetch();
      router.refresh();
    }
  });


  return (
    <Button onClick={() => claimMutation.mutate()} size="sm" variant={isClaimed.data ? "outline" : "primary"} disabled={isClaimed.isPending}>
      <span className="text-sm text-nowrap">{isClaimed.data ? "✅ Pris" : "🎁 Je m'en occupe"}</span>
    </Button>
  );
}
