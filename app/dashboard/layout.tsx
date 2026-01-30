import { AppSidebar } from "@/components/app-sidebar";
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
            <AppSidebar />
            <main className="pl-64 min-h-screen">
                <div className="container max-w-6xl mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
