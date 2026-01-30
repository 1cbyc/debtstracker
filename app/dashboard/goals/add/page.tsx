import { AddGoalForm } from "@/components/add-goal-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AddGoalPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/goals">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">set new goal</h1>
            </div>

            <div className="border rounded-lg p-6 bg-card">
                <AddGoalForm />
            </div>
        </div>
    );
}
