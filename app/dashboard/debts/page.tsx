import { auth } from "@/auth";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteDebt } from "@/app/actions";

export default async function DebtsPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userDebts = await db.query.debts.findMany({
        where: eq(debts.userId, session.user.id),
        orderBy: [desc(debts.priority)],
    });

    const formatMoney = (amount: number, currency: string) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
        }).format(amount / 100);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">debts</h1>
                    <p className="text-muted-foreground">manage all your active debts</p>
                </div>
                <Link href="/dashboard/debts/add">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> add debt
                    </Button>
                </Link>
            </div>

            {userDebts.length === 0 ? (
                <div className="text-center py-20 border border-dashed rounded-lg bg-card">
                    <p className="text-muted-foreground mb-4">no active debts. clean slate!</p>
                    <div className="flex gap-4">
                        <Link href="/dashboard/debts/add">
                            <Button>add your first debt</Button>
                        </Link>
                        <Link href="/dashboard/budget">
                            <Button variant="outline">setup budget</Button>
                        </Link>
                        <Link href="/dashboard/strategy">
                            <Button variant="secondary">view strategy</Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {userDebts.map((debt) => (
                        <Card key={debt.id} className="relative overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${debt.priority === 'high' ? 'bg-red-500' :
                                debt.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`} />
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">{debt.name}</h3>
                                        <Badge variant="outline">{debt.priority}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">next due</span>
                                        <span className="font-medium">
                                            {(debt.dueDate as Date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>bal: {formatMoney(debt.currentBalance, debt.currency)}</span>
                                        <span>total: {formatMoney(debt.totalAmount, debt.currency)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground/80 lowercase">
                                        <span>apr: {(debt.interestRate / 100).toFixed(2)}%</span>
                                        <span>min: {formatMoney(debt.minimumPayment, debt.currency)}</span>
                                    </div>
                                    <div className="w-48 bg-secondary h-1.5 rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="bg-primary h-full"
                                            style={{ width: `${Math.max(0, 100 - (debt.currentBalance / debt.totalAmount * 100))}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* <Button variant="outline" size="sm">view</Button> */}
                                    <form action={async () => {
                                        "use server";
                                        await deleteDebt(debt.id);
                                    }}>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
