"use client";

import * as React from "react";
import Button from "./ui/Button";
import { useToast } from "./ui/ToastProvider";

export default function InviteCopyButton({ groupId, size = "sm", variant = "primary", children }: { groupId: string; size?: "sm" | "md" | "lg"; variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "danger"; children?: React.ReactNode; }) {
  const [loading, setLoading] = React.useState(false);
  const { success, error } = useToast();

  async function onCopy() {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/invites`, { method: 'POST' });
      if (!res.ok) throw new Error('Création du lien impossible');
      const data = await res.json();
      await navigator.clipboard.writeText(data.url);
      success({ title: 'Lien copié', description: 'Invitation copiée dans le presse‑papiers.' });
    } catch (e) {
      error({ title: 'Erreur', description: 'Impossible de copier le lien.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={onCopy} disabled={loading} size={size} variant={variant} aria-label="Copier le lien d'invitation">
      {children ?? '🔗 Copier le lien'}
    </Button>
  );
}
