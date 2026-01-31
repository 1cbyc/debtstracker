"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, title: string, description?: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { id, type, title, description };
        
        setToasts(prev => [...prev, newToast]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case "success":
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "error":
                return <XCircle className="h-5 w-5 text-red-500" />;
            case "warning":
                return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            case "info":
                return <AlertCircle className="h-5 w-5 text-blue-500" />;
        }
    };

    const getBorderColor = (type: ToastType) => {
        switch (type) {
            case "success":
                return "border-l-green-500";
            case "error":
                return "border-l-red-500";
            case "warning":
                return "border-l-yellow-500";
            case "info":
                return "border-l-blue-500";
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-2 w-80 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            bg-card border border-border ${getBorderColor(toast.type)} border-l-4
                            rounded-lg p-4 shadow-lg pointer-events-auto
                            animate-in slide-in-from-right-full duration-300
                        `}
                    >
                        <div className="flex items-start gap-3">
                            {getIcon(toast.type)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                    {toast.title}
                                </p>
                                {toast.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {toast.description}
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => removeToast(toast.id)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}