import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
      // src/lib/auth.ts
      async authorize(credentials) {
        console.log("Giriş denemesi:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("Eksik bilgi");
          throw new Error("Geçersiz giriş bilgileri");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        console.log("Bulunan kullanıcı:", user);

        if (!user || !user.password) {
          console.log("Kullanıcı bulunamadı veya şifresiz");
          throw new Error("Kullanıcı bulunamadı");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        console.log("Şifre doğru mu?:", isPasswordValid);

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
        token.role = (user as any).role;
        token.storeId = (user as any).storeId;
        token.warehouseId = (user as any).warehouseId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).storeId = token.storeId;
        (session.user as any).warehouseId = token.warehouseId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
