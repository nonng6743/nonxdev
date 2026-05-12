import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  // Trust the Host header from the upstream proxy (nginx / Caddy / PM2 behind LB).
  // Required when not deploying on Vercel; Auth.js v5 refuses unknown hosts by default.
  trustHost: true,
  pages: {
    signIn: '/finance/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith('/finance/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user && 'id' in user && user.id) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
