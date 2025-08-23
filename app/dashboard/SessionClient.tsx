"use client";

import { useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import Button from "../components/ui/Button";

export default function SessionClient() {
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      if (authClient.signOut) {
        await authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } } as unknown as { fetchOptions?: { onSuccess?: () => void } });
        return;
      }

      await fetch('/api/auth/sign-out', { method: 'POST' });
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  if (isPending) return <div className="text-center text-[var(--foreground-secondary)]">Connexion...</div>;
  if (!session) return <div className="text-center text-[var(--foreground-secondary)]">Vous n&apos;êtes pas connecté.</div>;

  return (
    <div className="space-y-6">
      <div className="text-center">
  <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-[var(--primary)] p-0.5 shadow-sm">
          {session.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt={session.user.name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xl bg-[var(--card-bg)] rounded-full">👤</div>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-[var(--foreground)] mt-3 mb-1">
          {session.user?.name ?? "Membre de la famille"}
        </h3>
        <p className="text-sm text-[var(--foreground-secondary)]">
          {session.user?.email}
        </p>
      </div>
      
      <div className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--border)]">
        <Button onClick={signOut} variant="ghost" size="lg" className="w-full" disabled={loading}>
          <span className="text-lg">👋</span>
          {loading ? "Déconnexion..." : "Se déconnecter"}
        </Button>
      </div>
    </div>
  );
}
