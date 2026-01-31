"use client";

import { useState } from "react";
import { Menu, LayoutDashboard, CreditCard, Target, TrendingUp, Wallet, FileText, BarChart, Download, Calendar, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const { data: session } = useSession();
    const user = session?.user;

    const handleNavClick = () => {
        setOpen(false);
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
        setOpen(false);
    };

    return (
        <div className="w-full border-b border-border bg-card px-4 py-3">
            <div className="flex items-center justify-between">
                <div className="font-bold text-xl tracking-tighter lowercase">debtstracker</div>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="min-h-[44px] min-w-[44px]"
                            aria-label="Open navigation menu"
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent 
                        side="left" 
                        className="w-64 bg-card border-r border-border p-0"
                    >
                        <div className="w-64 h-screen flex flex-col bg-card">
                            <div className="p-6 border-b border-border">
                                <div className="font-bold text-xl tracking-tighter lowercase">debtstracker</div>
                            </div>

                            <nav className="flex-1 p-4 space-y-2">
                                <Link href="/dashboard" onClick={handleNavClick}>
                                    <Button variant="ghost" className="w-full justify-start gap-2 min-h-[44px]">
                                        <LayoutDashboard className="h-4 w-4" />
                                        Dashboard
                                    </Button>
                                </Link>
                                <Link href="/dashboard/debts" onClick={handleNavClick}>
                                    <Button variant="ghost" className="w-full justify-start gap-2 min-h-[44px]">
                                        <CreditCard className="h-4 w-4" />
                                        Debts
                                    </Button>
                                </Link>
                                <Link href="/dashboard/strategy" onClick={handleNavClick}>
                                    <Button variant="ghost" className="w-full justify-start gap-2 min-h-[44px]">
                                        <TrendingUp className="h-4 w-4" />
                                        Strategy
                                    </Button>
                                </Link>
                                <Link href="/dashboard/payments" onClick={handleNavClick}>
                                    <Button variant="ghost" className="w-full justify-start gap-2 min-h-[44px]">
                                        <Calendar className="h-4 w-4" />
                                        Payments
                                    </Button>
                                </Link>
                                <Link href="/dashboard/budget" onClick={handleNavClick}>
                                    <Button variant="ghost" className="w-full justify-start gap-2 min-h-[44px]">
                                        <Wallet className="h-4 w-4" />
                                        Budget
                                    </Button>
                                </Link>
                                <Link href="/dashboard/reports" onClick={handleNavClick}>
                                    <Button variant="ghost" className="w-full justify-start gap-2 min-h-[44px]">
                                        <FileText className="h-4 w-4" />
                                        Reports
                                    </Button>
                                </Link>
                                <Link href="/dashboard/reports/monthly" onClick={handleNavClick}>
                                    <Button variant="ghost" className="w-full justify-start gap-2 ml-4 min-h-[44px]">
                                        <BarChart className="h-4 w-4" />
                                        Monthly Reports
                                    </Button>
                                </Link>
                                <Link href="/dashboard/export" onClick={handleNavClick}>
                                    <Button variant="ghost" className="w-full justify-start gap-2 min-h-[44px]">
                                        <Download className="h-4 w-4" />
                                        Data Export
                                    </Button>
                                </Link>
                                <Link href="/dashboard/goals" onClick={handleNavClick}>
                                    <Button variant="ghost" className="w-full justify-start gap-2 min-h-[44px]">
                                        <Target className="h-4 w-4" />
                                        Goals
                                    </Button>
                                </Link>
                            </nav>

                            {user && (
                                <div className="p-4 border-t border-border">
                                    <div className="flex items-center gap-3 mb-4 px-2">
                                        {user?.image ? (
                                            <img
                                                src={user.image}
                                                alt={user.name || "User"}
                                                className="h-8 w-8 rounded-full"
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                                                <User className="h-4 w-4" />
                                            </div>
                                        )}
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-medium truncate">{user?.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="destructive" 
                                        className="w-full justify-start gap-2 min-h-[44px]" 
                                        size="sm"
                                        onClick={handleSignOut}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </Button>
                                </div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}