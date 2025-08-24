import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink, oneTap } from "better-auth/plugins";
import { prisma } from "./prisma";

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
      sendMagicLink: async ({ email: _email, token: _token, url: _url }, _request) => {
        // Mark as used to satisfy linting when not wiring an email service yet
        void _email; void _token; void _url; void _request;
        // TODO: implement email sending with your provider
      }
    }),
    oneTap()
  ]
});

export const { api } = auth;