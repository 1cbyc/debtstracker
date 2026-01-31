import { auth } from "@/auth";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { EditDebtForm } from "@/components/edit-debt-form";
import { redirect } from "next/navigation";

export default async function EditDebtPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const debt = await db.query.debts.findFirst({
        where: and(eq(debts.id, params.id), eq(debts.userId, session.user.id)),
    });

    if (!debt) {
        redirect("/dashboard");
    }

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">edit debt</h1>
                <p className="text-muted-foreground">update your debt information</p>
            </div>
            <EditDebtForm debt={debt} />
        </div>
    );
}