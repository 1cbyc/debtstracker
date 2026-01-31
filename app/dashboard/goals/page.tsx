import { auth } from "@/auth";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Target } from "lucide-react";
import Link from "next/link";
import { deleteGoal } from "@/app/actions";
import { AddGoalForm } from "@/components/add-goal-form";

export default async function GoalsPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userGoals = await db.query.goals.findMany({
        where: eq(goals.userId, session.user.id),
    });

    const formatMoney = (amount: number, currency: string = "NGN") => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: currency,
        }).format(amount / 100);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">goals</h1>
                    <p className="text-muted-foreground">track your savings and relocation targets</p>
                </div>
                <Link href="/dashboard/goals/add">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> add goal
                    </Button>
                </Link>
            </div>

            {userGoals.length === 0 ? (
                <div className="text-center py-20 border border-dashed rounded-lg bg-card">
                    <Target className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">no goals set. where do you want to be?</p>
                    <Link href="/dashboard/goals/add">
                        <Button>set a new goal</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {userGoals.map((goal) => (
                        <Card key={goal.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="font-semibold text-lg">{goal.name}</CardTitle>
                                <div className="flex gap-1">
                                    <Link href={`/dashboard/goals/edit/${goal.id}`}>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <span className="sr-only">Edit</span>
                                            ✏️
                                        </Button>
                                    </Link>
                                    <form action={async () => {
                                        "use server";
                                        await deleteGoal(goal.id);
                                    }} className="inline">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700">
                                            <span className="sr-only">Delete</span>
                                            🗑️
                                        </Button>
                                    </form>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>{formatMoney(goal.currentAmount)}</span>
                                        <span className="text-muted-foreground">target: {formatMoney(goal.targetAmount)}</span>
                                    </div>
                                    <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-green-500 h-full transition-all"
                                            style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount * 100))}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-right text-muted-foreground pt-1">
                                        {Math.round((goal.currentAmount / goal.targetAmount) * 100)}% achieved
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
