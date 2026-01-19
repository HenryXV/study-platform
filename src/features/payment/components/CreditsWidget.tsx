
"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Coins, Plus } from "lucide-react";
import { BuyCreditsModal } from "./BuyCreditsModal";

interface CreditsWidgetProps {
    credits: number;
}

// Currently purely presentational. Logic handled by parent.
export function CreditsWidget({ credits }: CreditsWidgetProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const formattedCredits = credits > 1000
        ? `${(credits / 1000).toFixed(1)}k`
        : credits;

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 h-9 border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700 transition-all font-mono"
            >
                <Coins className="w-4 h-4 text-emerald-500" />
                <span>{formattedCredits}</span>
                <Plus className="w-3 h-3 ml-1 opacity-50" />
            </Button>

            <BuyCreditsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
