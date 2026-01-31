"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<
    React.PropsWithChildren<{}>,
    ErrorBoundaryState
> {
    constructor(props: React.PropsWithChildren<{}>) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center p-4">
                    <div className="w-full max-w-md space-y-4 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">something went wrong</h1>
                        <p className="text-muted-foreground">
                            we're sorry, but something unexpected happened. please try refreshing the page.
                        </p>
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <details className="text-left">
                                <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                                    technical details
                                </summary>
                                <pre className="whitespace-pre-wrap text-xs bg-secondary p-2 rounded">
                                    {this.state.error.message}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                        <Button onClick={() => window.location.reload()} className="w-full">
                            refresh page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}