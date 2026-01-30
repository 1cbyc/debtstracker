import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db"
import { accounts, sessions, users, verificationTokens } from "./db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    session: {
        strategy: "jwt",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "email", type: "email" },
                password: { label: "password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await db.query.users.findFirst({
                    where: eq(users.email, credentials.email as string),
                });

                if (!user || !user.password) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
});
