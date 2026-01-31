"use client";

import { signUp } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SignupForm() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const result = await signUp(formData);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push("/login");
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>create an account to start tracking your debts</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">name</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="john doe"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "creating account..." : "create account"}
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                        already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline">
                            login
                        </Link>
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
