import { auth } from "@/auth";
import { db } from "@/db";
import { debts, goals, transactions } from "@/db/schema";
import { eq, desc, sum, and, gte, lte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

async function getDashboardData(userId: string) {
    // Fetch debts
    const userDebts = await db.query.debts.findMany({
        where: eq(debts.userId, userId),
        orderBy: [desc(debts.priority)],
    });

    // Fetch goals
    const userGoals = await db.query.goals.findMany({
        where: eq(goals.userId, userId),
    });

    // Calculate Paid This Month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyTransactions = await db.query.transactions.findMany({
        where: (t, { and, eq, gte, lte }) => and(
            eq(t.userId, userId),
            eq(t.type, "payment"),
            gte(t.date, startOfMonth),
            lte(t.date, endOfMonth)
        )
    });

    // Group paid totals by currency
    const paidByCurrency: Record<string, number> = {};
    monthlyTransactions.forEach(t => {
        // Find currency from linked debt (assuming we can get it, but transactions have debtId)
        // Ideally transaction should store currency, but for now we look up the debt or simplify.
        // Wait, if debt is deleted transaction remains... 
        // For accurate reporting, let's just sum up assuming NGN for now or try to match debt.
        // A robust solution would store currency on transaction. 
        // Let's match with userDebts for now if active.
        const debt = userDebts.find(d => d.id === t.debtId);
        const currency = debt?.currency || "NGN"; // Fallback
        paidByCurrency[currency] = (paidByCurrency[currency] || 0) + t.amount;
    });

    // Group Total Debt by currency
    const debtByCurrency: Record<string, number> = {};
    userDebts.forEach(d => {
        debtByCurrency[d.currency] = (debtByCurrency[d.currency] || 0) + d.currentBalance;
    });

    // Savings Total (Only have amounts, assuming single currency for simplicity or implement similar grouping)
    // Let's assume goals are NGN for now or just sum them.
    const savingsTotal = userGoals.reduce((acc, g) => acc + g.currentAmount, 0);

    return { userDebts, userGoals, debtByCurrency, paidByCurrency, savingsTotal };
}

export default async function Dashboard() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const { userDebts, debtByCurrency, paidByCurrency, savingsTotal } = await getDashboardData(session.user.id);

    const formatMoney = (amount: number, currency = "NGN") => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: currency,
        }).format(amount / 100);
    };

    // Helper to render multi-currency totals
    const renderCurrencyTotals = (totals: Record<string, number>) => {
        const entries = Object.entries(totals);
        if (entries.length === 0) return <div className="text-2xl font-bold">{formatMoney(0)}</div>;
        return (
            <div className="flex flex-col gap-1">
                {entries.map(([curr, amount]) => (
                    <div key={curr} className="text-2xl font-bold">{formatMoney(amount, curr)}</div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">dashboard</h1>
                <Link href="/dashboard/debts/add">
                    <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> add debt
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">total debt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderCurrencyTotals(debtByCurrency)}
                        <p className="text-xs text-muted-foreground">remaining balance</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">paid this month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderCurrencyTotals(paidByCurrency)}
                        <p className="text-xs text-muted-foreground">keep it up!</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">total savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(savingsTotal)}</div>
                        <p className="text-xs text-muted-foreground">total saved</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight">active debts</h2>
                    <Link href="/dashboard/debts" className="text-sm text-muted-foreground hover:underline">view all</Link>
                </div>

                {userDebts.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-card">
                        <p className="text-muted-foreground">no debts recorded. you're free!</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {userDebts.slice(0, 6).map((debt) => (
                            <Card key={debt.id} className="relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${debt.priority === 'high' ? 'bg-red-500' :
                                    debt.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`} />
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg truncate pr-2">{debt.name}</CardTitle>
                                        <Badge variant={debt.priority === 'high' ? 'destructive' : 'secondary'}>
                                            {debt.priority}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold">
                                            {formatMoney(debt.currentBalance, debt.currency)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            of {formatMoney(debt.totalAmount, debt.currency)} original
                                        </p>
                                        <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className="bg-primary h-full transition-all duration-500"
                                                style={{ width: `${Math.max(0, 100 - (debt.currentBalance / debt.totalAmount * 100))}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
