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
    };

    const validatedFields = addDebtSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: "Invalid fields" };
    }

    const { name, totalAmount, currentBalance, currency, priority } = validatedFields.data;

    const totalAmountCents = Math.round(totalAmount * 100);
    const currentBalanceCents = Math.round(currentBalance * 100);

    await db.insert(debts).values({
        userId,
        name,
        totalAmount: totalAmountCents,
        currentBalance: currentBalanceCents,
        currency,
        priority,
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
