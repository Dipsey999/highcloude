/**
 * Edge-compatible Auth.js configuration.
 * This file must NOT import Prisma or any Node.js-only modules
 * because it runs in the Edge Runtime (middleware).
 */

import GitHub from 'next-auth/providers/github';
import type { NextAuthConfig } from 'next-auth';

export default {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig;
