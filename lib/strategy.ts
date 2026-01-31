export type DebtWithExtras = {
  id: string;
  name: string;
  totalAmount: number;
  currentBalance: number;
  currency: string;
  priority: 'high' | 'medium' | 'low';
  interestRate: number; // basis points
  minimumPayment: number;
  dueDate: Date;
};

export type PayoffStrategy = 'avalanche' | 'snowball';

export type PayoffPlan = {
  strategy: PayoffStrategy;
  totalMonths: number;
  totalInterest: number;
  monthlyPlan: MonthlyPayment[];
  savings: {
    vsMinimum: number;
    timeReduction: number;
  };
};

export type MonthlyPayment = {
  month: number;
  date: Date;
  payments: DebtPayment[];
  remainingTotalDebt: number;
};

export type DebtPayment = {
  debtId: string;
  debtName: string;
  payment: number;
  principalPortion: number;
  interestPortion: number;
  remainingBalance: number;
  isPayoff: boolean;
};

/**
 * Calculate debt payoff strategy
 */
export function calculatePayoffStrategy(
  debts: DebtWithExtras[],
  extraPayment: number,
  strategy: PayoffStrategy
): PayoffPlan {
  if (debts.length === 0) {
    return {
      strategy,
      totalMonths: 0,
      totalInterest: 0,
      monthlyPlan: [],
      savings: { vsMinimum: 0, timeReduction: 0 }
    };
  }

  // Sort debts based on strategy
  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'avalanche') {
      // Highest interest rate first
      return b.interestRate - a.interestRate;
    } else {
      // Lowest balance first (snowball)
      return a.currentBalance - b.currentBalance;
    }
  });

  // Calculate payoff plan
  const monthlyPlan: MonthlyPayment[] = [];
  const workingDebts = sortedDebts.map(debt => ({...debt}));
  const totalMinimumPayment = workingDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const totalExtraPayment = Math.max(0, extraPayment);
  
  let month = 1;
  let totalInterestPaid = 0;
  let currentDate = new Date();

  while (workingDebts.some(debt => debt.currentBalance > 0)) {
    const monthPayments: DebtPayment[] = [];
    let remainingExtra = totalExtraPayment;
    
    // Make minimum payments on all debts first
    for (const debt of workingDebts) {
      if (debt.currentBalance <= 0) continue;
      
      const monthlyInterest = (debt.currentBalance * (debt.interestRate / 10000)) / 12;
      const minimumPayment = Math.min(debt.minimumPayment, debt.currentBalance + monthlyInterest);
      const principalPayment = Math.max(0, minimumPayment - monthlyInterest);
      
      debt.currentBalance = Math.max(0, debt.currentBalance - principalPayment);
      totalInterestPaid += monthlyInterest;
      
      monthPayments.push({
        debtId: debt.id,
        debtName: debt.name,
        payment: minimumPayment,
        principalPortion: principalPayment,
        interestPortion: monthlyInterest,
        remainingBalance: debt.currentBalance,
        isPayoff: debt.currentBalance === 0
      });
    }
    
    // Apply extra payment to priority debt (first in sorted list with balance)
    const priorityDebt = workingDebts.find(debt => debt.currentBalance > 0);
    if (priorityDebt && remainingExtra > 0) {
      const extraToApply = Math.min(remainingExtra, priorityDebt.currentBalance);
      priorityDebt.currentBalance -= extraToApply;
      
      // Update the payment record for this debt
      const paymentRecord = monthPayments.find(p => p.debtId === priorityDebt.id);
      if (paymentRecord) {
        paymentRecord.payment += extraToApply;
        paymentRecord.principalPortion += extraToApply;
        paymentRecord.remainingBalance = priorityDebt.currentBalance;
        paymentRecord.isPayoff = priorityDebt.currentBalance === 0;
      }
    }
    
    // Record this month's payments
    const totalRemainingDebt = workingDebts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    
    monthlyPlan.push({
      month,
      date: new Date(currentDate.getFullYear(), currentDate.getMonth() + month - 1, currentDate.getDate()),
      payments: monthPayments,
      remainingTotalDebt: totalRemainingDebt
    });
    
    month++;
    
    // Safety check to prevent infinite loops
    if (month > 1000) break;
  }

  // Calculate savings vs minimum only payments
  const minimumOnlyPlan = calculateMinimumOnlyPayoff(debts);
  
  return {
    strategy,
    totalMonths: monthlyPlan.length,
    totalInterest: totalInterestPaid,
    monthlyPlan,
    savings: {
      vsMinimum: minimumOnlyPlan.totalInterest - totalInterestPaid,
      timeReduction: minimumOnlyPlan.totalMonths - monthlyPlan.length
    }
  };
}

/**
 * Calculate minimum-only payment scenario for comparison
 */
function calculateMinimumOnlyPayoff(debts: DebtWithExtras[]) {
  const workingDebts = debts.map(debt => ({...debt}));
  let month = 1;
  let totalInterestPaid = 0;

  while (workingDebts.some(debt => debt.currentBalance > 0) && month <= 1000) {
    for (const debt of workingDebts) {
      if (debt.currentBalance <= 0) continue;
      
      const monthlyInterest = (debt.currentBalance * (debt.interestRate / 10000)) / 12;
      const minimumPayment = Math.min(debt.minimumPayment, debt.currentBalance + monthlyInterest);
      const principalPayment = Math.max(0, minimumPayment - monthlyInterest);
      
      debt.currentBalance = Math.max(0, debt.currentBalance - principalPayment);
      totalInterestPaid += monthlyInterest;
    }
    month++;
  }

  return {
    totalMonths: month - 1,
    totalInterest: totalInterestPaid
  };
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string): string {
  const absAmount = Math.abs(amount);
  const formatted = (absAmount / 100).toFixed(2);
  
  const symbols: Record<string, string> = {
    'NGN': '₦',
    'USD': '$',
    'GBP': '£'
  };
  
  const symbol = symbols[currency] || currency;
  const sign = amount < 0 ? '-' : '';
  
  return `${sign}${symbol}${formatted}`;
}

/**
 * Calculate total debt across all currencies (for display purposes)
 */
export function calculateTotalDebt(debts: DebtWithExtras[]): Record<string, number> {
  return debts.reduce((totals, debt) => {
    if (!totals[debt.currency]) {
      totals[debt.currency] = 0;
    }
    totals[debt.currency] += debt.currentBalance;
    return totals;
  }, {} as Record<string, number>);
}

/**
 * Calculate debt-to-income ratio
 */
export function calculateDebtToIncomeRatio(
  totalDebtPayments: number,
  monthlyIncome: number
): number {
  if (monthlyIncome <= 0) return 0;
  return (totalDebtPayments / monthlyIncome) * 100;
}

/**
 * Get debt priority color for UI
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'low': return 'text-green-600 bg-green-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Calculate recommended emergency fund based on monthly expenses
 */
export function calculateEmergencyFund(monthlyExpenses: number): number {
  // Recommend 3-6 months of expenses
  return monthlyExpenses * 3; // Conservative 3 months
}
