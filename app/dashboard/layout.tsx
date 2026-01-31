import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/api/auth/signin");
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Mobile Navigation - Sheet Pattern */}
            <MobileNav user={session.user} />
            
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:block">
                <AppSidebar />
            </div>
            
            {/* Main Content - Responsive padding */}
            <main className="md:pl-64 min-h-screen">
                <div className="container max-w-6xl mx-auto p-4 md:p-8 pb-32">
                    {children}
                </div>
            </main>
        </div>
    );
}
