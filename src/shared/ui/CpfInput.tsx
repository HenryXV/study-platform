
"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const CpfInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, onChange, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 11) value = value.slice(0, 11);

            // 000.000.000-00
            value = value.replace(/(\d{3})(\d)/, "$1.$2");
            value = value.replace(/(\d{3})(\d)/, "$1.$2");
            value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

            e.target.value = value;
            onChange?.(e);
        };

        return (
            <input
                ref={ref}
                type="text"
                placeholder="000.000.000-00"
                maxLength={14}
                onChange={handleChange}
                className={cn(
                    "flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            />
        );
    }
);

CpfInput.displayName = "CpfInput";
