"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { comparePaymentStrategies } from "@/lib/advanced-interest";
import { DebtWithExtras, PayoffStrategy, formatCurrency } from "@/lib/strategy";
import { Calculator, TrendingUp, Clock, DollarSign, Zap, Plus } from "lucide-react";

interface WhatIfScenariosProps {
  debts: DebtWithExtras[];
}

interface Scenario {
  id: string;
  name: string;
  extraPayment: number;
  strategy: PayoffStrategy;
}

export default function WhatIfScenarios({ debts }: WhatIfScenariosProps) {
  const primaryCurrency = debts[0]?.currency || 'USD';
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: "1", name: "Conservative", extraPayment: 5000, strategy: "snowball" }, // $50
    { id: "2", name: "Aggressive", extraPayment: 15000, strategy: "avalanche" }, // $150
    { id: "3", name: "Moderate", extraPayment: 10000, strategy: "snowball" }, // $100
  ]);

  const [customScenario, setCustomScenario] = useState({
    name: "",
    extraPayment: 0,
    strategy: "avalanche" as PayoffStrategy
  });

  const addCustomScenario = () => {
    if (customScenario.name && customScenario.extraPayment > 0) {
      const newScenario: Scenario = {
        id: Date.now().toString(),
        name: customScenario.name,
        extraPayment: customScenario.extraPayment * 100, // Convert to cents
        strategy: customScenario.strategy
      };
      setScenarios([...scenarios, newScenario]);
      setCustomScenario({ name: "", extraPayment: 0, strategy: "avalanche" });
    }
  };

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  // Calculate results for all scenarios
  const scenarioResults = scenarios.map(scenario => {
    // Simplified calculation - in real app would use the advanced interest functions
    const totalMinimumPayment = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    const totalMonthlyPayment = totalMinimumPayment + scenario.extraPayment;
    const totalDebt = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    
    // Rough estimation for demo purposes
    const averageRate = debts.reduce((sum, debt) => sum + debt.interestRate, 0) / Math.max(debts.length, 1);
    const monthlyRate = (averageRate / 10000) / 12;
    
    // Estimate payoff time using financial formula
    const estimatedMonths = totalDebt > 0 && totalMonthlyPayment > (totalDebt * monthlyRate) 
      ? Math.log(1 + (totalDebt * monthlyRate) / (totalMonthlyPayment - (totalDebt * monthlyRate))) / Math.log(1 + monthlyRate)
      : 0;
    
    const totalInterest = Math.max(0, (totalMonthlyPayment * estimatedMonths) - totalDebt);
    
    return {
      scenario,
      totalMonths: Math.ceil(estimatedMonths),
      totalInterest,
      totalPaid: totalDebt + totalInterest,
      monthlyCost: totalMonthlyPayment,
      timeToFreedom: formatTimeToFreedom(Math.ceil(estimatedMonths))
    };
  });

  // Find best scenario by total interest
  const bestScenario = scenarioResults.reduce((best, current) => 
    current.totalInterest < best.totalInterest ? current : best
  );

  const formatTimeToFreedom = (months: number) => {
    if (months <= 0) return "Already debt-free!";
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${months} months`;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years}y ${remainingMonths}m`;
  };

  const getScenarioColor = (scenarioId: string) => {
    if (scenarioId === bestScenario.scenario.id) return "border-green-500 bg-green-50";
    return "border-border";
  };

  if (debts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Add some debts to compare payoff scenarios</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            What-If Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {scenarioResults.map(result => (
              <div 
                key={result.scenario.id} 
                className={`border rounded-lg p-4 ${getScenarioColor(result.scenario.id)}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{result.scenario.name}</h4>
                    {result.scenario.id === bestScenario.scenario.id && (
                      <Badge className="bg-green-100 text-green-800">
                        <Zap className="h-3 w-3 mr-1" />
                        Best Option
                      </Badge>
                    )}
                    <Badge variant="outline" className="capitalize">
                      {result.scenario.strategy}
                    </Badge>
                  </div>
                  {scenarios.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScenario(result.scenario.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      Extra Payment
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(result.scenario.extraPayment, primaryCurrency)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Time to Freedom
                    </div>
                    <div className="font-semibold">{result.timeToFreedom}</div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      Total Interest
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(result.totalInterest, primaryCurrency)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calculator className="h-3 w-3" />
                      Monthly Cost
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(result.monthlyCost, primaryCurrency)}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress Timeline</span>
                    <span>{result.totalMonths} months</span>
                  </div>
                  <Progress 
                    value={100 - ((result.totalMonths || 1) / Math.max(...scenarioResults.map(r => r.totalMonths), 1)) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Scenario */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Custom Scenario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Scenario Name</label>
              <Input
                placeholder="My Strategy"
                value={customScenario.name}
                onChange={(e) => setCustomScenario({...customScenario, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Extra Payment</label>
              <Input
                type="number"
                placeholder="100"
                value={customScenario.extraPayment || ""}
                onChange={(e) => setCustomScenario({...customScenario, extraPayment: Number(e.target.value)})}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Strategy</label>
              <select
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                value={customScenario.strategy}
                onChange={(e) => setCustomScenario({...customScenario, strategy: e.target.value as PayoffStrategy})}
              >
                <option value="avalanche">Avalanche (High Interest First)</option>
                <option value="snowball">Snowball (Low Balance First)</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={addCustomScenario} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Scenario
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Comparison Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-2xl font-bold text-green-600 mb-2">
              Best Strategy: {bestScenario.scenario.name}
            </div>
            <div className="text-muted-foreground">
              Saves {formatCurrency(
                Math.max(...scenarioResults.map(r => r.totalInterest)) - bestScenario.totalInterest,
                primaryCurrency
              )} in interest compared to the most expensive option
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}