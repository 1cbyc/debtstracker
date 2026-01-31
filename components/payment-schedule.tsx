"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Bell, DollarSign, Settings, Plus, X } from "lucide-react";

interface PaymentScheduleEntry {
    id: string;
    debtId: string;
    debtName: string;
    amount: number;
    dueDate: Date;
    frequency: 'monthly' | 'biweekly' | 'weekly';
    isAutomatic: boolean;
    reminderDays: number;
    isActive: boolean;
}

interface PaymentScheduleProps {
    debts: Array<{
        id: string;
        name: string;
        currentBalance: number;
        minimumPayment: number;
        currency: string;
    }>;
}

export default function PaymentSchedule({ debts }: PaymentScheduleProps) {
    const [schedules, setSchedules] = useState<PaymentScheduleEntry[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        debtId: '',
        amount: 0,
        dueDate: new Date().toISOString().split('T')[0],
        frequency: 'monthly' as const,
        isAutomatic: false,
        reminderDays: 3,
    });

    const addSchedule = () => {
        const debt = debts.find(d => d.id === newSchedule.debtId);
        if (!debt) return;

        const schedule: PaymentScheduleEntry = {
            id: Date.now().toString(),
            debtId: newSchedule.debtId,
            debtName: debt.name,
            amount: newSchedule.amount * 100, // Convert to cents
            dueDate: new Date(newSchedule.dueDate),
            frequency: newSchedule.frequency,
            isAutomatic: newSchedule.isAutomatic,
            reminderDays: newSchedule.reminderDays,
            isActive: true,
        };

        setSchedules([...schedules, schedule]);
        setNewSchedule({
            debtId: '',
            amount: 0,
            dueDate: new Date().toISOString().split('T')[0],
            frequency: 'monthly',
            isAutomatic: false,
            reminderDays: 3,
        });
        setShowAddForm(false);
    };

    const removeSchedule = (id: string) => {
        setSchedules(schedules.filter(s => s.id !== id));
    };

    const toggleSchedule = (id: string) => {
        setSchedules(schedules.map(s => 
            s.id === id ? { ...s, isActive: !s.isActive } : s
        ));
    };

    const getNextPaymentDate = (schedule: PaymentScheduleEntry) => {
        const now = new Date();
        const due = new Date(schedule.dueDate);
        
        // If due date has passed, calculate next occurrence based on frequency
        if (due <= now) {
            switch (schedule.frequency) {
                case 'weekly':
                    due.setDate(due.getDate() + 7);
                    break;
                case 'biweekly':
                    due.setDate(due.getDate() + 14);
                    break;
                case 'monthly':
                default:
                    due.setMonth(due.getMonth() + 1);
                    break;
            }
        }
        
        return due;
    };

    const getDaysUntilDue = (schedule: PaymentScheduleEntry) => {
        const nextDate = getNextPaymentDate(schedule);
        const now = new Date();
        const diffTime = nextDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount / 100);
    };

    const getUpcomingPayments = () => {
        return schedules
            .filter(s => s.isActive)
            .map(s => ({
                ...s,
                nextPaymentDate: getNextPaymentDate(s),
                daysUntilDue: getDaysUntilDue(s),
            }))
            .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
            .slice(0, 5);
    };

    const currency = debts[0]?.currency || 'USD';

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Payment Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                        <div>
                            <p className="text-muted-foreground mb-2">
                                Set up automatic reminders and track your debt payments
                            </p>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {schedules.filter(s => s.isActive).length} Active Schedules
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Bell className="h-3 w-3" />
                                    {getUpcomingPayments().filter(p => p.daysUntilDue <= 3).length} Due Soon
                                </Badge>
                            </div>
                        </div>
                        <Button 
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Schedule
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Add Schedule Form */}
            {showAddForm && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>New Payment Schedule</span>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowAddForm(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Debt</label>
                                <select 
                                    className="w-full p-2 border rounded-md"
                                    value={newSchedule.debtId}
                                    onChange={(e) => setNewSchedule({...newSchedule, debtId: e.target.value})}
                                >
                                    <option value="">Select a debt...</option>
                                    {debts.map(debt => (
                                        <option key={debt.id} value={debt.id}>
                                            {debt.name} - {formatCurrency(debt.currentBalance, debt.currency)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Payment Amount</label>
                                <Input
                                    type="number"
                                    value={newSchedule.amount || ''}
                                    onChange={(e) => setNewSchedule({...newSchedule, amount: parseFloat(e.target.value) || 0})}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">First Due Date</label>
                                <Input
                                    type="date"
                                    value={newSchedule.dueDate}
                                    onChange={(e) => setNewSchedule({...newSchedule, dueDate: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Frequency</label>
                                <select 
                                    className="w-full p-2 border rounded-md"
                                    value={newSchedule.frequency}
                                    onChange={(e) => setNewSchedule({...newSchedule, frequency: e.target.value as any})}
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="biweekly">Bi-weekly</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Reminder Days Before</label>
                                <Input
                                    type="number"
                                    value={newSchedule.reminderDays}
                                    onChange={(e) => setNewSchedule({...newSchedule, reminderDays: parseInt(e.target.value) || 3})}
                                    min="1"
                                    max="30"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="automatic"
                                    checked={newSchedule.isAutomatic}
                                    onChange={(e) => setNewSchedule({...newSchedule, isAutomatic: e.target.checked})}
                                    className="rounded"
                                />
                                <label htmlFor="automatic" className="text-sm font-medium">
                                    Automatic Payment
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setShowAddForm(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={addSchedule}
                                disabled={!newSchedule.debtId || !newSchedule.amount}
                            >
                                Add Schedule
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Upcoming Payments */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Upcoming Payments
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {getUpcomingPayments().length > 0 ? (
                        <div className="space-y-3">
                            {getUpcomingPayments().map(payment => (
                                <div 
                                    key={payment.id} 
                                    className={`flex items-center justify-between p-4 border rounded-lg ${
                                        payment.daysUntilDue <= 1 ? 'border-red-200 bg-red-50' :
                                        payment.daysUntilDue <= 3 ? 'border-yellow-200 bg-yellow-50' :
                                        'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${
                                            payment.daysUntilDue <= 1 ? 'bg-red-500' :
                                            payment.daysUntilDue <= 3 ? 'bg-yellow-500' :
                                            'bg-green-500'
                                        }`}></div>
                                        <div>
                                            <div className="font-medium">{payment.debtName}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatCurrency(payment.amount, currency)} • {payment.frequency}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">
                                            {payment.nextPaymentDate.toLocaleDateString()}
                                        </div>
                                        <div className={`text-sm ${
                                            payment.daysUntilDue <= 1 ? 'text-red-600' :
                                            payment.daysUntilDue <= 3 ? 'text-yellow-600' :
                                            'text-muted-foreground'
                                        }`}>
                                            {payment.daysUntilDue <= 0 ? 'Due today' :
                                             payment.daysUntilDue === 1 ? 'Due tomorrow' :
                                             `In ${payment.daysUntilDue} days`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No payment schedules set up yet.</p>
                            <p className="text-sm">Add a schedule to get started with automatic reminders.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* All Schedules */}
            {schedules.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            All Payment Schedules
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {schedules.map(schedule => (
                                <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${schedule.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <div>
                                            <div className="font-medium">{schedule.debtName}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatCurrency(schedule.amount, currency)} • {schedule.frequency} • 
                                                {schedule.isAutomatic ? ' Automatic' : ' Manual'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleSchedule(schedule.id)}
                                        >
                                            {schedule.isActive ? 'Pause' : 'Resume'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => removeSchedule(schedule.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}