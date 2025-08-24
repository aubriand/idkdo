"use client";

import * as React from "react";
import Button from "./ui/Button";

type Props = {
  groupId: string;
  token?: string; // token d'invitation si disponible
  children?: React.ReactNode;
};

export default function ShareButton({ groupId, token, children }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function handleShare() {
    setLoading(true);
    try {
      let shareUrl: string;
      
      if (token) {
        // Utiliser le token fourni
        shareUrl = `${window.location.origin}/invite/${token}`;
      } else {
        // Créer ou récupérer un lien d'invitation
        const res = await fetch(`/api/groups/${groupId}/invites`, { method: 'POST' });
        if (!res.ok) throw new Error('Création du lien impossible');
        const data = await res.json();
        shareUrl = data.url;
      }
      
      const shareData = {
        title: "Rejoignez mon groupe IDKDO",
        text: "Venez découvrir ma liste de cadeaux et partagez vos idées !",
        url: shareUrl,
      };

      // Tenter le partage natif si disponible (mobile principalement)
      if (navigator.share && navigator.canShare?.(shareData)) {
        try {
          await navigator.share(shareData);
          return; // Succès, on s'arrête là
        } catch (shareError) {
          // L'utilisateur a annulé ou erreur, continuer vers la copie
          if ((shareError as Error).name !== 'AbortError') {
            console.warn('Erreur partage natif:', shareError);
          }
        }
      }

      // Fallback : copier dans le presse-papiers
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback pour les navigateurs plus anciens
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }

    } catch (error) {
      console.error('Erreur lors du partage:', error);
      // TODO: Afficher un toast d'erreur
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleShare}
      disabled={loading}
      size="sm"
      variant="secondary"
      className={copied ? "bg-green-100 text-green-700 border-green-300" : ""}
    >
      {loading ? (
        "⏳"
      ) : copied ? (
        "✅ Copié"
      ) : (
        children || "🔗 Partager"
      )}
    </Button>
  );
}
