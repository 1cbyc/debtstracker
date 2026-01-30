"use client";

import { addGoal } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddGoalForm() {
    const [pending, setPending] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        if (pending) return;
        setPending(true);
        try {
            await addGoal(formData);
            router.push("/dashboard/goals");
        } catch (e) {
            console.error(e);
            alert("Error adding goal");
            setPending(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none">
                    goal name
                </label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="e.g. relocation fund"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="targetAmount" className="text-sm font-medium leading-none">
                    target amount (ngn)
                </label>
                <input
                    type="number"
                    name="targetAmount"
                    id="targetAmount"
                    required
                    step="0.01"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="currentAmount" className="text-sm font-medium leading-none">
                    current saved (ngn)
                </label>
                <input
                    type="number"
                    name="currentAmount"
                    id="currentAmount"
                    required
                    step="0.01"
                    defaultValue="0"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "saving..." : "create goal"}
            </Button>
        </form>
    );
}
