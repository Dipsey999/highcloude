import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  events: {
    async createUser({ user }) {
      // After Auth.js creates the user, update with GitHub-specific fields
      if (user.id) {
        try {
          const account = await prisma.account.findFirst({
            where: { userId: user.id, provider: 'github' },
          });
          if (account) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                githubId: account.providerAccountId,
                username: user.name ?? undefined,
              },
            });
          }
        } catch (e) {
          console.error('[auth] Failed to update GitHub fields:', e);
        }
      }
    },
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  session: {
    strategy: 'database',
  },
});
