"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";

interface FinancialHealthProps {
  totalDebt: Record<string, number>;
  totalSavings: number;
  monthlyPayments: Record<string, number>;
  monthlyIncome: Record<string, number>;
  debtCount: number;
  goalsAchieved: number;
  totalGoals: number;
}

export default function FinancialHealthMetrics({ 
  totalDebt, 
  totalSavings, 
  monthlyPayments, 
  monthlyIncome,
  debtCount,
  goalsAchieved,
  totalGoals 
}: FinancialHealthProps) {
  
  // Calculate debt-to-income ratio (using primary currency NGN as base)
  const primaryDebt = totalDebt.NGN || 0;
  const primaryIncome = monthlyIncome.NGN || 1; // Prevent division by zero
  const debtToIncomeRatio = primaryIncome > 0 ? (primaryDebt / (primaryIncome * 12)) * 100 : 0;
  
  // Calculate financial health score (0-100)
  const calculateHealthScore = () => {
    let score = 100;
    
    // Debt-to-income penalty (max -40 points)
    if (debtToIncomeRatio > 40) score -= 40;
    else if (debtToIncomeRatio > 20) score -= (debtToIncomeRatio - 20);
    
    // Savings bonus/penalty (max ±20 points)
    const savingsMonths = totalSavings / Math.max(primaryIncome, 1);
    if (savingsMonths >= 6) score += 20;
    else if (savingsMonths >= 3) score += 10;
    else if (savingsMonths < 1) score -= 20;
    
    // Goals achievement bonus (max +20 points)
    if (totalGoals > 0) {
      const goalCompletionRate = goalsAchieved / totalGoals;
      score += goalCompletionRate * 20;
    }
    
    // Debt count penalty
    if (debtCount > 5) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-600 bg-green-50", icon: CheckCircle2 };
    if (score >= 60) return { label: "Good", color: "text-blue-600 bg-blue-50", icon: TrendingUp };
    if (score >= 40) return { label: "Fair", color: "text-yellow-600 bg-yellow-50", icon: AlertTriangle };
    return { label: "Poor", color: "text-red-600 bg-red-50", icon: TrendingDown };
  };

  const healthStatus = getHealthStatus(healthScore);
  const HealthIcon = healthStatus.icon;

  const formatCurrency = (amount: number, currency = "NGN") => {
    const symbols: Record<string, string> = { NGN: "₦", USD: "$", GBP: "£" };
    const symbol = symbols[currency] || currency;
    return `${symbol}${(Math.abs(amount) / 100).toFixed(2)}`;
  };

  const formatRatio = (ratio: number) => `${ratio.toFixed(1)}%`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Financial Health Score */}
      <Card className="col-span-full md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HealthIcon className="h-5 w-5" />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{healthScore.toFixed(0)}/100</div>
              <Badge className={healthStatus.color}>{healthStatus.label}</Badge>
            </div>
            <Progress value={healthScore} className="h-3" />
            <div className="text-sm text-muted-foreground">
              Based on debt-to-income ratio, savings, and goal progress
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debt-to-Income Ratio */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Debt-to-Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatRatio(debtToIncomeRatio)}</div>
          <div className="flex items-center gap-1 text-sm">
            {debtToIncomeRatio <= 20 ? (
              <><CheckCircle2 className="h-3 w-3 text-green-600" /> Healthy</>
            ) : debtToIncomeRatio <= 40 ? (
              <><AlertTriangle className="h-3 w-3 text-yellow-600" /> Moderate</>
            ) : (
              <><TrendingDown className="h-3 w-3 text-red-600" /> High Risk</>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Fund Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Emergency Fund</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalSavings)}</div>
          <div className="text-sm text-muted-foreground">
            {primaryIncome > 0 
              ? `${(totalSavings / primaryIncome).toFixed(1)} months coverage`
              : "Set monthly income"
            }
          </div>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Goals Achievement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{goalsAchieved}/{totalGoals}</div>
          <Progress 
            value={totalGoals > 0 ? (goalsAchieved / totalGoals) * 100 : 0} 
            className="h-2 mt-2" 
          />
          <div className="text-sm text-muted-foreground mt-1">
            {totalGoals > 0 
              ? `${((goalsAchieved / totalGoals) * 100).toFixed(0)}% complete`
              : "No goals set"
            }
          </div>
        </CardContent>
      </Card>

      {/* Monthly Payment Velocity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Payment Velocity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(monthlyPayments).map(([currency, amount]) => (
              <div key={currency} className="text-lg font-semibold">
                {formatCurrency(amount, currency)}
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">This month</div>
        </CardContent>
      </Card>

      {/* Debt Diversification */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Active Debts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{debtCount}</div>
          <div className="text-sm text-muted-foreground">
            {debtCount <= 3 ? "Well managed" : debtCount <= 6 ? "Consider consolidation" : "High complexity"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}