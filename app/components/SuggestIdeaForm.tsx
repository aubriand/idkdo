"use client";

import * as React from "react";
import Button from "./ui/Button";
import Input from "./ui/Input";

export default function SuggestIdeaForm({ listId }: { listId: string }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: {
      listId: string;
      title: string;
      url?: string;
      image?: string;
      notes?: string;
      priceCents?: number;
    } = {
      listId,
      title: String(fd.get('title') || '').trim(),
      url: String(fd.get('url') || '').trim() || undefined,
      image: String(fd.get('image') || '').trim() || undefined,
      notes: String(fd.get('notes') || '').trim() || undefined,
    };
    const priceStr = String(fd.get('price') || '').trim();
    if (priceStr) payload.priceCents = Math.round(parseFloat(priceStr.replace(',', '.')) * 100);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error || 'Erreur');
      }
      form.reset();
    } catch (err) {
      const e = err as Error;
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">
      <h4 className="font-semibold text-[var(--foreground)]">Proposer une idée</h4>
      <Input name="title" label="Nom de l'idée" required placeholder="Écharpe en laine" />
      <div className="grid md:grid-cols-2 gap-3">
        <Input name="url" label="Lien (optionnel)" placeholder="https://…" />
        <Input name="image" label="Image (URL)" placeholder="https://…/photo.jpg" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Input name="price" label="Prix estimé" placeholder="29,90" prefix="€" />
        <Input name="notes" label="Notes" placeholder="Couleur, taille…" />
      </div>
      {error && <div className="text-sm text-[var(--error)]">{error}</div>}
      <div>
        <Button type="submit" size="sm" disabled={loading}>Envoyer la suggestion</Button>
      </div>
    </form>
  );
}
