"use client";

import * as React from "react";
import Button from "./ui/Button";
import { useRouter } from "next/navigation";

export default function ClaimButton({ ideaId, initialClaimed = false }: { ideaId: string; initialClaimed?: boolean }) {
  const [claimed, setClaimed] = React.useState(initialClaimed);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/ideas/${ideaId}/claim`, { method: 'GET' });
        const data = await res.json().catch(() => ({}));
        if (active && res.ok && typeof data.claimed === 'boolean') setClaimed(data.claimed);
      } catch {}
    })();
    return () => { active = false; };
  }, [ideaId]);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/claim`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.claimed === 'boolean') setClaimed(data.claimed);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={toggle} size="sm" variant={claimed ? "outline" : "primary"} disabled={loading}>
      <span className="text-sm">{claimed ? "✅ Pris" : "🎁 Je m'en occupe"}</span>
    </Button>
  );
}
