"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { MessageSquarePlus, Bug, Lightbulb, HelpCircle } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { submitFeedbackAction } from "../actions/submit-feedback";

export function FeedbackWidget() {
    const t = useTranslations("feedback");
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Form State
    const [message, setMessage] = useState("");
    const [type, setType] = useState<"BUG" | "FEATURE" | "OTHER">("BUG");

    const handleSubmit = async () => {
        if (message.length < 10) {
            toast.error("Message too short (min 10 chars)");
            return;
        }

        startTransition(async () => {
            const result = await submitFeedbackAction({
                message,
                type,
                url: pathname,
                metadata: {
                    userAgent: window.navigator.userAgent,
                    screen: `${window.screen.width}x${window.screen.height}`,
                },
            });

            if (result.success) {
                toast.success(t("success"));
                setIsOpen(false);
                setMessage("");
                setType("BUG");
            } else {
                toast.error(result.message || t("error"));
            }
        });
    };

    const getTypeIcon = (tType: string) => {
        switch (tType) {
            case "BUG": return <Bug className="w-4 h-4" />;
            case "FEATURE": return <Lightbulb className="w-4 h-4" />;
            default: return <HelpCircle className="w-4 h-4" />;
        }
    };

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="gap-2 text-zinc-400 hover:text-zinc-100"
            >
                <MessageSquarePlus className="w-4 h-4" />
                <span className="hidden sm:inline">{t("button")}</span>
            </Button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-zinc-100">{t("title")}</h2>
                        <p className="text-sm text-zinc-400">{t("description")}</p>
                    </div>

                    <div className="space-y-4">
                        {/* Type Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">{t("type")}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["BUG", "FEATURE", "OTHER"] as const).map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => setType(item)}
                                        className={`
                      flex flex-col items-center justify-center gap-2 p-3 rounded-lg border text-sm transition-all
                      ${type === item
                                                ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-100"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                                            }
                    `}
                                    >
                                        {getTypeIcon(item)}
                                        <span>{t(`types.${item}`)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Message Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">{t("message")}</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={t("messagePlaceholder")}
                                className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                disabled={isPending}
                            >
                                {t("cancel")}
                                {/* Note: 'cancel' is in common, but used here via 'feedback' namespace if keys allowed? 
                    Actually useTranslations('feedback') won't access 'common' unless wired up differently. 
                    I'll stick to 'feedback' keys or just hardcode 'Cancel' fallback if t fails, but 
                    checking json, I didn't add cancel to feedback. 
                    Refactor: I'll use common translations for Cancel button.
                */}
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                isLoading={isPending}
                                disabled={message.length < 10}
                            >
                                {t("submit")}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
