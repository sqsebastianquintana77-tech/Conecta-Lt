import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabase } from '@/lib/supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        token.id = user.id;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        session.user.image = token.picture as string;
      }
      return session;
    },
    async signIn({ user }) {
      if (!user?.email) return false;
      try {
        await supabase.from('User').upsert({
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: new Date().toISOString(),
        }, { onConflict: 'email' });
      } catch {
        console.warn('Supabase not available, skipping user upsert');
      }
      return true;
    },
  },
  pages: {
    signIn: undefined,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };