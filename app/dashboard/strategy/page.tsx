import { auth } from "@/auth";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import StrategyView from "@/components/strategy-view";

export default async function StrategyPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userDebts = await db.query.debts.findMany({
        where: eq(debts.userId, session.user.id),
        orderBy: [desc(debts.priority)],
    });

    // Convert decimal-ish fields to simple numbers for the client component if needed,
    // but our schema now uses bigint. 
    // Client components cannot accept BigInt directly via props usually (serialization warning).
    // We should convert BigInts to numbers (safe for cents) for the strategy engine.

    const initialDebts = userDebts.map(d => ({
        id: d.id,
        name: d.name,
        currentBalance: Number(d.currentBalance),
        interestRate: d.interestRate,
        minimumPayment: Number(d.minimumPayment),
        dueDate: d.dueDate,
    }));

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">strategy engine</h1>
                    <p className="text-muted-foreground">optimize your path to freedom</p>
                </div>
            </div>

            <StrategyView debts={initialDebts} />
        </div>
    );
}
