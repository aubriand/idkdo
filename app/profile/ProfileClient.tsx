"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { useFormStatus } from "react-dom";

function seedFromName(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
}

function dicebearUrl(style: string, seed: string, ext: 'svg' | 'png' = 'svg') {
  const safeSeed = encodeURIComponent(seed || 'user');
  return `https://api.dicebear.com/9.x/${style}/${ext}?seed=${safeSeed}`;
}

const STYLES = [
  { id: 'thumbs', name: 'Thumbs' },
  { id: 'avataaars', name: 'Avataaars' },
  { id: 'lorelei', name: 'Lorelei' },
  { id: 'bottts', name: 'Bottts' },
  { id: 'identicon', name: 'Identicon' },
  { id: 'shapes', name: 'Shapes' },
];

export function ProfileClient({ initialName, initialImage, email }: { initialName: string; initialImage: string; email: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState(initialName);
  const [image, setImage] = React.useState(initialImage);
  const [open, setOpen] = React.useState(false);
  const [style, setStyle] = React.useState(STYLES[0].id);
  const [seed, setSeed] = React.useState(seedFromName(initialName || email || 'user'));
  const [customUrl, setCustomUrl] = React.useState("");
  const [importError, setImportError] = React.useState<string | null>(null);

  const preview = image || dicebearUrl(style, seed);

  function generateFromName() {
    const s = seedFromName(name || email || 'user');
    setSeed(s);
    setImage(dicebearUrl(style, s));
  }

  function randomize() {
    const s = Math.random().toString(36).slice(2, 10);
    setSeed(s);
  }

  function isDicebearUrl(url: string): boolean {
    try {
      const u = new URL(url);
      if (u.hostname !== 'api.dicebear.com') return false;
      if (!u.pathname.startsWith('/9.x/')) return false;
      const ext = u.pathname.split('/').pop()?.split('?')[0];
      return ext === 'svg' || ext === 'png';
    } catch {
      return false;
    }
  }

  function applyCustomUrl() {
    setImportError(null);
    const url = customUrl.trim();
    if (!isDicebearUrl(url)) {
      setImportError("URL invalide. Collez un lien api.dicebear.com/9.x/... en .svg ou .png");
      return;
    }
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length >= 3) {
        const newStyle = parts[1];
        if (newStyle) setStyle(newStyle);
        const newSeed = u.searchParams.get('seed');
        if (newSeed) setSeed(newSeed);
      }
      setImage(url);
      setOpen(false);
    } catch {
      setImportError("Impossible de lire ce lien.");
    }
  }

  // Mutation pour sauvegarder le profil
  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formData
      });
      if (!res.ok) throw new Error('Erreur sauvegarde profil');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });


  return (
    <form className="space-y-6" onSubmit={async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      await saveMutation.mutateAsync(new FormData(form));
    }}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 grid gap-3">
          <Input name="name" label="Nom" placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
          <input type="hidden" name="image" value={image || dicebearUrl(style, seed)} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>Choisir un avatar</Button>
            <Button type="button" variant="secondary" onClick={generateFromName}>Générer depuis mon nom</Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Choisir un avatar">
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-[var(--foreground-secondary)]">Besoin d'options avancées ?</div>
            <a href="https://www.dicebear.com/playground/" target="_blank" rel="noreferrer noopener" className="h-9 inline-flex items-center px-3 rounded-md border bg-[var(--card-bg)] border-[var(--border)] text-sm hover:bg-[var(--surface)]">Ouvrir le Playground ↗</a>
          </div>
          <div className="flex gap-2 flex-wrap">
            {STYLES.map((s) => (
              <button key={s.id} type="button" onClick={() => setStyle(s.id)} className={`h-9 px-3 rounded-md border text-sm ${style === s.id ? 'bg-[var(--primary)] text-white border-[var(--primary-hover)]' : 'bg-[var(--card-bg)] border-[var(--border)]'}`}>
                {s.name}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Input label="Seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
            <Button type="button" variant="outline" onClick={randomize}>Aléatoire</Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dicebearUrl(style, seed)} alt="Prévisualisation" className="w-full h-full object-cover" />
            </div>
            <div className="text-sm text-[var(--foreground-secondary)]">Prévisualisation</div>
          </div>
          <div className="grid gap-2">
            <Input label="Importer depuis une URL Dicebear" placeholder="https://api.dicebear.com/9.x/avataaars/svg?seed=Alex&..." value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} />
            {importError && <div className="text-sm text-[var(--error)]">{importError}</div>}
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={applyCustomUrl}>Utiliser ce lien</Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="button" onClick={() => { setImage(dicebearUrl(style, seed)); setOpen(false); }}>Choisir</Button>
          </div>
        </div>
      </Modal>
    </form>
  );
}


function SubmitButton() {
  const { pending } = useFormStatus?.() ?? { pending: false };
  return <Button type="submit" disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer'}</Button>;
}
