import { auth } from "@/auth";
import { db } from "@/db";
import { debts, transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import BudgetView from "@/components/budget-view";

export default async function BudgetPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    // Fetch recent transactions (last 50? or current month?)
    // Creating a proper budget usually requires monthly filtering.
    // For "Simple monthly budget", let's fetch everything for now or limit to 50 descending.
    const userTransactions = await db.query.transactions.findMany({
        where: eq(transactions.userId, session.user.id),
        orderBy: [desc(transactions.date)],
        limit: 100,
    });

    const userDebts = await db.query.debts.findMany({
        where: eq(debts.userId, session.user.id),
        orderBy: [desc(debts.priority)],
    });

    // Convert types for Client Component
    const safeTransactions = userTransactions.map(t => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type as "income" | "expense" | "payment",
        category: t.category,
        date: t.date,
        debtId: t.debtId,
    }));

    const safeDebts = userDebts.map(d => ({
        id: d.id,
        name: d.name,
        currentBalance: Number(d.currentBalance),
        interestRate: d.interestRate,
        minimumPayment: Number(d.minimumPayment),
    }));

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">budget & snowflakes</h1>
                    <p className="text-muted-foreground">track cash flow and accelerate debt payoff</p>
                </div>
            </div>

            <BudgetView transactions={safeTransactions} debts={safeDebts} />
        </div>
    );
}
