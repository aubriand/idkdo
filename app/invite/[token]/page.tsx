import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/app/lib/auth";
import Header from "@/app/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";

async function getInvite(token: string, base: string) {
  const res = await fetch(`${base}/api/invites/${token}`, { cache: 'no-store' });
  return res;
}

export default async function InvitePage({ params }: { params: { token: string } }) {
  const { token } = await params;
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('host');
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? (host ? `${proto}://${host}` : '');
  const res = await getInvite(token, base);
  if (!res.ok) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container py-8">
          <Card>
            <CardHeader><CardTitle>Invitation invalide</CardTitle></CardHeader>
            <CardContent>Le lien d'invitation n'est pas valide ou a expiré.</CardContent>
          </Card>
        </main>
      </div>
    );
  }
  const data = await res.json();
  const group = data.group as { id: string; name: string; slug: string };

  async function join() {
    "use server";
    // if not authenticated, redirect to login then back here
    const s = await api.getSession({ headers: await headers() });
    if (!s) {
      redirect(`/?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
    }
    const hh = await headers();
    const p = hh.get('x-forwarded-proto') ?? 'http';
    const ho = hh.get('host');
    const b = process.env.NEXT_PUBLIC_BASE_URL ?? (ho ? `${p}://${ho}` : '');
    await fetch(`${b}/api/invites/${token}`, { method: 'POST', headers: { cookie: hh.get('cookie') ?? '' } });
    redirect('/groups');
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Rejoindre "{group.name}"</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[var(--foreground-secondary)]">Vous avez été invité à rejoindre le groupe <strong>{group.name}</strong>.</p>
              <form action={join}>
                <Button type="submit">Rejoindre le groupe</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
