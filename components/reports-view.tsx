"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { format, subMonths, startOfYear, isWithinInterval, startOfDay, endOfDay } from "date-fns";

interface Transaction {
    id: string;
    amount: number;
    type: "income" | "expense" | "payment";
    category: string;
    date: Date;
    debtId?: string | null;
}

export default function ReportsView({ transactions }: { transactions: Transaction[] }) {
    const [timeRange, setTimeRange] = useState("all");

    const filteredTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        const now = new Date();

        if (timeRange === "this-month") {
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        if (timeRange === "last-3-months") {
            const threeMonthsAgo = subMonths(now, 3);
            return date >= threeMonthsAgo;
        }
        if (timeRange === "this-year") {
            return date >= startOfYear(now);
        }
        return true;
    });

    const income = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const payments = filteredTransactions.filter(t => t.type === "payment").reduce((sum, t) => sum + t.amount, 0);

    const downloadCSV = () => {
        const headers = ["Date", "Type", "Category", "Amount", "Debt ID"];
        const rows = filteredTransactions.map(t => [
            format(new Date(t.date), "yyyy-MM-dd"),
            t.type,
            t.category || "-",
            (t.amount / 100).toFixed(2),
            t.debtId || "-"
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${timeRange}-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const formatMoney = (cents: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD", // Simplification
        }).format(cents / 100);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <select
                        className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <option value="all">all time</option>
                        <option value="this-month">this month</option>
                        <option value="last-3-months">last 3 months</option>
                        <option value="this-year">this year</option>
                    </select>
                </div>
                <Button onClick={downloadCSV} className="gap-2">
                    <Download className="h-4 w-4" /> export csv
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">total income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatMoney(income)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">total expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatMoney(expenses)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">debt payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{formatMoney(payments)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>transaction details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredTransactions.slice(0, 50).map(t => (
                            <div key={t.id} className="flex justify-between items-center border-b pb-2 last:border-0 text-sm">
                                <div>
                                    <div className="font-medium">{t.category || t.type}</div>
                                    <div className="text-xs text-muted-foreground">{format(new Date(t.date), "MMM d, yyyy")}</div>
                                </div>
                                <div className={t.type === 'income' ? 'text-green-600' : ''}>
                                    {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                                </div>
                            </div>
                        ))}
                        {filteredTransactions.length === 0 && <div className="text-center py-4 text-muted-foreground">no data found</div>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
