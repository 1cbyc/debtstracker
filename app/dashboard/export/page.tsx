import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import { debts, goals } from "@/db/schema";
import { eq } from "drizzle-orm";
import DataExport from "@/components/data-export";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
    title: "Data Export | Debt Tracker",
    description: "Export your debt tracking data for backup, analysis, or migration",
};

async function DataExportContent() {
    const session = await auth();
    if (!session?.user?.id) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Please log in to export your data.</p>
                </CardContent>
            </Card>
        );
    }

    const [userDebts, userGoals] = await Promise.all([
        db.query.debts.findMany({
            where: eq(debts.userId, session.user.id),
        }),
        db.query.goals.findMany({
            where: eq(goals.userId, session.user.id),
        }).catch(() => []), // Handle case gracefully
    ]);

    return <DataExport debts={userDebts} goals={userGoals} />;
}

export default function DataExportPage() {
    return (
        <div className="container max-w-7xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Data Export</h1>
                <p className="text-muted-foreground">
                    Export your debt tracking data for backup, analysis, or migration to other tools.
                </p>
            </div>

            <Suspense fallback={
                <Card>
                    <CardContent className="p-8 text-center">
                        <div className="animate-pulse">Loading export options...</div>
                    </CardContent>
                </Card>
            }>
                <DataExportContent />
            </Suspense>
        </div>
    );
}