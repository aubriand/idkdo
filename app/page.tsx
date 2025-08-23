import LoginClient from "./components/LoginClient";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/app/lib/auth";
import { Card, CardContent, CardTitle } from "./components/ui/Card";
import Image from "next/image";
import Logo from "@/app/assets/IDKDO.png";

type SessionData = { user: { id: string; name?: string | null; email?: string | null } } | null;
export default async function HomePage() {
  let session: SessionData = null;
  try {
    session = await api.getSession({ headers: await headers() });
  } catch (error) {
    // If session check fails, continue to show login page
    console.error('Session check failed:', error);
  }

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="text-center space-y-8">
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden relative">
                <Image src={Logo} alt="IDKDO" fill className="object-contain" priority />
              </div>
              <div>
                <CardTitle className="text-2xl mb-2 text-center justify-center">
                  Bienvenue sur IDKDO
                </CardTitle>
                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                  Créez des listes de cadeaux en famille, partagez vos envies et découvrez les idées de vos proches.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                🔑 Connectez-vous pour commencer
              </h3>
              <LoginClient />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
