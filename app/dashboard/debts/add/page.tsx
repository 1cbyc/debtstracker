import { AddDebtForm } from "@/components/add-debt-form";

export default function AddDebtPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">add new debt</h1>
                <p className="text-muted-foreground">record a new financial obligation.</p>
            </div>
            <AddDebtForm />
        </div>
    );
}
