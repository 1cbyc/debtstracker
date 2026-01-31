"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
    Calendar, 
    TrendingDown, 
    TrendingUp, 
    Download, 
    FileText, 
    DollarSign,
    Target,
    Award,
    AlertTriangle
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface MonthlyReportData {
    month: string;
    date: Date;
    totalDebt: number;
    totalPaid: number;
    interestPaid: number;
    principalPaid: number;
    debtReduction: number;
    paymentsMade: number;
    goalsAchieved: string[];
    milestones: string[];
    insights: string[];
}

interface MonthlyReportsProps {
    debts: Array<{
        id: string;
        name: string;
        currentBalance: number;
        minimumPayment: number;
        interestRate: number;
        currency: string;
    }>;
}

export default function MonthlyReports({ debts }: MonthlyReportsProps) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    
    // Generate mock report data for the last 12 months
    const reportData = useMemo(() => {
        const reports: MonthlyReportData[] = [];
        const today = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const totalDebt = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
            const monthlyPayment = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
            
            // Simulate some progress over time
            const progressFactor = (11 - i) * 0.05; // 5% reduction per month
            const adjustedDebt = totalDebt * (1 - progressFactor);
            const debtReduction = i === 11 ? 0 : totalDebt * 0.05;
            const interestPaid = adjustedDebt * 0.15 / 12; // Average 15% APR
            const principalPaid = monthlyPayment - interestPaid;
            
            reports.push({
                month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                date,
                totalDebt: adjustedDebt,
                totalPaid: monthlyPayment,
                interestPaid,
                principalPaid,
                debtReduction,
                paymentsMade: Math.floor(Math.random() * 3) + debts.length,
                goalsAchieved: i % 3 === 0 ? [`Pay extra $${Math.floor(Math.random() * 200) + 100}`] : [],
                milestones: i % 4 === 0 ? [`Paid off ${debts[Math.floor(Math.random() * debts.length)]?.name || 'Credit Card'}`] : [],
                insights: [
                    `Debt reduced by ${totalDebt > 0 ? ((debtReduction / totalDebt) * 100).toFixed(1) : '0.0'}%`,
                    `${monthlyPayment > 0 ? ((principalPaid / monthlyPayment) * 100).toFixed(1) : '0.0'}% of payments went to principal`,
                ]
            });
        }
        
        return reports.reverse();
    }, [debts]);

    const selectedReport = reportData.find(report => {
        const reportDate = new Date(report.month);
        return reportDate.getFullYear() === selectedYear && reportDate.getMonth() === selectedMonth;
    }) || reportData[reportData.length - 1];

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const getInsightIcon = (insight: string) => {
        if (insight.includes('reduced')) return <TrendingDown className="h-4 w-4 text-green-500" />;
        if (insight.includes('increased')) return <TrendingUp className="h-4 w-4 text-red-500" />;
        if (insight.includes('goal')) return <Target className="h-4 w-4 text-blue-500" />;
        return <FileText className="h-4 w-4 text-gray-500" />;
    };

    const generatePDF = () => {
        // This would integrate with a PDF library like jsPDF
        alert('PDF generation would be implemented here');
    };

    const exportData = () => {
        const csvContent = reportData.map(report => 
            `${report.month},${report.totalDebt},${report.totalPaid},${report.debtReduction}`
        ).join('\n');
        
        const blob = new Blob([`Month,Total Debt,Total Paid,Debt Reduction\n${csvContent}`], 
            { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'monthly-debt-reports.csv';
        a.click();
    };

    const currency = debts[0]?.currency || 'USD';

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Monthly Financial Reports
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                        <div>
                            <p className="text-muted-foreground mb-4">
                                Comprehensive monthly summaries of your debt reduction progress
                            </p>
                            <div className="flex gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Year</label>
                                    <select 
                                        className="p-2 border rounded-md"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    >
                                        <option value="2024">2024</option>
                                        <option value="2023">2023</option>
                                        <option value="2022">2022</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Month</label>
                                    <select 
                                        className="p-2 border rounded-md"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i} value={i}>
                                                {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={exportData} className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Export CSV
                            </Button>
                            <Button onClick={generatePDF} className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Generate PDF
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-600">Total Payments</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {formatCurrency(selectedReport.totalPaid, currency)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {selectedReport.paymentsMade} payments made
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">Debt Reduction</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {formatCurrency(selectedReport.debtReduction, currency)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {((selectedReport.debtReduction / selectedReport.totalDebt) * 100).toFixed(1)}% reduced
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <span className="text-sm font-medium text-red-600">Interest Paid</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {formatCurrency(selectedReport.interestPaid, currency)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {((selectedReport.interestPaid / selectedReport.totalPaid) * 100).toFixed(1)}% of payments
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-medium text-purple-600">Principal Paid</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {formatCurrency(selectedReport.principalPaid, currency)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {((selectedReport.principalPaid / selectedReport.totalPaid) * 100).toFixed(1)}% of payments
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Debt Reduction Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={reportData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="month" 
                                        tickFormatter={(value) => value.split(' ')[0]}
                                    />
                                    <YAxis 
                                        tickFormatter={(value) => formatCurrency(value, currency)}
                                    />
                                    <Tooltip 
                                        formatter={(value) => [formatCurrency(value as number, currency), "Total Debt"]}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="totalDebt" 
                                        stroke="#3b82f6" 
                                        fill="#3b82f6" 
                                        fillOpacity={0.1}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Payment Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData.slice(-6)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="month" 
                                        tickFormatter={(value) => value.split(' ')[0]}
                                    />
                                    <YAxis 
                                        tickFormatter={(value) => formatCurrency(value, currency)}
                                    />
                                    <Tooltip 
                                        formatter={(value) => [formatCurrency(value as number, currency)]}
                                    />
                                    <Bar dataKey="principalPaid" stackId="payments" fill="#22c55e" name="Principal" />
                                    <Bar dataKey="interestPaid" stackId="payments" fill="#ef4444" name="Interest" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Achievements & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Goals & Milestones */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Achievements This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedReport.milestones.length > 0 && (
                            <div>
                                <h4 className="font-medium text-purple-600 mb-2">Milestones Reached</h4>
                                <div className="space-y-2">
                                    {selectedReport.milestones.map((milestone, index) => (
                                        <div key={index} className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                            <Award className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm">{milestone}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedReport.goalsAchieved.length > 0 && (
                            <div>
                                <h4 className="font-medium text-green-600 mb-2">Goals Achieved</h4>
                                <div className="space-y-2">
                                    {selectedReport.goalsAchieved.map((goal, index) => (
                                        <div key={index} className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <Target className="h-4 w-4 text-green-600" />
                                            <span className="text-sm">{goal}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedReport.milestones.length === 0 && selectedReport.goalsAchieved.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No achievements this month.</p>
                                <p className="text-sm">Keep making progress to unlock milestones!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Insights */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Monthly Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {selectedReport.insights.map((insight, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    {getInsightIcon(insight)}
                                    <span className="text-sm">{insight}</span>
                                </div>
                            ))}
                        </div>

                        {/* Progress towards debt freedom */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                            <h4 className="font-medium text-green-800 mb-2">Progress This Year</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Debt Reduction</span>
                                    <span>{formatCurrency(selectedReport.debtReduction * 12, currency)}</span>
                                </div>
                                <Progress value={33} className="h-2" />
                                <div className="text-xs text-muted-foreground">
                                    33% towards your annual debt reduction goal
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Trend Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>12-Month Trend Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(
                                    reportData.reduce((sum, report) => sum + report.debtReduction, 0),
                                    currency
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Debt Reduced</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(
                                    reportData.reduce((sum, report) => sum + report.totalPaid, 0),
                                    currency
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Payments Made</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(
                                    reportData.reduce((sum, report) => sum + report.interestPaid, 0),
                                    currency
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Interest Paid</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}