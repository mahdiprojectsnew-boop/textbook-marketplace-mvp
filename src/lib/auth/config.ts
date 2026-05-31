import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/server";

type UserRole = "student" | "faculty" | "admin";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const supabase = createServiceClient();

        const { data: user, error } = await supabase
          .from("users")
          .select(
            "id, email, password_hash, first_name, last_name, role, is_academic_verified, is_active"
          )
          .eq("email", credentials.email.toLowerCase().trim())
          .single();

        if (error || !user) {
          throw new Error("Invalid email or password");
        }

        if (!user.is_active) {
          throw new Error("Your account has been suspended. Please contact support.");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.first_name
            ? `${user.first_name} ${user.last_name ?? ""}`.trim()
            : null,
          role: user.role as UserRole | null,
          is_academic_verified: user.is_academic_verified,
        };
      },
    }),
  ],
    callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole | null }).role;
        token.is_academic_verified = (
          user as { is_academic_verified?: boolean }
        ).is_academic_verified;
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        const sessionUser = session.user as typeof session.user & {
          id: string;
          role: UserRole | null;
          is_academic_verified: boolean;
        };

        sessionUser.id = token.id as string;
        sessionUser.role = token.role as UserRole | null;
        sessionUser.is_academic_verified =
          token.is_academic_verified as boolean;
      }

      return session;
    },
  },
};