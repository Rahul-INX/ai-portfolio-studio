import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { getServerSession, type NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { isAllowedAdminEmail } from "@/lib/admin-identity";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const googleClientId = process.env.GOOGLE_AUTH_CLIENT_ID ?? process.env.GOOGLE_DRIVE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_AUTH_CLIENT_SECRET ?? process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const googleEnabled = Boolean(googleClientId && googleClientSecret);
const credentialsEnabled = process.env.NODE_ENV !== "production" || process.env.ENABLE_CREDENTIALS_LOGIN === "true" || !googleEnabled;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60
  },
  pages: {
    signIn: "/admin/login"
  },
  providers: [
    ...(credentialsEnabled ? [CredentialsProvider({
      name: "Admin credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash || user.role !== "ADMIN") return null;
        const isValid = await compare(parsed.data.password, user.passwordHash);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      }
    })] : []),
    ...(googleEnabled
      ? [GoogleProvider({ clientId: googleClientId!, clientSecret: googleClientSecret! })]
      : [])
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      return isAllowedAdminEmail(user.email, adminEmail);
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = typeof token.role === "string" ? token.role : "";
      }
      return session;
    }
  }
};

export function isAdminSession(session: Session | null): boolean {
  return session?.user?.role === "ADMIN";
}

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  return isAdminSession(session) ? session : null;
}
