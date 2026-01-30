import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tighter">debtstracker</h1>
                    <p className="text-muted-foreground mt-2">track your debt, plan your freedom.</p>
                </div>
                <SignupForm />
            </div>
        </div>
    );
}
