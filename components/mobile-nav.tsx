"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CreditCard,
    Target,
    LogOut,
    User,
    TrendingUp,
    Wallet,
    FileText,
    Calendar,
    BarChart,
    Download,
    Menu,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

interface MobileNavProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/debts", label: "Debts", icon: CreditCard },
    { href: "/dashboard/strategy", label: "Strategy", icon: TrendingUp },
    { href: "/dashboard/payments", label: "Payments", icon: Calendar },
    { href: "/dashboard/budget", label: "Budget", icon: Wallet },
    { href: "/dashboard/reports", label: "Reports", icon: FileText },
    { href: "/dashboard/reports/monthly", label: "Monthly Reports", icon: BarChart, indent: true },
    { href: "/dashboard/export", label: "Data Export", icon: Download },
    { href: "/dashboard/goals", label: "Goals", icon: Target },
];

export function MobileNav({ user }: MobileNavProps) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    return (
        <header className="flex md:hidden items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-40">
            <div className="font-bold text-xl tracking-tighter lowercase">debtstracker</div>
            
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="min-h-[44px] min-w-[44px]"
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent 
                    side="left" 
                    className="w-[280px] p-0 bg-card border-border"
                >
                    <SheetHeader className="p-6 border-b border-border">
                        <SheetTitle className="font-bold text-xl tracking-tighter lowercase text-left">
                            debtstracker
                        </SheetTitle>
                    </SheetHeader>
                    
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            
                            return (
                                <Link 
                                    key={item.href} 
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                >
                                    <Button 
                                        variant={isActive ? "secondary" : "ghost"} 
                                        className={`w-full justify-start gap-3 min-h-[44px] ${item.indent ? 'ml-4' : ''}`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="text-base">{item.label}</span>
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            {user?.image ? (
                                <img
                                    src={user.image}
                                    alt={user.name || "User"}
                                    className="h-10 w-10 rounded-full"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                    <User className="h-5 w-5" />
                                </div>
                            )}
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </div>
                        <form action="/api/auth/signout" method="POST">
                            <Button 
                                type="submit"
                                variant="destructive" 
                                className="w-full justify-start gap-2 min-h-[44px]" 
                            >
                                <LogOut className="h-5 w-5" />
                                <span className="text-base">Sign Out</span>
                            </Button>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        </header>
    );
}
