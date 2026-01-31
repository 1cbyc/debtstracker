"use client";

import { editDebt } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Debt {
    id: string;
    name: string;
    totalAmount: number;
    currentBalance: number;
    currency: string;
    priority: string;
    interestRate: number;
    minimumPayment: number;
    dueDate: Date;
}

export function EditDebtForm({ debt }: { debt: Debt }) {
    const [pending, setPending] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        if (pending) return;
        setPending(true);
        try {
            await editDebt(debt.id, formData);
            router.push("/dashboard");
        } catch (e) {
            console.error(e);
            alert("Error updating debt");
            setPending(false);
        }
    }

    const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

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
                    defaultValue={debt.name}
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
                        defaultValue={(debt.totalAmount / 100).toString()}
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
                        defaultValue={(debt.currentBalance / 100).toString()}
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
                        defaultValue={debt.currency}
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
                        defaultValue={debt.priority}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="interestRate" className="text-sm font-medium leading-none">
                        interest rate (%)
                    </label>
                    <input
                        type="number"
                        name="interestRate"
                        id="interestRate"
                        step="0.01"
                        defaultValue={(debt.interestRate / 100).toString()}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="minimumPayment" className="text-sm font-medium leading-none">
                        minimum payment
                    </label>
                    <input
                        type="number"
                        name="minimumPayment"
                        id="minimumPayment"
                        step="0.01"
                        defaultValue={(debt.minimumPayment / 100).toString()}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium leading-none">
                    next payment due date
                </label>
                <input
                    type="date"
                    name="dueDate"
                    id="dueDate"
                    required
                    defaultValue={formatDateForInput(debt.dueDate)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </div>

            <div className="flex gap-4">
                <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => router.push("/dashboard")}
                >
                    cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={pending}>
                    {pending ? "updating..." : "update debt"}
                </Button>
            </div>
        </form>
    );
}