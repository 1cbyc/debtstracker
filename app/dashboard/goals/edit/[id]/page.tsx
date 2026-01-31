import { auth } from "@/auth";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { EditGoalForm } from "@/components/edit-goal-form";
import { redirect } from "next/navigation";

export default async function EditGoalPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const goal = await db.query.goals.findFirst({
        where: and(eq(goals.id, params.id), eq(goals.userId, session.user.id)),
    });

    if (!goal) {
        redirect("/dashboard/goals");
    }

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">edit goal</h1>
                <p className="text-muted-foreground">update your savings goal</p>
            </div>
            <EditGoalForm goal={goal} />
        </div>
    );
}