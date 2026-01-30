"use client";

import { addDebt } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Need to create Input
import { Label } from "@/components/ui/label"; // Need to create Label
import { useState } from "react";
import { useRouter } from "next/navigation";

// I need Input and Label components. I will create them inline or separate.
// To save tools, I'll simulate them with HTML for now or create them in next step.
// I'll assume they exist or use standard HTML with tailwind classes.
// User wants Shadcn UI. I should probably create them.
// Let's create them in this step if possible, or use standard HTML.
// I will use standard HTML with valid tailwind classes looking like shadcn.

export function AddDebtForm() {
    const [pending, setPending] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        if (pending) return;
        setPending(true);
        try {
            await addDebt(formData);
            router.push("/dashboard");
        } catch (e) {
            console.error(e);
            alert("Error adding debt");
            setPending(false); // Only reset on error, otherwise we are redirecting
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    debt name
                </label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="e.g. bank loan"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="totalAmount" className="text-sm font-medium leading-none">
                        total amount
                    </label>
                    <input
                        type="number"
                        name="totalAmount"
                        id="totalAmount"
                        required
                        step="0.01"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="currentBalance" className="text-sm font-medium leading-none">
                        current balance
                    </label>
                    <input
                        type="number"
                        name="currentBalance"
                        id="currentBalance"
                        required
                        step="0.01"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="currency" className="text-sm font-medium leading-none">
                        currency
                    </label>
                    <select
                        name="currency"
                        id="currency"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="NGN">ngn</option>
                        <option value="USD">usd</option>
                        <option value="GBP">gbp</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="priority" className="text-sm font-medium leading-none">
                        priority
                    </label>
                    <select
                        name="priority"
                        id="priority"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                    </select>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "saving..." : "add debt"}
            </Button>
        </form>
    );
}
