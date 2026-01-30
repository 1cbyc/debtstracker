import { auth } from "@/auth";
import { db } from "@/db";
import { debts, goals } from "@/db/schema";
import { eq, desc, sum } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

async function getDashboardData(userId: string) {
    const userDebts = await db.query.debts.findMany({
        where: eq(debts.userId, userId),
        orderBy: [desc(debts.priority)],
    });

    const userGoals = await db.query.goals.findMany({
        where: eq(goals.userId, userId),
    });

    // Calculate totals (simple sum of current balances, ignore currency mix for summary for now)
    // Real app should handle multi-currency totals properly.
    const totalDebt = userDebts.reduce((acc, debt) => acc + debt.currentBalance, 0);

    return { userDebts, userGoals, totalDebt };
}

export default async function Dashboard() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const { userDebts, userGoals, totalDebt } = await getDashboardData(session.user.id);

    const formatMoney = (amount: number, currency = "NGN") => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: currency,
        }).format(amount / 100);
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
                        <div className="text-2xl font-bold">{formatMoney(totalDebt)}</div>
                        <p className="text-xs text-muted-foreground">across all currencies</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">paid this month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(0)}</div>
                        <p className="text-xs text-muted-foreground">+0% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">relocation savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(0)}</div>
                        <p className="text-xs text-muted-foreground">target: {formatMoney(0)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">active debts</h2>
                {userDebts.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                        <p className="text-muted-foreground">no debts recorded. you're free!</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {userDebts.map((debt) => (
                            <Card key={debt.id} className="relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${debt.priority === 'high' ? 'bg-red-500' :
                                    debt.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`} />
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{debt.name}</CardTitle>
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
                                                className="bg-primary h-full"
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
