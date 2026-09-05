import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma"; // Eğer yol farklıysa '../lib/prisma' yapabilirsin

// NextAuth Tip Genişletmeleri (any kullanımını tamamen kaldırır)
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
      storeId?: string | null;
      warehouseId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    storeId?: string | null;
    warehouseId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    storeId?: string | null;
    warehouseId?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Geçersiz giriş bilgileri");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Kullanıcı bulunamadı");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error("Hatalı şifre");
        }

        if (user.role !== "ADMIN" && !user.isApproved) {
          throw new Error("Hesabınız henüz yönetici tarafından onaylanmadı.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          storeId: user.storeId,
          warehouseId: user.warehouseId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.storeId = user.storeId;
        token.warehouseId = user.warehouseId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.storeId = token.storeId;
        session.user.warehouseId = token.warehouseId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
