"use client";

import { editGoal } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    currency: string;
}

export function EditGoalForm({ goal }: { goal: Goal }) {
    const [pending, setPending] = useState(false);
    const { showToast } = useToast();
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        if (pending) return;
        setPending(true);
        try {
            const result = await editGoal(goal.id, formData);
            if (result?.error) {
                showToast("error", "Error updating goal", result.error);
                setPending(false);
            } else {
                showToast("success", "Goal updated successfully", "Your savings goal has been updated.");
                router.push("/dashboard/goals");
            }
        } catch (e) {
            console.error(e);
            showToast("error", "Error updating goal", "Something went wrong. Please try again.");
            setPending(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    goal name
                </label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    defaultValue={goal.name}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="e.g. relocation fund"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="currency" className="text-sm font-medium leading-none">
                        currency
                    </label>
                    <select
                        name="currency"
                        id="currency"
                        required
                        defaultValue={goal.currency}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="NGN">ngn</option>
                        <option value="USD">usd</option>
                        <option value="GBP">gbp</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="targetAmount" className="text-sm font-medium leading-none">
                        target amount
                    </label>
                    <input
                        type="number"
                        name="targetAmount"
                        id="targetAmount"
                        required
                        step="0.01"
                        defaultValue={(goal.targetAmount / 100).toString()}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="currentAmount" className="text-sm font-medium leading-none">
                    current saved
                </label>
                <input
                    type="number"
                    name="currentAmount"
                    id="currentAmount"
                    required
                    step="0.01"
                    defaultValue={(goal.currentAmount / 100).toString()}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </div>

            <div className="flex gap-4">
                <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => router.push("/dashboard/goals")}
                >
                    cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={pending}>
                    {pending ? "updating..." : "update goal"}
                </Button>
            </div>
        </form>
    );
}