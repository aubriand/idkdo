"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { useToast } from "@/app/components/ui/ToastProvider";
import GroupCard from "../components/GroupCard";

type Group = { id: string; name: string; slug: string; memberships: Array<{ id: string }> };

export default function GroupsClient() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();
  const [joinInput, setJoinInput] = useState("");

  // Query pour charger les groupes
  const { data: groups = [], isLoading: loading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await fetch('/api/groups', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      return await res.json();
    }
  });

  // Mutation pour créer un groupe
  const createGroupMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: String(formData.get('name') || '') })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erreur ${res.status}`);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    }
  });

  function extractToken(input: string): string | null {
    try {
      // accept full URL like https://site/invite/{token} or just the token
      const trimmed = input.trim();
      if (!trimmed) return null;
      if (/^[a-z0-9]+$/i.test(trimmed)) return trimmed; // looks like token
      const url = new URL(trimmed);
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex(p => p.toLowerCase() === 'invite');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
      return parts[parts.length - 1] || null;
    } catch {
      // not a valid URL, fallback to last segment heuristic
      const parts = input.split('/').filter(Boolean);
      return parts[parts.length - 1] || null;
    }
  }

  async function joinByLink(e: React.FormEvent) {
    e.preventDefault();
    const token = extractToken(joinInput);
    if (!token) {
      toastError({ title: 'Lien invalide', description: 'Veuillez coller un lien ou un code d\'invitation valide.' });
      return;
    }
    // Navigate to invite landing which handles auth + membership
    window.location.href = `/invite/${encodeURIComponent(token)}`;
  }

  return (
    <div className="space-y-8">
      {/* Create Group Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">➕</span>
            Créer un nouveau groupe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            await createGroupMutation.mutateAsync(new FormData(form));
          }} className="space-y-4">
            <Input 
              name="name" 
              label="Nom du groupe" 
              placeholder="Famille Martin 2025" 
              required 
            />
            <Button type="submit" size="lg" disabled={loading} variant="secondary">
              <span className="text-lg">🎪</span>
              {loading ? 'Création...' : 'Créer le groupe'}
            </Button>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <span className="text-lg">⚠️</span> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Join by invite link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🔗</span>
            Rejoindre un groupe via un lien
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={joinByLink} className="flex flex-col sm:flex-row gap-3 [&>div]:flex-1">
            <Input
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              placeholder="Collez un lien d\'invitation ou un code"
              aria-label="Lien d\'invitation"
            />
            <Button type="submit" variant="primary">Rejoindre</Button>
          </form>
        </CardContent>
      </Card>

      {/* Groups List - same rendering as dashboard */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
          <span className="text-2xl">👨‍👩‍👧‍👦</span>
          Vos groupes
        </h2>

        {loading && groups.length === 0 ? (
          <div className="text-center py-8 text-[var(--foreground-secondary)]">Chargement…</div>
        ) : groups.length === 0 ? (
          <div className="text-[var(--foreground-secondary)] text-sm">Aucun groupe. Créez-en un pour partager vos listes.</div>
        ) : (
          <ul className="space-y-2">
            {groups.map((g: Group) => (
              <GroupCard key={g.id} id={g.id} name={g.name} membersCount={g.memberships.length} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
