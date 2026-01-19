"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { paymentService } from "../payment-service";
import { revalidatePath } from "next/cache";
import { DomainError } from "@/lib/errors";

// Validation schema for payment input
const PaymentInputSchema = z.object({
    amount: z.number().positive("Amount must be positive").max(10000, "Amount exceeds maximum"),
    credits: z.number().positive("Credits must be positive").int("Credits must be an integer"),
    cpf: z.string().length(14, "CPF must be in format XXX.XXX.XXX-XX"),
});

export interface CreatePixPaymentResult {
    success: boolean;
    data?: {
        paymentId: string;
        invoiceUrl: string;
        pixCode: string;
        encodedImage: string;
        expirationDate: string;
    };
    error?: string;
}

export async function createPixPaymentAction(amount: number, credits: number, cpf: string): Promise<CreatePixPaymentResult> {
    // Validate input
    const validation = PaymentInputSchema.safeParse({ amount, credits, cpf });
    if (!validation.success) {
        return { success: false, error: validation.error.issues[0]?.message || "Invalid input" };
    }

    try {
        const user = await getCurrentUser();

        const result = await paymentService.createPixTransaction({
            userId: user.id,
            userEmail: user.email,
            userName: user.name || "User",
            cpf: validation.data.cpf,
            amount: validation.data.amount,
            credits: validation.data.credits,
        });

        // Revalidate where the credits or transaction history might be shown
        revalidatePath("/dashboard");

        return {
            success: true,
            data: result,
        };
    } catch (error: any) {
        console.error("Error in createPixPaymentAction:", error);

        if (error instanceof DomainError) {
            return { success: false, error: error.message };
        }

        return { success: false, error: "Failed to create payment" };
    }
}
