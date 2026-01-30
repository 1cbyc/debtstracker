import { auth, signOut } from "@/auth";
import Link from "next/link";
import {
    LayoutDashboard,
    CreditCard,
    Target,
    LogOut,
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";

export async function AppSidebar() {
    const session = await auth();
    const user = session?.user;

    return (
        <aside className="w-64 border-r border-border h-screen flex flex-col fixed left-0 top-0 bg-card">
            <div className="p-6 border-b border-border">
                <div className="font-bold text-xl tracking-tighter">debtstracker</div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <Link href="/dashboard">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        dashboard
                    </Button>
                </Link>
                <Link href="/dashboard/debts">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <CreditCard className="h-4 w-4" />
                        debts
                    </Button>
                </Link>
                <Link href="/dashboard/goals">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <Target className="h-4 w-4" />
                        goals
                    </Button>
                </Link>
            </nav>

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
                <form
                    action={async () => {
                        "use server";
                        await signOut();
                    }}
                >
                    <Button variant="destructive" className="w-full justify-start gap-2" size="sm">
                        <LogOut className="h-4 w-4" />
                        sign out
                    </Button>
                </form>
            </div>
        </aside>
    );
}
