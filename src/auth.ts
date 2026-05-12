import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { dbConnect } from '@/lib/mongoose';
import { User } from '@/models/User';
import { audit } from '@/lib/audit';
import { authConfig } from '@/auth.config';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        await dbConnect();
        const user = await User.findOne({ email });

        if (!user) {
          await audit({
            action: 'auth.login.failed',
            level: 'warn',
            metadata: { email, reason: 'user_not_found' },
          });
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          await audit({
            action: 'auth.login.failed',
            level: 'warn',
            userId: user._id.toString(),
            metadata: { email, reason: 'invalid_password' },
          });
          return null;
        }

        if (!user.emailVerifiedAt) {
          await audit({
            action: 'auth.login.failed',
            level: 'warn',
            userId: user._id.toString(),
            metadata: { email, reason: 'email_not_verified' },
          });
          return null;
        }

        await audit({
          action: 'auth.login.success',
          userId: user._id.toString(),
          metadata: { email },
        });
        return { id: user._id.toString(), email: user.email, name: user.name ?? null };
      },
    }),
  ],
});
