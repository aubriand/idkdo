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
  ]
});

export const { api } = auth;