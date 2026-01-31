import {
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    boolean,
    primaryKey,
    bigint,
    index,
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
    // Storing amounts in cents/lowest unit. Using bigint for values > 2B.
    totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
    currentBalance: bigint("current_balance", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(), // NGN, USD, GBP
    priority: text("priority", { enum: ["high", "medium", "low"] }).notNull(),
    interestRate: integer("interest_rate").default(0).notNull(), // Basis points: 500 = 5.00%
    minimumPayment: bigint("minimum_payment", { mode: "number" }).default(0).notNull(), // Cents
    dueDate: timestamp("next_payment_date", { mode: "date" }).notNull(), // Specific date for next payment
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
    index("debts_user_id_idx").on(table.userId),
    index("debts_priority_idx").on(table.priority),
    index("debts_due_date_idx").on(table.dueDate),
]);

export const transactions = pgTable("transaction", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    debtId: uuid("debt_id").references(() => debts.id, { onDelete: "set null" }), // Optional, can be a general expense
    amount: bigint("amount", { mode: "number" }).notNull(), // Positive for payment/income, negative for expense? Or just value with type.
    currency: varchar("currency", { length: 3 }).notNull(), // NGN, USD, GBP - required for multi-currency support
    // Actually, usually transactions are "out" or "in".
    // For 'payment' (towards debt), it reduces debt.
    // For 'expense', it's just spending.
    type: text("type", { enum: ["payment", "expense", "income"] }).notNull(),
    category: text("category").notNull(),
    date: timestamp("date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("transactions_user_id_idx").on(table.userId),
    index("transactions_debt_id_idx").on(table.debtId),
    index("transactions_date_idx").on(table.date),
    index("transactions_type_idx").on(table.type),
]);

export const goals = pgTable("goal", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    targetAmount: bigint("target_amount", { mode: "number" }).notNull(),
    currentAmount: bigint("current_amount", { mode: "number" }).notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull(), // NGN, USD, GBP
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
    index("goals_user_id_idx").on(table.userId),
]);
