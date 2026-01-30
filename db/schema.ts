import {
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    boolean,
    primaryKey,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

// --- Auth.js Tables ---

export const users = pgTable("user", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    password: text("password"), // For credentials authentication
});

export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccount["type"]>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => [
        primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    ]
);

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (verificationToken) => [
        primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    ]
);

// --- Application Tables ---

export const debts = pgTable("debt", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Storing amounts in cents/lowest unit to avoid floating point errors
    totalAmount: integer("total_amount").notNull(),
    currentBalance: integer("current_balance").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(), // NGN, USD, GBP
    priority: text("priority", { enum: ["high", "medium", "low"] }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transaction", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    debtId: uuid("debt_id").references(() => debts.id, { onDelete: "set null" }), // Optional, can be a general expense
    amount: integer("amount").notNull(), // Positive for payment/income, negative for expense? Or just value with type.
    // Actually, usually transactions are "out" or "in".
    // For 'payment' (towards debt), it reduces debt.
    // For 'expense', it's just spending.
    type: text("type", { enum: ["payment", "expense"] }).notNull(),
    category: text("category").notNull(),
    date: timestamp("date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const goals = pgTable("goal", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    targetAmount: integer("target_amount").notNull(),
    currentAmount: integer("current_amount").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
