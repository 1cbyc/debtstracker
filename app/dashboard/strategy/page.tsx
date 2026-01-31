import { auth } from "@/auth";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import StrategyView from "@/components/strategy-view";
import type { DebtWithExtras } from "@/lib/strategy";

export default async function StrategyPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userDebts = await db.query.debts.findMany({
        where: eq(debts.userId, session.user.id),
        orderBy: [desc(debts.priority)],
    });

    // Convert to enhanced debt type for strategy calculations
    // Client components cannot accept BigInt directly via props, so we convert to numbers
    const enhancedDebts: DebtWithExtras[] = userDebts.map(debt => ({
        id: debt.id,
        name: debt.name,
        totalAmount: Number(debt.totalAmount),
        currentBalance: Number(debt.currentBalance),
        currency: debt.currency,
        priority: debt.priority as 'high' | 'medium' | 'low',
        interestRate: debt.interestRate,
        minimumPayment: Number(debt.minimumPayment),
        dueDate: debt.dueDate,
    }));

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Strategy Engine</h1>
                    <p className="text-muted-foreground">
                        Optimize your debt payoff with avalanche or snowball methods
                    </p>
                </div>
            </div>

            <StrategyView debts={enhancedDebts} />
        </div>
    );
}
