"use client";

import * as React from "react";
import Button from "@/app/components/ui/Button";
import { useToast } from "@/app/components/ui/ToastProvider";
import { useRouter } from "next/navigation";

export default function OwnerActions({ groupId, initialName }: { groupId: string; initialName: string }) {
  const { success, error } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onRename() {
    const name = prompt("Nouveau nom du groupe ?", initialName);
    if (!name) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error();
      success({ title: 'Nom mis à jour' });
      router.refresh();
    } catch {
      error({ title: 'Impossible de renommer le groupe' });
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    const ok = confirm("Supprimer ce groupe ? Cette action est irréversible.");
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error();
      success({ title: 'Groupe supprimé' });
      // Go back to groups list
      router.push('/groups');
      router.refresh();
    } catch {
      error({ title: 'Suppression impossible' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={onRename} disabled={loading} size="sm" variant="ghost">✏️ Renommer</Button>
      <Button onClick={onDelete} disabled={loading} size="sm" variant="danger">🗑️ Supprimer</Button>
    </div>
  );
}
