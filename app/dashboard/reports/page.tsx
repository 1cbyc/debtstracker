import { auth } from "@/auth";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import ReportsView from "@/components/reports-view";

export default async function ReportsPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userTransactions = await db.query.transactions.findMany({
        where: eq(transactions.userId, session.user.id),
        orderBy: [desc(transactions.date)],
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">financial reports</h1>
                    <p className="text-muted-foreground">analyze your progress and export data</p>
                </div>
            </div>

            <ReportsView transactions={userTransactions} />
        </div>
    );
}
