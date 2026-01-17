import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    className?: string;
    size?: number;
}

export function LoadingSpinner({ className, size = 24 }: LoadingSpinnerProps) {
    return (
        <Loader2
            className={`animate-spin text-zinc-400 ${className}`}
            size={size}
        />
    );
}
