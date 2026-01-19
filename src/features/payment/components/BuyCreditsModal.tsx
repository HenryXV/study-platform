
"use client";

import { useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { createPixPaymentAction, CreatePixPaymentResult } from "../actions/payment-actions";
import { Check, Copy } from "lucide-react";
import { CpfInput } from "@/shared/ui/CpfInput";
import { CREDIT_PACKAGES } from "../config/credits-config";

interface BuyCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
}


export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
    const [step, setStep] = useState<"select" | "cpf" | "payment">("select");
    const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentData, setPaymentData] = useState<CreatePixPaymentResult["data"] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [cpf, setCpf] = useState("");

    const handleSelectPackage = (pkg: typeof CREDIT_PACKAGES[0]) => {
        setSelectedPackage(pkg);
        setStep("cpf");
        setError(null);
    };

    const handleBuy = async () => {
        if (cpf.length < 14) {
            setError("Please enter a valid CPF");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const result = await createPixPaymentAction(selectedPackage.amount, selectedPackage.credits, cpf);
            if (result.success && result.data) {
                setPaymentData(result.data);
                setStep("payment");
            } else {
                setError(result.error || "Failed to create payment");
            }
        } catch (e) {
            console.error(e);
            setError("Unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (paymentData?.pixCode) {
            navigator.clipboard.writeText(paymentData.pixCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setStep("select");
        setPaymentData(null);
        setError(null);
        setCpf("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
            <div className="p-6 space-y-6">
                <div className="space-y-2 text-center">
                    <h2 className="text-xl font-semibold text-zinc-100">
                        {step === "select" && "Add Credits"}
                        {step === "cpf" && "Billing Details"}
                        {step === "payment" && "Complete Payment"}
                    </h2>
                    <p className="text-sm text-zinc-400">
                        {step === "select" && "Choose a credit package to continue your studies."}
                        {step === "cpf" && "Please enter your CPF for the Pix invoice."}
                        {step === "payment" && "Scan the QR Code or copy the Pix key below."}
                    </p>
                </div>

                {step === "select" && (
                    <div className="space-y-4">
                        <div className="grid gap-3">
                            {CREDIT_PACKAGES.map((pkg) => (
                                <button
                                    key={pkg.label}
                                    onClick={() => handleSelectPackage(pkg)}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${selectedPackage.label === pkg.label
                                        ? "border-emerald-500 bg-emerald-950/20 text-emerald-100"
                                        : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800"
                                        }`}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{pkg.label} ({pkg.credits} Credits)</span>
                                    </div>
                                    <span className="font-semibold">R$ {pkg.amount.toFixed(2)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === "cpf" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">CPF</label>
                            <CpfInput
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-200 bg-red-950/30 border border-red-900/50 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setStep("select")}
                                disabled={isLoading}
                            >
                                Back
                            </Button>
                            <Button
                                className="w-full"
                                onClick={handleBuy}
                                isLoading={isLoading}
                                variant="default"
                            >
                                Pay R$ {selectedPackage.amount.toFixed(2)}
                            </Button>
                        </div>
                    </div>
                )}

                {step === "payment" && paymentData && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-center p-4 bg-white rounded-lg mx-auto w-fit">
                            <img
                                src={`data:image/png;base64,${paymentData.encodedImage}`}
                                alt="Pix QR Code"
                                className="w-48 h-48"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                Pix Copy & Paste
                            </label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 p-3 bg-zinc-950 rounded-lg text-xs font-mono text-zinc-400 break-all border border-zinc-800">
                                    {paymentData.pixCode}
                                </code>
                                <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
                                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="text-center text-xs text-zinc-500">
                            Expires on {new Date(paymentData.expirationDate).toLocaleString()}
                        </div>

                        <Button
                            variant="ghost"
                            className="w-full text-zinc-400 hover:text-zinc-300"
                            onClick={handleClose}
                        >
                            Close
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
