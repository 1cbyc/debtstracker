import type { DebtWithExtras } from "./strategy";

export interface AdvancedInterestOptions {
  compoundingFrequency: 'daily' | 'monthly' | 'quarterly' | 'annually';
  variableRate?: boolean;
  rateChanges?: Array<{
    month: number;
    newRate: number;
  }>;
}

export interface AdvancedPayoffResult {
  totalInterest: number;
  totalMonths: number;
  monthlyBreakdown: Array<{
    month: number;
    date: Date;
    payment: number;
    principalPaid: number;
    interestPaid: number;
    balanceRemaining: number;
    effectiveRate: number;
  }>;
  compoundingBenefit: number; // Savings from compound interest considerations
}

/**
 * Calculate debt payoff with advanced interest compounding
 */
export function calculateAdvancedPayoff(
  debt: DebtWithExtras,
  monthlyPayment: number,
  options: AdvancedInterestOptions = { compoundingFrequency: 'monthly' }
): AdvancedPayoffResult {
  
  const annualRate = debt.interestRate / 10000; // Convert from basis points
  let balance = debt.currentBalance;
  const monthlyBreakdown: AdvancedPayoffResult['monthlyBreakdown'] = [];
  
  let totalInterestPaid = 0;
  let month = 0;
  const currentDate = new Date();
  
  // Calculate compounding periods per year
  const compoundingPeriods = {
    daily: 365,
    monthly: 12,
    quarterly: 4,
    annually: 1
  };
  
  const periodsPerYear = compoundingPeriods[options.compoundingFrequency];
  
  while (balance > 0.01 && month < 1200) { // Max 100 years safety
    month++;
    
    // Get effective rate for this month (handle variable rates)
    let currentRate = annualRate;
    if (options.variableRate && options.rateChanges) {
      const applicableRateChange = options.rateChanges
        .filter(change => change.month <= month)
        .pop();
      if (applicableRateChange) {
        currentRate = applicableRateChange.newRate / 10000;
      }
    }
    
    // Calculate compound interest for the month
    let interestThisMonth: number;
    
    if (options.compoundingFrequency === 'daily') {
      // Daily compounding: (1 + r/365)^30 - 1 for approximate monthly
      const dailyRate = currentRate / 365;
      const daysInMonth = 30; // Simplified
      interestThisMonth = balance * (Math.pow(1 + dailyRate, daysInMonth) - 1);
    } else if (options.compoundingFrequency === 'monthly') {
      // Monthly compounding
      interestThisMonth = balance * (currentRate / 12);
    } else {
      // Quarterly/Annual - calculate effective monthly rate
      const effectiveMonthlyRate = Math.pow(1 + currentRate / periodsPerYear, periodsPerYear / 12) - 1;
      interestThisMonth = balance * effectiveMonthlyRate;
    }
    
    // Apply payment
    const principalPayment = Math.min(monthlyPayment - interestThisMonth, balance);
    const actualPayment = Math.min(monthlyPayment, balance + interestThisMonth);
    
    balance = Math.max(0, balance - principalPayment);
    totalInterestPaid += interestThisMonth;
    
    monthlyBreakdown.push({
      month,
      date: new Date(currentDate.getFullYear(), currentDate.getMonth() + month, currentDate.getDate()),
      payment: actualPayment,
      principalPaid: principalPayment,
      interestPaid: interestThisMonth,
      balanceRemaining: balance,
      effectiveRate: currentRate // Already an annual rate, don't multiply by 12
    });
    
    // Safety check
    if (principalPayment <= 0 && balance > 0) {
      // Payment doesn't cover interest - debt growing
      break;
    }
  }
  
  // Calculate compounding benefit vs simple interest
  const simpleInterest = (debt.currentBalance * annualRate * (month / 12));
  const compoundingBenefit = simpleInterest - totalInterestPaid;
  
  return {
    totalInterest: totalInterestPaid,
    totalMonths: month,
    monthlyBreakdown,
    compoundingBenefit
  };
}

/**
 * Compare different payment strategies with advanced interest
 */
export function comparePaymentStrategies(
  debts: DebtWithExtras[],
  strategies: Array<{
    name: string;
    extraPayment: number;
    targetDebt?: string; // Specific debt to focus extra payment
  }>,
  interestOptions: AdvancedInterestOptions = { compoundingFrequency: 'monthly' }
) {
  return strategies.map(strategy => {
    let totalInterest = 0;
    let maxMonths = 0;
    
    const debtResults = debts.map(debt => {
      const payment = debt.minimumPayment + 
        (strategy.targetDebt === debt.id ? strategy.extraPayment : 0);
      
      const result = calculateAdvancedPayoff(debt, payment, interestOptions);
      totalInterest += result.totalInterest;
      maxMonths = Math.max(maxMonths, result.totalMonths);
      
      return {
        debtId: debt.id,
        debtName: debt.name,
        ...result
      };
    });
    
    return {
      strategyName: strategy.name,
      totalInterest,
      totalMonths: maxMonths,
      debtResults,
      monthlyCost: strategy.extraPayment + debts.reduce((sum, d) => sum + d.minimumPayment, 0)
    };
  });
}

/**
 * Calculate optimal payment allocation using advanced interest
 */
export function calculateOptimalAllocation(
  debts: DebtWithExtras[],
  totalMonthlyBudget: number,
  interestOptions: AdvancedInterestOptions = { compoundingFrequency: 'monthly' }
) {
  const minimumRequired = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const extraAvailable = Math.max(0, totalMonthlyBudget - minimumRequired);
  
  if (extraAvailable <= 0) {
    return {
      allocations: debts.map(debt => ({
        debtId: debt.id,
        payment: debt.minimumPayment,
        isOptimal: false
      })),
      totalSavings: 0,
      reasoning: "No extra budget available for optimization"
    };
  }
  
  // Calculate marginal benefit per dollar for each debt
  const marginalBenefits = debts.map(debt => {
    const baseResult = calculateAdvancedPayoff(debt, debt.minimumPayment, interestOptions);
    const improvedResult = calculateAdvancedPayoff(debt, debt.minimumPayment + 100, interestOptions); // $1 extra
    
    const marginalSavings = baseResult.totalInterest - improvedResult.totalInterest;
    
    return {
      debtId: debt.id,
      marginalBenefit: marginalSavings,
      debt
    };
  });
  
  // Sort by marginal benefit (highest first)
  marginalBenefits.sort((a, b) => b.marginalBenefit - a.marginalBenefit);
  
  // Allocate extra payment to debt with highest marginal benefit
  const allocations = debts.map(debt => ({
    debtId: debt.id,
    payment: debt.minimumPayment,
    isOptimal: false
  }));
  
  const topDebt = marginalBenefits[0];
  const topAllocation = allocations.find(a => a.debtId === topDebt.debtId);
  if (topAllocation) {
    topAllocation.payment += extraAvailable;
    topAllocation.isOptimal = true;
  }
  
  // Calculate total savings
  const baseScenario = debts.reduce((total, debt) => {
    const result = calculateAdvancedPayoff(debt, debt.minimumPayment, interestOptions);
    return total + result.totalInterest;
  }, 0);
  
  const optimizedScenario = allocations.reduce((total, allocation) => {
    const debt = debts.find(d => d.id === allocation.debtId)!;
    const result = calculateAdvancedPayoff(debt, allocation.payment, interestOptions);
    return total + result.totalInterest;
  }, 0);
  
  return {
    allocations,
    totalSavings: baseScenario - optimizedScenario,
    reasoning: `Focus extra $${(extraAvailable/100).toFixed(2)} on ${topDebt.debt.name} (highest marginal benefit)`
  };
}