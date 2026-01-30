"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { debts, goals, transactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
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
    currentBalance: z.coerce.number().min(0), // Can be same as total initially
    currency: z.enum(["NGN", "USD", "GBP"]),
    priority: z.enum(["high", "medium", "low"]),
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

    // Convert to cents/lowest unit if input is in standard units (e.g. 100.00 -> 10000)
    // For now, assuming user inputs whole numbers or we handle conversion elsewhere. 
    // Let's assume input is standard and we multiply by 100 for storage (integers).
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

export async function logPayment(debtId: string, amount: number) {
    // amount in standard units
    const userId = await getAuthedUser();

    // Verify ownership
    const debt = await db.query.debts.findFirst({
        where: (debts, { and, eq }) => and(eq(debts.id, debtId), eq(debts.userId, userId)),
    });

    if (!debt) throw new Error("Debt not found or unauthorized");

    const amountCents = Math.round(amount * 100);

    // Transaction
    await db.transaction(async (tx) => {
        // Create transaction record
        await tx.insert(transactions).values({
            userId,
            debtId,
            amount: amountCents,
            type: "payment",
            category: "debt_repayment",
            date: new Date(),
        });

        // Update debt balance
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
        // Ensure strict ownership
        sql`${debts.id} = ${debtId} AND ${debts.userId} = ${userId}`
    );
    revalidatePath("/dashboard");
}
