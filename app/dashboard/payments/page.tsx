import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { eq } from "drizzle-orm";
import PaymentSchedule from "@/components/payment-schedule";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
    title: "Payment Schedule | Debt Tracker",
    description: "Manage payment schedules and reminders for your debts",
};

async function PaymentScheduleContent() {
    const session = await auth();
    if (!session?.user?.id) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Please log in to manage payment schedules.</p>
                </CardContent>
            </Card>
        );
    }

    const userDebts = await db.query.debts.findMany({
        where: eq(debts.userId, session.user.id),
    });

    if (userDebts.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No debts found. Add some debts first to set up payment schedules.</p>
                </CardContent>
            </Card>
        );
    }

    return <PaymentSchedule debts={userDebts} />;
}

export default function PaymentSchedulePage() {
    return (
        <div className="container max-w-7xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Payment Schedule</h1>
                <p className="text-muted-foreground">
                    Set up automatic payment reminders and manage your debt payment schedule.
                </p>
            </div>

            <Suspense fallback={
                <Card>
                    <CardContent className="p-8 text-center">
                        <div className="animate-pulse">Loading payment schedules...</div>
                    </CardContent>
                </Card>
            }>
                <PaymentScheduleContent />
            </Suspense>
        </div>
    );
}