"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addTransaction } from "@/app/actions";
import { format } from "date-fns";
import { Wallet, TrendingUp, TrendingDown, Snowflake } from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface Transaction {
    id: string;
    amount: number;
    type: "income" | "expense" | "payment";
    category: string;
    date: Date;
    debtId?: string | null;
}

interface Debt {
    id: string;
    name: string;
    currentBalance: number;
}

export default function BudgetView({ transactions, debts }: { transactions: Transaction[], debts: Debt[] }) {
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("general");
    const [type, setType] = useState<"income" | "expense" | "payment">("expense");
    const [selectedDebtId, setSelectedDebtId] = useState<string>("");
    const [currency, setCurrency] = useState<"NGN" | "USD" | "GBP">("NGN");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalInternalDebtPayments = transactions
        .filter(t => t.type === "payment")
        .reduce((sum, t) => sum + t.amount, 0);

    const freeCashFlow = totalIncome - totalExpenses - totalInternalDebtPayments;

    const formatMoney = (cents: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(cents / 100);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("amount", amount);
            formData.append("type", type);
            formData.append("category", category);
            formData.append("currency", currency);
            if (type === "payment" && selectedDebtId) {
                formData.append("debtId", selectedDebtId);
            }

            const result = await addTransaction(formData);
            if (result?.error) {
                showToast("error", "Error logging transaction", result.error);
            } else {
                showToast("success", "Transaction logged", `${type} of ${currency} ${amount} recorded successfully.`);
                setAmount("");
                setCategory("general");
            }
        } catch (error) {
            console.error(error);
            showToast("error", "Error logging transaction", "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">monthly income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(totalIncome)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">monthly expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMoney(totalExpenses + totalInternalDebtPayments)}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatMoney(totalInternalDebtPayments)} to debt
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">free cash flow</CardTitle>
                        <Wallet className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${freeCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatMoney(freeCashFlow)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>add transaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    type="button"
                                    variant={type === "income" ? "default" : "outline"}
                                    onClick={() => setType("income")}
                                    className="w-full"
                                >
                                    income
                                </Button>
                                <Button
                                    type="button"
                                    variant={type === "expense" ? "default" : "outline"}
                                    onClick={() => setType("expense")}
                                    className="w-full"
                                >
                                    expense
                                </Button>
                                <Button
                                    type="button"
                                    variant={type === "payment" ? "default" : "outline"}
                                    onClick={() => setType("payment")}
                                    className="w-full gap-1"
                                >
                                    <Snowflake className="h-3 w-3" /> snowflake
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">amount</label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value as "NGN" | "USD" | "GBP")}
                                    >
                                        <option value="NGN">NGN</option>
                                        <option value="USD">USD</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        placeholder="0.00"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            {type === "payment" ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">apply to debt</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={selectedDebtId}
                                        onChange={(e) => setSelectedDebtId(e.target.value)}
                                        required
                                    >
                                        <option value="">select a debt...</option>
                                        {debts.map(d => (
                                            <option key={d.id} value={d.id}>{d.name} (${(d.currentBalance / 100).toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">category</label>
                                    <Input
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="e.g. Salary, Groceries"
                                        required
                                    />
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "logging..." : `log ${type}`}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>recent history</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {transactions.slice(0, 5).map(t => (
                                <div key={t.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                    <div>
                                        <div className="font-medium">{t.category || (t.type === "payment" ? "Debt Payment" : "Misc")}</div>
                                        <div className="text-xs text-muted-foreground">{format(new Date(t.date), "MMM d, yyyy")}</div>
                                    </div>
                                    <div className={`font-bold ${t.type === "income" ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === "income" ? "+" : "-"}{formatMoney(t.amount)}
                                    </div>
                                </div>
                            ))}
                            {transactions.length === 0 && <div className="text-center text-muted-foreground py-4">no transactions yet</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
