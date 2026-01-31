"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculatePayoffStrategy, DebtWithExtras, PayoffStrategy, formatCurrency, getPriorityColor } from "@/lib/strategy";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingDown, Calendar, DollarSign, Lightbulb } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import WhatIfScenarios from "./what-if-scenarios";

interface StrategyViewProps {
    debts: DebtWithExtras[];
}

function BurndownChart({ data, currency }: { data: Record<number, number>, currency: string }) {
    const chartData = Object.entries(data).map(([month, balance]) => ({
        month: Number(month),
        balance: balance / 100, // Convert to display units
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis
                    dataKey="month"
                    tickFormatter={(m) => `M${m}`}
                    stroke="#9ca3af"
                    fontSize={12}
                />
                <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(val) => formatCurrency(val * 100, currency)}
                />
                <Tooltip
                    contentStyle={{ 
                        backgroundColor: "#111827", 
                        border: "1px solid #374151",
                        borderRadius: "8px"
                    }}
                    labelStyle={{ color: "#f9fafb" }}
                    labelFormatter={(label) => `Month ${label}`}
                    formatter={(val: number | undefined) => [
                        formatCurrency((val || 0) * 100, currency), 
                        "Remaining Balance"
                    ]}
                />
                <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorBalance)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

function PaymentBreakdown({ monthlyPlan }: { monthlyPlan: any[] }) {
    const chartData = monthlyPlan.slice(0, 12).map((month) => ({
        month: `M${month.month}`,
        interest: month.payments.reduce((sum: number, p: any) => sum + p.interestPortion, 0) / 100,
        principal: month.payments.reduce((sum: number, p: any) => sum + p.principalPortion, 0) / 100,
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                    contentStyle={{ 
                        backgroundColor: "#111827", 
                        border: "1px solid #374151",
                        borderRadius: "8px"
                    }}
                    formatter={(val: number | undefined) => [`$${(val || 0).toFixed(2)}`, ""]}
                />
                <Bar dataKey="principal" stackId="payments" fill="#22c55e" name="Principal" />
                <Bar dataKey="interest" stackId="payments" fill="#ef4444" name="Interest" />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default function StrategyView({ debts }: StrategyViewProps) {
    const [extraPayment, setExtraPayment] = useState(0); // input in units (not cents)
    const [strategy, setStrategy] = useState<PayoffStrategy>("snowball");
    const [currency, setCurrency] = useState<string>(debts[0]?.currency || "USD");

    const result = useMemo(() => {
        if (!debts.length) return null;
        return calculatePayoffStrategy(debts, extraPayment * 100, strategy);
    }, [debts, extraPayment, strategy]);

    const amortizationData = useMemo(() => {
        if (!result) return {};
        return result.monthlyPlan.reduce((acc, month, index) => {
            acc[index] = month.remainingTotalDebt;
            return acc;
        }, {} as Record<number, number>);
    }, [result]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    const formatMonths = (months: number) => {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (years === 0) return `${months} months`;
        if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
        return `${years}y ${remainingMonths}m`;
    };

    if (!result || debts.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No debts to analyze. Add some debts to see your payoff strategy.</p>
                </CardContent>
            </Card>
        );
    }

    const totalDebtAmount = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const finalPayoffDate = result.monthlyPlan[result.monthlyPlan.length - 1]?.date || new Date();

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle>Strategy Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Extra Monthly Payment</label>
                            <Input
                                type="number"
                                value={extraPayment}
                                onChange={(e) => setExtraPayment(Number(e.target.value))}
                                min="0"
                                step="10"
                            />
                            <p className="text-xs text-muted-foreground">Amount on top of minimum payments</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Payoff Strategy</label>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant={strategy === "snowball" ? "default" : "outline"}
                                    onClick={() => setStrategy("snowball")}
                                    className="w-full justify-start text-left"
                                    size="sm"
                                >
                                    <div>
                                        <div className="font-medium">Debt Snowball</div>
                                        <div className="text-xs text-muted-foreground">Pay off smallest balances first</div>
                                    </div>
                                </Button>
                                <Button
                                    variant={strategy === "avalanche" ? "default" : "outline"}
                                    onClick={() => setStrategy("avalanche")}
                                    className="w-full justify-start text-left"
                                    size="sm"
                                >
                                    <div>
                                        <div className="font-medium">Debt Avalanche</div>
                                        <div className="text-xs text-muted-foreground">Pay off highest interest rates first</div>
                                    </div>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Statistics */}
                <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none">
                    <CardHeader>
                        <CardTitle className="text-white/90 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Debt Freedom Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-3xl font-bold tracking-tight">
                            {formatDate(finalPayoffDate)}
                        </div>
                        <Badge variant="secondary" className="text-lg py-1 px-4 text-blue-900 bg-blue-100">
                            {formatMonths(result.totalMonths)} to freedom
                        </Badge>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                            <div>
                                <div className="text-sm text-white/70">Total Interest</div>
                                <div className="font-bold">{formatCurrency(result.totalInterest, currency)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-white/70">Interest Savings</div>
                                <div className="font-bold text-green-200">
                                    {formatCurrency(result.savings.vsMinimum, currency)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* What-If Scenarios */}
            <WhatIfScenarios debts={debts} />

            {/* Debt Burndown Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Debt Reduction Timeline</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] w-full p-4">
                    <BurndownChart data={amortizationData} currency={currency} />
                </CardContent>
            </Card>

            {/* Payment Breakdown Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>First 12 Months: Principal vs Interest</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] w-full p-4">
                    <PaymentBreakdown monthlyPlan={result.monthlyPlan} />
                </CardContent>
            </Card>

            {/* Detailed Payoff Plan */}
            <Card>
                <CardHeader>
                    <CardTitle>Payoff Order ({strategy} method)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {debts
                            .map((debt, index) => {
                                const payoffMonth = result.monthlyPlan.find(month => 
                                    month.payments.some(p => p.debtId === debt.id && p.isPayoff)
                                );
                                return {
                                    ...debt,
                                    payoffMonth: payoffMonth?.month || result.totalMonths,
                                    payoffDate: payoffMonth?.date || finalPayoffDate
                                };
                            })
                            .sort((a, b) => a.payoffMonth - b.payoffMonth)
                            .map((debt, order) => (
                                <div key={debt.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full shrink-0">
                                            {order + 1}
                                        </Badge>
                                        <div className="flex-1">
                                            <div className="font-semibold">{debt.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatCurrency(debt.currentBalance, debt.currency)} remaining
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="outline" className={getPriorityColor(debt.priority)}>
                                                    {debt.priority} priority
                                                </Badge>
                                                <Badge variant="outline">
                                                    {(debt.interestRate / 100).toFixed(2)}% APR
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{formatDate(debt.payoffDate)}</div>
                                        <div className="text-sm text-muted-foreground">
                                            Month {debt.payoffMonth}
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto mt-2" />
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
