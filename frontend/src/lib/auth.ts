import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const DEFAULT_PERMISSIONS = {
  is_super_admin: false,
  can_manage_leads: false,
  can_do_analysis: false,
  can_manage_operations: false,
  can_manage_finance: false,
  can_manage_team: false,
  can_manage_onboarding: false,
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const res = await fetch(
            `${process.env.API_URL}/api/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          if (!res.ok) return null;

          const { accessToken, user } = await res.json();

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            accessToken,
            permissions: user.permissions ?? DEFAULT_PERMISSIONS,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.permissions =
          (user as { permissions?: typeof DEFAULT_PERMISSIONS }).permissions ??
          DEFAULT_PERMISSIONS;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.accessToken = token.accessToken as string;
        session.user.permissions = token.permissions ?? DEFAULT_PERMISSIONS;
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
