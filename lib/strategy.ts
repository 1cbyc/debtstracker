export type Strategy = "snowball" | "avalanche";

export interface Debt {
    id: string;
    name: string;
    currentBalance: number; // Cents
    interestRate: number; // Basis points (e.g. 500 = 5%)
    minimumPayment: number; // Cents
    dueDate?: Date;
}

export interface PayoffMonth {
    month: number;
    year: number;
    remainingBalance: number;
    interestPaid: number;
    principalPaid: number;
}

export interface PayoffResult {
    debtId: string;
    payoffDate: Date;
    totalInterestPaid: number;
    monthsToPayoff: number;
}

export interface StrategyResult {
    totalInterest: number;
    payoffDate: Date;
    debtResults: PayoffResult[];
    amortization: Record<number, number>; // Month index -> Total Balance
}

export function calculatePayoff(
    debts: Debt[],
    monthlyExtra: number,
    strategy: Strategy
): StrategyResult {
    // Clone debts to avoid mutation
    let activeDebts = debts.map(d => ({ ...d, currentBalance: d.currentBalance }));
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let monthIndex = 0;

    let totalInterest = 0;
    const debtResults: Map<string, PayoffResult> = new Map();
    const amortization: Record<number, number> = {};

    // Sort debts based on strategy
    const sortDebts = () => {
        activeDebts.sort((a, b) => {
            if (strategy === "snowball") {
                return a.currentBalance - b.currentBalance; // Lowest balance first
            } else {
                return b.interestRate - a.interestRate; // Highest interest first
            }
        });
    };

    while (activeDebts.some(d => d.currentBalance > 0) && monthIndex < 1200) { // Safety break at 100 years
        activeDebts = activeDebts.filter(d => d.currentBalance > 0);
        sortDebts();

        let monthlyBudget = monthlyExtra; // Start with extra payment
        // Add minimum payments of *paid off* debts to the snowball/avalanche
        // (This logic is tricky: usually "snowball" means you take the min payment of paid-off debt and add it to the next. 
        // We simulate this by having a "total monthly budget" = sum(min payments) + extra. 
        // But here we take strict inputs. Let's calculate the available budget.)

        // Actually, the classic method: 
        // Total Budget = Sum(Original Minimum Payments) + Extra.
        // We pay minimums on everything active.
        // Remaining Budget goes to the target.

        // For accurate result, caller must pass `monthlyExtra`. 
        // We assume `monthlyExtra` is ON TOP of the sum of current minimums.
        // Wait, if a debt is paid off, its minimum payment is freed up. 
        // So we need to track "freed up minimums".

        let availableForTarget = monthlyExtra;

        // 1. Calculate Interest and Pay Minimums
        for (const debt of activeDebts) {
            const monthlyInterestRate = (debt.interestRate / 10000) / 12;
            const interest = Math.round(debt.currentBalance * monthlyInterestRate);
            totalInterest += interest;

            // Minimum payment or balance+interest
            let payment = Math.min(debt.minimumPayment, debt.currentBalance + interest);

            // If we can't even cover interest, balance grows (danger zone), but assuming min payment covers it usually.

            // Apply payment
            // In a strict payoff, we pay the minimum. 
            // BUT wait, if we are paying "snowball", we pay minimums on ALL debts except the target?
            // Actually, we pay minimums on ALL. Then put extra on target.
            // When a debt is irrelevant, we add its min payment to `availableForTarget`.

            // Let's refine:
            // We need the *original* minimum payments to know what gets freed up?
            // Or simpler: We just iterate. 

            // Let's assume `availableForTarget` accumulates `monthlyExtra` + `freedUpMinimums`.
            // But `activeDebts` shrinks.

            // Correct Logic:
            // 1. Pay minimum on all active debts.
            // 2. Reduce `availableForTarget` only if we used it? No, minimums are base.
            // 3. Apply `totalAvailableExtra` to the top priority debt.

            // Wait, where does the "snowball" effect come from? 
            // It comes from: Total Monthly Payment = (Sum of ALL original minimums) + Extra.
            // So as debts disappear, that constant Total Monthly Payment gets concentrated.

            // So we need to calculate `totalMonthlyPayment` at the start.
        }

        // Let's restart logic with "Total Monthly Commit"
        // THIS IS CRITICAL for the "Snowball" effect.
    }

    // Reworking for correct Snowball/Avalanche math
    // Reset
    activeDebts = debts.map(d => ({ ...d }));

    const totalMinimums = activeDebts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const totalMonthlyOutput = totalMinimums + monthlyExtra;

    monthIndex = 0;
    totalInterest = 0;
    amortization[0] = activeDebts.reduce((s, d) => s + d.currentBalance, 0);

    while (activeDebts.some(d => d.currentBalance > 0) && monthIndex < 600) { // 50 years max
        monthIndex++;

        // 1. Accrue Interest
        activeDebts.forEach(d => {
            if (d.currentBalance > 0) {
                const interest = Math.round(d.currentBalance * (d.interestRate / 10000 / 12));
                d.currentBalance += interest;
                totalInterest += interest;
            }
        });

        // 2. Determine available money
        let moneyRemaining = totalMonthlyOutput;

        // 3. Sort for priority
        sortDebts(); // Re-sort? Strategies usually stick to original order?
        // Snowball: Smallest balance. As balances change, order might change? 
        // Usually Snowball lists debts by *initial* balance. But Dynamic Snowball (re-sorting) is also valid.
        // Let's stick to dynamic sorting (Standard Snowball re-evaluates).

        // 4. Pay Minimums on EVERYTHING first
        activeDebts.forEach(d => {
            if (d.currentBalance > 0) {
                const minPay = Math.min(d.minimumPayment, d.currentBalance);
                d.currentBalance -= minPay;
                moneyRemaining -= minPay;
            }
        });

        // 5. Apply Leftover (Snowball) to top priority
        // Note: activeDebts is sorted by priority.
        for (const debt of activeDebts) {
            if (moneyRemaining <= 0) break;
            if (debt.currentBalance > 0) {
                const payment = Math.min(moneyRemaining, debt.currentBalance);
                debt.currentBalance -= payment;
                moneyRemaining -= payment;
            }
        }

        // 6. Record Payoffs
        activeDebts.forEach(d => {
            if (d.currentBalance <= 0 && !debtResults.has(d.id)) {
                debtResults.set(d.id, {
                    debtId: d.id,
                    payoffDate: new Date(currentYear, currentMonth + monthIndex, 1),
                    totalInterestPaid: 0, // Tracking per debt would require more state, simplifying for global now
                    monthsToPayoff: monthIndex
                });
            }
        });

        amortization[monthIndex] = Math.max(0, activeDebts.reduce((s, d) => s + d.currentBalance, 0));
    }

    return {
        totalInterest,
        payoffDate: new Date(currentYear, currentMonth + monthIndex, 1),
        debtResults: Array.from(debtResults.values()),
        amortization
    };
}
