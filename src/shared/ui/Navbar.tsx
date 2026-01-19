import { LanguageSwitcher } from "@/shared/ui/LanguageSwitcher";
import { UserButton } from "@clerk/nextjs";
import { CreditsWidget } from "@/features/payment/components/CreditsWidget";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
    variant?: "constrained" | "full";
}

export async function Navbar({ variant = "constrained" }: NavbarProps) {
    let user;
    try {
        user = await getCurrentUser();
    } catch (e) {
        user = null;
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
            <div className={cn(
                "flex h-14 items-center justify-between px-4 sm:px-8",
                variant === "constrained" && "container max-w-7xl mx-auto"
            )}>
                <div className="flex items-center gap-2">
                    <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-bold text-zinc-100 hover:text-white transition-colors">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
                            <Sparkles className="h-4 w-4 text-emerald-500" />
                        </div>
                        <span>Systemizer</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {user && (
                        <>
                            <CreditsWidget credits={user.credits} />
                            <div className="h-6 w-px bg-zinc-800" />
                        </>
                    )}

                    <LanguageSwitcher />

                    {user && (
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "h-8 w-8 ring-2 ring-zinc-800 hover:ring-zinc-700 transition-all",
                                    userButtonTrigger: "focus:shadow-none"
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </header>
    );
}
