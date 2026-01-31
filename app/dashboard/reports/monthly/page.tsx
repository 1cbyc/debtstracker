import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import { debts, goals } from "@/db/schema";
import { eq } from "drizzle-orm";
import MonthlyReports from "@/components/monthly-reports";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
    title: "Monthly Reports | Debt Tracker",
    description: "View comprehensive monthly financial reports and track your debt reduction progress",
};

async function MonthlyReportsContent() {
    const session = await auth();
    if (!session?.user?.id) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Please log in to view your reports.</p>
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
                    <p className="text-muted-foreground">No debts found. Add some debts first to generate monthly reports.</p>
                </CardContent>
            </Card>
        );
    }

    return <MonthlyReports debts={userDebts} />;
}

export default function MonthlyReportsPage() {
    return (
        <div className="container max-w-7xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Monthly Reports</h1>
                <p className="text-muted-foreground">
                    Comprehensive monthly summaries of your debt reduction progress and financial insights.
                </p>
            </div>

            <Suspense fallback={
                <Card>
                    <CardContent className="p-8 text-center">
                        <div className="animate-pulse">Loading monthly reports...</div>
                    </CardContent>
                </Card>
            }>
                <MonthlyReportsContent />
            </Suspense>
        </div>
    );
}