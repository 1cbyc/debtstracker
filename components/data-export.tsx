"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Download, 
    FileText, 
    FileSpreadsheet, 
    Database,
    Calendar,
    CreditCard,
    Target,
    Settings,
    Check
} from "lucide-react";

interface ExportOptions {
    dateRange: 'all' | 'year' | '6months' | '3months' | 'month';
    format: 'csv' | 'json' | 'pdf';
    includeDebts: boolean;
    includeGoals: boolean;
    includePayments: boolean;
    includeReports: boolean;
}

interface DataExportProps {
    debts: Array<{
        id: string;
        name: string;
        currentBalance: number;
        minimumPayment: number;
        interestRate: number;
        currency: string;
        createdAt: Date;
    }>;
    goals?: Array<{
        id: string;
        name: string;
        targetAmount: number;
        currentAmount: number;
        currency: string;
        createdAt: Date;
    }>;
}

export default function DataExport({ debts, goals = [] }: DataExportProps) {
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        dateRange: 'all',
        format: 'csv',
        includeDebts: true,
        includeGoals: true,
        includePayments: false,
        includeReports: false,
    });
    const [isExporting, setIsExporting] = useState(false);
    const [lastExport, setLastExport] = useState<Date | null>(null);

    const getDateRangeLabel = (range: string) => {
        switch (range) {
            case 'all': return 'All Time';
            case 'year': return 'Last 12 Months';
            case '6months': return 'Last 6 Months';
            case '3months': return 'Last 3 Months';
            case 'month': return 'Last Month';
            default: return 'All Time';
        }
    };

    const getFormatIcon = (format: string) => {
        switch (format) {
            case 'csv': return <FileSpreadsheet className="h-4 w-4" />;
            case 'json': return <Database className="h-4 w-4" />;
            case 'pdf': return <FileText className="h-4 w-4" />;
            default: return <FileSpreadsheet className="h-4 w-4" />;
        }
    };

    const exportData = async (customOptions = exportOptions) => {
        setIsExporting(true);
        
        try {
            // Simulate export delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const data = {
                exportInfo: {
                    timestamp: new Date().toISOString(),
                    dateRange: customOptions.dateRange,
                    format: customOptions.format,
                },
                debts: customOptions.includeDebts ? debts.map(debt => ({
                    id: debt.id,
                    name: debt.name,
                    currentBalance: debt.currentBalance,
                    minimumPayment: debt.minimumPayment,
                    interestRate: debt.interestRate,
                    currency: debt.currency,
                    createdAt: debt.createdAt.toISOString(),
                })) : [],
                goals: customOptions.includeGoals ? goals.map(goal => ({
                    id: goal.id,
                    name: goal.name,
                    targetAmount: goal.targetAmount,
                    currentAmount: goal.currentAmount,
                    currency: goal.currency,
                    progress: goal.targetAmount > 0 
                        ? (goal.currentAmount / goal.targetAmount * 100).toFixed(2) + '%'
                        : '0%',
                    createdAt: goal.createdAt.toISOString(),
                })) : [],
                // Mock payment history
                payments: exportOptions.includePayments ? [
                    {
                        id: '1',
                        debtId: debts[0]?.id || '',
                        amount: 50000, // $500.00
                        date: new Date().toISOString(),
                        type: 'regular',
                    }
                ] : [],
                // Mock reports
                reports: customOptions.includeReports ? [
                    {
                        month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                        totalDebt: debts.reduce((sum, debt) => sum + debt.currentBalance, 0),
                        totalPayments: debts.reduce((sum, debt) => sum + debt.minimumPayment, 0),
                        debtReduction: 10000, // $100.00
                    }
                ] : [],
            };

            if (customOptions.format === 'csv') {
                exportCSV(data);
            } else if (customOptions.format === 'json') {
                exportJSON(data);
            } else if (customOptions.format === 'pdf') {
                exportPDF(data);
            }
            
            setLastExport(new Date());
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const exportCSV = (data: any) => {
        let csvContent = '';
        
        if (data.debts.length > 0) {
            csvContent += 'DEBTS\n';
            csvContent += 'Name,Current Balance,Minimum Payment,Interest Rate,Currency,Created At\n';
            data.debts.forEach((debt: any) => {
                csvContent += `"${debt.name}",${debt.currentBalance},${debt.minimumPayment},${(debt.interestRate / 100).toFixed(2)}%,${debt.currency},${debt.createdAt}\n`;
            });
            csvContent += '\n';
        }

        if (data.goals.length > 0) {
            csvContent += 'GOALS\n';
            csvContent += 'Name,Target Amount,Current Amount,Progress,Currency,Created At\n';
            data.goals.forEach((goal: any) => {
                csvContent += `"${goal.name}",${goal.targetAmount},${goal.currentAmount},${goal.progress},${goal.currency},${goal.createdAt}\n`;
            });
            csvContent += '\n';
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `debt-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const exportJSON = (data: any) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `debt-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const exportPDF = (data: any) => {
        // This would integrate with a PDF library like jsPDF
        alert('PDF export would be implemented with jsPDF library');
    };

    const quickExports = [
        {
            title: 'All Debts (CSV)',
            description: 'Export all debt information as spreadsheet',
            icon: <CreditCard className="h-5 w-5" />,
            onClick: () => {
                const quickOptions = {
                    ...exportOptions,
                    format: 'csv' as const,
                    includeDebts: true,
                    includeGoals: false,
                    includePayments: false,
                    includeReports: false,
                };
                exportData(quickOptions);
            }
        },
        {
            title: 'Goals Progress (CSV)',
            description: 'Export goal tracking and progress data',
            icon: <Target className="h-5 w-5" />,
            onClick: () => {
                const quickOptions = {
                    ...exportOptions,
                    format: 'csv' as const,
                    includeDebts: false,
                    includeGoals: true,
                    includePayments: false,
                    includeReports: false,
                };
                exportData(quickOptions);
            }
        },
        {
            title: 'Complete Backup (JSON)',
            description: 'Full data backup in JSON format',
            icon: <Database className="h-5 w-5" />,
            onClick: () => {
                const quickOptions = {
                    ...exportOptions,
                    format: 'csv' as const,
                    includeDebts: false,
                    includeGoals: false,
                    includePayments: true,
                    includeReports: false,
                };
                exportData(quickOptions);
            }
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Data Export & Backup
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                        <div>
                            <p className="text-muted-foreground mb-2">
                                Export your debt tracking data for backup, analysis, or migration to other tools
                            </p>
                            {lastExport && (
                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                    <Check className="h-3 w-3" />
                                    Last export: {lastExport.toLocaleString()}
                                </Badge>
                            )}
                        </div>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>{debts.length} debts</span>
                            <span>•</span>
                            <span>{goals.length} goals</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Export Options */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Export</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quickExports.map((exportOption, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className="h-auto p-4 flex flex-col items-start gap-2"
                                onClick={exportOption.onClick}
                                disabled={isExporting}
                            >
                                <div className="flex items-center gap-2 text-left">
                                    {exportOption.icon}
                                    <span className="font-medium">{exportOption.title}</span>
                                </div>
                                <p className="text-xs text-muted-foreground text-left">
                                    {exportOption.description}
                                </p>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Custom Export Options */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Custom Export
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Date Range */}
                    <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date Range
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'year', '6months', '3months', 'month'].map((range) => (
                                <Button
                                    key={range}
                                    size="sm"
                                    variant={exportOptions.dateRange === range ? 'default' : 'outline'}
                                    onClick={() => setExportOptions({...exportOptions, dateRange: range as any})}
                                >
                                    {getDateRangeLabel(range)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Export Format</h4>
                        <div className="flex gap-2">
                            {['csv', 'json', 'pdf'].map((format) => (
                                <Button
                                    key={format}
                                    size="sm"
                                    variant={exportOptions.format === format ? 'default' : 'outline'}
                                    onClick={() => setExportOptions({...exportOptions, format: format as any})}
                                    className="flex items-center gap-2"
                                >
                                    {getFormatIcon(format)}
                                    {format.toUpperCase()}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Data Selection */}
                    <div className="space-y-3">
                        <h4 className="font-medium">Include Data</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeDebts}
                                    onChange={(e) => setExportOptions({...exportOptions, includeDebts: e.target.checked})}
                                    className="rounded"
                                />
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span>Debts ({debts.length})</span>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeGoals}
                                    onChange={(e) => setExportOptions({...exportOptions, includeGoals: e.target.checked})}
                                    className="rounded"
                                />
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    <span>Goals ({goals.length})</span>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includePayments}
                                    onChange={(e) => setExportOptions({...exportOptions, includePayments: e.target.checked})}
                                    className="rounded"
                                />
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4" />
                                    <span>Payment History</span>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeReports}
                                    onChange={(e) => setExportOptions({...exportOptions, includeReports: e.target.checked})}
                                    className="rounded"
                                />
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span>Monthly Reports</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Export Preview */}
                    <div className="p-4 bg-muted rounded-lg">
                        <h5 className="font-medium mb-2">Export Preview</h5>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <div>Format: <span className="font-medium">{exportOptions.format.toUpperCase()}</span></div>
                            <div>Date Range: <span className="font-medium">{getDateRangeLabel(exportOptions.dateRange)}</span></div>
                            <div>
                                Includes: <span className="font-medium">
                                    {[
                                        exportOptions.includeDebts && 'Debts',
                                        exportOptions.includeGoals && 'Goals',
                                        exportOptions.includePayments && 'Payments',
                                        exportOptions.includeReports && 'Reports'
                                    ].filter(Boolean).join(', ') || 'Nothing selected'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Export Button */}
                    <Button 
                        onClick={() => exportData()} 
                        disabled={isExporting || (!exportOptions.includeDebts && !exportOptions.includeGoals && !exportOptions.includePayments && !exportOptions.includeReports)}
                        className="w-full flex items-center gap-2"
                        size="lg"
                    >
                        {isExporting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Export Data
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Export Tips */}
            <Card>
                <CardHeader>
                    <CardTitle>Export Tips</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm">
                        <div className="flex gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <strong>CSV:</strong> Best for spreadsheet analysis in Excel, Google Sheets, or similar tools.
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Database className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <strong>JSON:</strong> Complete data backup including all relationships and metadata.
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <FileText className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <strong>PDF:</strong> Professional reports for printing or sharing with financial advisors.
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}