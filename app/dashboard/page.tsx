import { auth } from "@/auth";
import { db } from "@/db";
import { debts, goals, transactions } from "@/db/schema";
import { eq, desc, sum, and, gte, lte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import FinancialHealthMetrics from "@/components/financial-health-metrics";

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

    // Calculate current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch only current month transactions from database
    const monthlyTransactions = await db.query.transactions.findMany({
        where: and(
            eq(transactions.userId, userId),
            gte(transactions.date, startOfMonth),
            lte(transactions.date, endOfMonth)
        ),
        orderBy: [desc(transactions.date)],
    });

    // Separate by transaction type
    const monthlyPayments = monthlyTransactions.filter(t => t.type === "payment");
    const monthlyIncomeTransactions = monthlyTransactions.filter(t => t.type === "income");

    // Calculate monthly income for health metrics
    const monthlyIncome = monthlyIncomeTransactions
        .reduce((acc, t) => {
            acc[t.currency] = (acc[t.currency] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    // Group paid totals by currency
    const paidByCurrency: Record<string, number> = {};
    monthlyPayments.forEach(t => {
        paidByCurrency[t.currency] = (paidByCurrency[t.currency] || 0) + t.amount;
    });

    // Group Total Debt by currency
    const debtByCurrency: Record<string, number> = {};
    userDebts.forEach(d => {
        debtByCurrency[d.currency] = (debtByCurrency[d.currency] || 0) + d.currentBalance;
    });

    // Calculate goals achievements
    const goalsAchieved = userGoals.filter(g => g.currentAmount >= g.targetAmount).length;

    // Savings Total grouped by currency
    const savingsByCurrency: Record<string, number> = {};
    userGoals.forEach(g => {
        savingsByCurrency[g.currency] = (savingsByCurrency[g.currency] || 0) + g.currentAmount;
    });
    
    // For simplicity, use NGN total for now
    const totalSavings = savingsByCurrency.NGN || 0;

    return { 
        userDebts, 
        userGoals, 
        debtByCurrency, 
        paidByCurrency, 
        totalSavings,
        monthlyIncome,
        goalsAchieved
    };
}

export default async function Dashboard() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const { 
        userDebts, 
        userGoals, 
        debtByCurrency, 
        paidByCurrency, 
        totalSavings,
        monthlyIncome,
        goalsAchieved
    } = await getDashboardData(session.user.id);

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
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <Link href="/dashboard/debts/add">
                    <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Add Debt
                    </Button>
                </Link>
            </div>

            {/* Financial Health Analytics */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Financial Health Overview</h2>
                <FinancialHealthMetrics
                    totalDebt={debtByCurrency}
                    totalSavings={totalSavings}
                    monthlyPayments={paidByCurrency}
                    monthlyIncome={monthlyIncome}
                    debtCount={userDebts.length}
                    goalsAchieved={goalsAchieved}
                    totalGoals={userGoals.length}
                />
            </div>

            {/* Quick Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderCurrencyTotals(debtByCurrency)}
                        <p className="text-xs text-muted-foreground">remaining balance</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderCurrencyTotals(paidByCurrency)}
                        <p className="text-xs text-muted-foreground">keep it up!</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(totalSavings)}</div>
                        <p className="text-xs text-muted-foreground">total saved</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight">Active Debts</h2>
                    <Link href="/dashboard/debts" className="text-sm text-muted-foreground hover:underline">View All</Link>
                </div>

                {userDebts.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-card">
                        <p className="text-muted-foreground">No debts recorded. You're financially free!</p>
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
                                        <div className="flex items-center gap-2">
                                            <Badge variant={debt.priority === 'high' ? 'destructive' : 'secondary'}>
                                                {debt.priority}
                                            </Badge>
                                            <div className="flex gap-1">
                                                <Link href={`/dashboard/debts/edit/${debt.id}`}>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                        <span className="sr-only">Edit</span>
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                </Link>
                                                <form action={async () => {
                                                    "use server";
                                                    const { deleteDebt } = await import("@/app/actions");
                                                    await deleteDebt(debt.id);
                                                }} className="inline">
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700">
                                                        <span className="sr-only">Delete</span>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
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
                                        <div className="text-xs text-muted-foreground">
                                            {Math.max(0, 100 - (debt.currentBalance / debt.totalAmount * 100)).toFixed(1)}% paid off
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
