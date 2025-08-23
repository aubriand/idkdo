"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data: session } = authClient.useSession();

  useEffect(() => {
    // initialize oneTap plugin if available on client
    (async () => {
      try {
        if ((authClient as any).oneTap) await (authClient as any).oneTap();
      } catch (err: any) {
        setMessage(err?.message ?? "Erreur lors de la connexion One Tap");
      }
    })();
  }, []);

  async function signInWithGoogle() {
    setLoading(true);
    setMessage(null);
    try {
      // prefer client SDK signIn if available
      if (authClient.signIn?.social) {
        const res = await authClient.signIn.social({ provider: 'google' } as any);
        // some providers return a url to redirect to
        if ((res as any)?.url) {
          window.location.href = (res as any).url;
          return;
        }
      }

      // fallback: ask server for redirect url
      const r = await fetch('/api/auth/sign-in/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google' })
      });
      if (!r.ok) throw new Error('Échec initialisation Google');
      const data = await r.json();
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      setMessage(err?.message ?? "Erreur lors de la connexion Google");
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (authClient.signIn?.magicLink) {
        await authClient.signIn.magicLink({ email } as any);
        setMessage("Magic link envoyé — vérifiez votre boite mail.");
        return;
      }

      const res = await fetch('/api/auth/sign-in/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) throw new Error('Erreur en envoyant le magic link');
      setMessage("Magic link envoyé — vérifiez votre boite mail.");
    } catch (err: any) {
      setMessage(err?.message ?? "Erreur lors de l'envoi du magic link");
    } finally {
      setLoading(false);
    }
  }

  // if user already signed in, show a small message
  if (session) return <div>Connecté en tant que {session.user?.name ?? session.user?.email}</div>;

  return (
    <div className="flex flex-col gap-6">
      <Button onClick={signInWithGoogle} variant="primary" size="lg" disabled={loading} className="w-full gap-3">
        <svg width="24" height="24" viewBox="0 0 48 48" className="inline-block">
          <path fill="#EA4335" d="M24 9.5c3.9 0 6.6 1.7 8.1 3.1l6-6C34.9 3.1 29.9 1 24 1 14.8 1 6.9 6.2 3 14.4l7 5.4C12.6 15 17.8 9.5 24 9.5z" />
          <path fill="#34A853" d="M46.5 24c0-1.6-.1-2.8-.4-4.1H24v8.1h12.6c-.6 3.4-3 6.1-6.4 7.7l7 5.4C43.6 37.6 46.5 31.3 46.5 24z" />
          <path fill="#4A90E2" d="M10.2 29.8c-.9-2.6-1.4-5.3-1.4-8s.5-5.4 1.4-8L3 8.4C.9 12.2 0 16 0 20c0 4 1 7.8 3 11.6l7.2-2.8z" />
          <path fill="#FBBC05" d="M24 46c6.1 0 11.1-2 15-5.5l-7-5.4c-2.4 1.6-5.4 2.6-8 2.6-6.3 0-11.6-5.5-13.1-12.8l-7.2 2.8C6.9 41.8 14.8 47 24 47z" />
        </svg>
        {loading ? "Connexion..." : "🚀 Connexion avec Google"}
      </Button>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-[var(--border)]"></div>
        <span className="text-sm text-[var(--warm-gray)] font-medium px-3">ou par email</span>
        <div className="flex-1 h-px bg-[var(--border)]"></div>
      </div>

      <form onSubmit={sendMagicLink} className="grid gap-4">
        <Input
          label="📧 Votre adresse email familiale"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="famille@exemple.com"
          required
          disabled={loading}
        />
        <Button type="submit" variant="secondary" size="lg" className="w-full gap-2" disabled={loading}>
          <span className="text-lg">✨</span>
          {loading ? "Envoi en cours..." : "Recevoir un lien magique"}
        </Button>
      </form>

      {message && (
        <div className="text-center p-4 bg-[var(--surface)] rounded-xl border-2 border-[var(--secondary-light)]">
          <div className="text-lg mb-1">🎉</div>
          <div className="text-sm font-medium text-[var(--foreground)]">{message}</div>
        </div>
      )}
    </div>
  );
}
