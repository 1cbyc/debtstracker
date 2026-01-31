"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { debts, goals, transactions } from "@/db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Helper to ensure authentication
async function getAuthedUser() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session.user.id;
}

// Schemas
const addDebtSchema = z.object({
    name: z.string().min(1),
    totalAmount: z.coerce.number().min(0),
    currentBalance: z.coerce.number().min(0),
    currency: z.enum(["NGN", "USD", "GBP"]),
    priority: z.enum(["high", "medium", "low"]),
    interestRate: z.coerce.number().min(0).max(100).default(0), // % entered by user
    minimumPayment: z.coerce.number().min(0).default(0), // Amount entered by user
    dueDate: z.coerce.date(), // Specific date
});

const addGoalSchema = z.object({
    name: z.string().min(1),
    targetAmount: z.coerce.number().min(0),
    currentAmount: z.coerce.number().min(0),
});

export async function addDebt(formData: FormData) {
    const userId = await getAuthedUser();

    const rawData = {
        name: formData.get("name"),
        totalAmount: formData.get("totalAmount"),
        currentBalance: formData.get("currentBalance") || formData.get("totalAmount"),
        currency: formData.get("currency"),
        priority: formData.get("priority"),
        interestRate: formData.get("interestRate"),
        minimumPayment: formData.get("minimumPayment"),
        dueDate: formData.get("dueDate"),
    };

    const validatedFields = addDebtSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: "Invalid fields" };
    }

    const { name, totalAmount, currentBalance, currency, priority, interestRate, minimumPayment, dueDate } = validatedFields.data;

    const totalAmountCents = Math.round(totalAmount * 100);
    const currentBalanceCents = Math.round(currentBalance * 100);
    const minimumPaymentCents = Math.round(minimumPayment * 100);
    const interestRateBasis = Math.round(interestRate * 100); // 1.5% -> 150

    await db.insert(debts).values({
        userId,
        name,
        totalAmount: totalAmountCents,
        currentBalance: currentBalanceCents,
        currency,
        priority,
        interestRate: interestRateBasis,
        minimumPayment: minimumPaymentCents,
        dueDate,
    });

    revalidatePath("/dashboard");
    return { success: true };
}

export async function addGoal(formData: FormData) {
    const userId = await getAuthedUser();

    const rawData = {
        name: formData.get("name"),
        targetAmount: formData.get("targetAmount"),
        currentAmount: formData.get("currentAmount") || 0,
    };

    const validatedFields = addGoalSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: "Invalid fields" };
    }

    const { name, targetAmount, currentAmount } = validatedFields.data;

    const targetAmountCents = Math.round(targetAmount * 100);
    const currentAmountCents = Math.round(currentAmount * 100);

    await db.insert(goals).values({
        userId,
        name,
        targetAmount: targetAmountCents,
        currentAmount: currentAmountCents,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/goals");
    return { success: true };
}

export async function logPayment(debtId: string, amount: number) {
    const userId = await getAuthedUser();

    const debt = await db.query.debts.findFirst({
        where: (debts, { and, eq }) => and(eq(debts.id, debtId), eq(debts.userId, userId)),
    });

    if (!debt) throw new Error("Debt not found or unauthorized");

    const amountCents = Math.round(amount * 100);

    await db.transaction(async (tx) => {
        await tx.insert(transactions).values({
            userId,
            debtId,
            amount: amountCents,
            type: "payment",
            category: "debt_repayment",
            date: new Date(),
        });

        await tx
            .update(debts)
            .set({
                currentBalance: sql`${debts.currentBalance} - ${amountCents}`,
                updatedAt: new Date()
            })
            .where(eq(debts.id, debtId));
    });

    revalidatePath("/dashboard");
}

export async function deleteDebt(debtId: string) {
    const userId = await getAuthedUser();
    await db.delete(debts).where(
        sql`${debts.id} = ${debtId} AND ${debts.userId} = ${userId}`
    );
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/debts");
}

export async function deleteGoal(goalId: string) {
    const userId = await getAuthedUser();
    await db.delete(goals).where(
        sql`${goals.id} = ${goalId} AND ${goals.userId} = ${userId}`
    );
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/goals");
}

const transactionSchema = z.object({
    amount: z.coerce.number().min(0.01),
    type: z.enum(["payment", "expense", "income"]),
    category: z.string().min(1),
    debtId: z.string().optional(),
    date: z.string().optional(), // YYYY-MM-DD
});

export async function addTransaction(formData: FormData) {
    const userId = await getAuthedUser();

    const rawData = {
        amount: formData.get("amount"),
        type: formData.get("type"),
        category: formData.get("category"),
        debtId: formData.get("debtId") || undefined,
        date: formData.get("date") || undefined,
    };

    const validated = transactionSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: "Invalid transaction data" };
    }

    const { amount, type, category, debtId, date } = validated.data;
    const amountCents = Math.round(amount * 100);
    const txDate = date ? new Date(date) : new Date();

    await db.transaction(async (tx) => {
        // Insert transaction
        await tx.insert(transactions).values({
            userId,
            debtId: debtId || null,
            amount: amountCents,
            type: type as "payment" | "expense" | "income",
            category,
            date: txDate,
        });

        // Update debt if it's a payment
        if (type === "payment" && debtId) {
            await tx
                .update(debts)
                .set({
                    currentBalance: sql`${debts.currentBalance} - ${amountCents}`,
                    updatedAt: new Date()
                })
                .where(and(eq(debts.id, debtId), eq(debts.userId, userId)));
        }
    });

    revalidatePath("/dashboard");
    return { success: true };
}
