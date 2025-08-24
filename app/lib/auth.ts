import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink, oneTap } from "better-auth/plugins";
import { prisma } from "./prisma";
import { sendMail } from "./mailer";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql"
  }),
  socialProviders: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        try {

          await sendMail({
            to: email,
            subject: "Votre lien de connexion — IDKDO",
            text: `Cliquez pour vous connecter: ${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e‑mail.`,
            html: `
            <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:16px">
            <h2 style="margin:0 0 12px;color:#0f766e">Connexion à IDKDO</h2>
            <p>Voici votre lien de connexion sécurisé :</p>
            <p>
            <a href="${url}" style="background:#14b8a6;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;display:inline-block">
            Se connecter
            </a>
            </p>
            <p style="font-size:12px;color:#666;margin-top:16px">
            Ou copiez/collez ce lien :<br />
            <a href="${url}">${url}</a>
            </p>
            </div>
            `,
          });
        } catch (error) {
          console.error("Error sending magic link email:", error);
        }
      },
    }),
    oneTap()
  ],
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"]
    }
  },
  normalizeEmail: (email: string) => email.trim().toLowerCase(),
  // Auto-generate a Dicebear avatar if none exists after user creation/login.
  events: {
    async afterUserCreation({ user }: { user: { id: string; name?: string | null; email?: string | null; image?: string | null } }) {
      if (!user) return;
      const hasDicebear = (url?: string | null) => {
        if (!url) return false;
        try {
          const u = new URL(url);
          return u.hostname === 'api.dicebear.com' && u.pathname.startsWith('/9.x/');
        } catch {
          return false;
        }
      };
      if (!hasDicebear(user.image)) {
        const seed = (user.name || user.email || 'user').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') || 'user';
        const image = `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
        try {
          await prisma.user.update({ where: { id: user.id }, data: { image, updatedAt: new Date() } });
        } catch (e) {
          console.error('Failed to set default avatar:', e);
        }
      }
    },
  }
});

export const { api } = auth;