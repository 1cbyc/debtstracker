"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculatePayoff, Debt, Strategy } from "@/lib/strategy";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface StrategyViewProps {
    debts: Debt[];
}

function BurndownChart({ data }: { data: Record<number, number> }) {
    const chartData = Object.entries(data).map(([month, balance]) => ({
        month: Number(month),
        balance: balance / 100, // Convert to units
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis
                    dataKey="month"
                    tickFormatter={(m) => `M${m}`}
                    stroke="#888"
                    fontSize={12}
                />
                <YAxis
                    stroke="#888"
                    fontSize={12}
                    tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                    labelFormatter={(label) => `Month ${label}`}
                    formatter={(val: number | undefined) => [`$${(val || 0).toFixed(2)}`, "Balance"]}
                />
                <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorBalance)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export default function StrategyView({ debts }: StrategyViewProps) {
    const [extraPayment, setExtraPayment] = useState(0); // input in units (not cents)
    const [strategy, setStrategy] = useState<Strategy>("snowball");

    const result = useMemo(() => {
        return calculatePayoff(debts, extraPayment * 100, strategy);
    }, [debts, extraPayment, strategy]);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD", // Defaulting to USD for view, ideally passed in
        }).format(amount / 100);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    const formatMonths = (months: number) => {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (years === 0) return `${months} months`;
        return `${years}y ${remainingMonths}m`;
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle>strategy configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">monthly extra payment</label>
                            <Input
                                type="number"
                                value={extraPayment}
                                onChange={(e) => setExtraPayment(Number(e.target.value))}
                                min="0"
                                step="10"
                            />
                            <p className="text-xs text-muted-foreground">amount on top of minimums</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">payoff method</label>
                            <div className="flex gap-2">
                                <Button
                                    variant={strategy === "snowball" ? "default" : "outline"}
                                    onClick={() => setStrategy("snowball")}
                                    className="w-full"
                                >
                                    snowball (lowest balance)
                                </Button>
                                <Button
                                    variant={strategy === "avalanche" ? "default" : "outline"}
                                    onClick={() => setStrategy("avalanche")}
                                    className="w-full"
                                >
                                    avalanche (highest interest)
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Outcome */}
                <Card className="bg-primary text-primary-foreground border-none">
                    <CardHeader>
                        <CardTitle className="text-primary-foreground/90">debt free date</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-bold tracking-tight">
                            {formatDate(result.payoffDate)}
                        </div>
                        <Badge variant="secondary" className="text-lg py-1 px-4">
                            {formatMonths(result.debtResults[result.debtResults.length - 1]?.monthsToPayoff || 0)} to freedom
                        </Badge>
                        <div className="pt-4 border-t border-primary-foreground/20">
                            <div className="flex justify-between items-center text-sm">
                                <span>total interest to be paid:</span>
                                <span className="font-bold text-lg">{formatMoney(result.totalInterest)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Burndown Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>debt reduction curve</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] w-full p-4">
                    <div className="w-full h-full relative">
                        <BurndownChart data={result.amortization} />
                    </div>
                </CardContent>
            </Card>

            {/* Payoff Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle>payoff timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {result.debtResults.sort((a, b) => a.monthsToPayoff - b.monthsToPayoff).map((res) => {
                            const debt = debts.find(d => d.id === res.debtId);
                            return (
                                <div key={res.debtId} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full shrink-0">
                                            {debts.findIndex(d => d.id === res.debtId) + 1}
                                        </Badge>
                                        <div>
                                            <div className="font-bold lowercase">{debt?.name}</div>
                                            <div className="text-xs text-muted-foreground">{formatMoney(debt?.currentBalance || 0)} initially</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-right">
                                        <div className="hidden sm:block">
                                            <div className="text-sm font-medium">{formatDate(res.payoffDate)}</div>
                                            <div className="text-xs text-muted-foreground">{formatMonths(res.monthsToPayoff)}</div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card >
        </div >
    );
}
