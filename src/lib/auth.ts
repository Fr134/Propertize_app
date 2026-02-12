import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Configurazione NextAuth v5 con autenticazione Credentials.
 *
 * NOTA SICUREZZA: Per produzione, considera di implementare:
 * 1. Rate limiting per prevenire attacchi brute-force
 *    - Usa @upstash/ratelimit o simile
 *    - Limita a 5 tentativi per IP/email ogni 15 minuti
 * 2. Account lockout dopo X tentativi falliti
 * 3. Logging dei tentativi di accesso falliti
 * 4. 2FA per utenti Manager (optional ma raccomandato)
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: Implementare rate limiting qui
        // const { success } = await ratelimit.limit(credentials.email);
        // if (!success) return null;

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // Risposta uniforme per user non trovato o password errata
        // previene user enumeration attacks
        if (!user) {
          // Esegui bcrypt comunque per prevenire timing attacks
          await bcrypt.compare(credentials.password as string, "$2a$10$dummyhashtopreventtimingattack");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );

        if (!isPasswordValid) {
          // TODO: Incrementare contatore tentativi falliti
          return null;
        }

        // TODO: Reset contatore tentativi falliti su successo

        return {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
});
