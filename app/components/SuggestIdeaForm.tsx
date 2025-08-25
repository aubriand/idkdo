"use client";

import * as React from "react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { useRouter } from "next/navigation";

type IdeaFormValues = {
  listId: string;
  title: string;
  url?: string;
  image?: string;
  notes?: string;
  priceCents?: number;
};

interface SuggestIdeaFormProps {
  listId: string;
  initialValues?: Partial<IdeaFormValues>;
  mode?: "add" | "edit";
  onSubmit?: (data: IdeaFormValues) => Promise<void>;
}

export default function SuggestIdeaForm({ listId, initialValues = {}, mode = "add", onSubmit }: SuggestIdeaFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const [title, setTitle] = React.useState(initialValues.title || "");
  const [url, setUrl] = React.useState(initialValues.url || "");
  const [image, setImage] = React.useState(initialValues.image || "");
  const [notes, setNotes] = React.useState(initialValues.notes || "");
  const [price, setPrice] = React.useState(initialValues.priceCents ? (initialValues.priceCents / 100).toString() : "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const payload: IdeaFormValues = {
      listId,
      title: title.trim(),
      url: url.trim() || undefined,
      image: image.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    if (price) payload.priceCents = Math.round(parseFloat(price.replace(',', '.')) * 100);
    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        // Ajout classique
        const res = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(b.error || 'Erreur');
        }
        setTitle(""); setUrl(""); setImage(""); setNotes(""); setPrice("");
        router.refresh();
      }
    } catch (err) {
      const e = err as Error;
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">
      <h4 className="font-semibold text-[var(--foreground)]">
        {mode === "edit" ? "Modifier l'idée" : "Proposer une idée"}
      </h4>
      <Input name="title" label="Nom de l'idée" required placeholder="Écharpe en laine" value={title} onChange={e => setTitle(e.target.value)} />
      <div className="grid md:grid-cols-2 gap-3">
        <Input name="url" label="Lien (optionnel)" placeholder="https://…" value={url} onChange={e => setUrl(e.target.value)} />
        <Input name="image" label="Image (URL)" placeholder="https://…/photo.jpg" value={image} onChange={e => setImage(e.target.value)} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Input name="price" label="Prix estimé" placeholder="29,90" prefix="€" value={price} onChange={e => setPrice(e.target.value)} />
        <Input name="notes" label="Notes" placeholder="Couleur, taille…" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      {error && <div className="text-sm text-[var(--error)]">{error}</div>}
      <div>
        <Button type="submit" size="sm" disabled={loading}>
          {mode === "edit" ? "Modifier" : "Envoyer la suggestion"}
        </Button>
      </div>
    </form>
  );
}
