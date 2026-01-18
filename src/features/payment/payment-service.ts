import { prisma } from "@/lib/prisma";

export interface AsaasWebhookEvent {
    event: string;
    payment: {
        id: string;
        customer: string;
        value: number;
        netValue: number;
        status: string;
        billingType: string;
        description?: string;
    };
}

export const paymentService = {
    async processWebhook(webhookEvent: AsaasWebhookEvent) {
        const { event, payment } = webhookEvent;

        console.log(`[PaymentService] Processing webhook: ${event} for payment ${payment.id}`);

        // We only care about payments that are confirmed/received for now
        if (event !== "PAYMENT_RECEIVED" && event !== "PAYMENT_CONFIRMED") {
            console.log(`[PaymentService] Ignoring event: ${event}`);
            return { success: true, message: "Event ignored" };
        }

        try {
            // Use a transaction to ensure atomicity
            await prisma.$transaction(async (tx) => {
                // 1. Find the local transaction record
                const transaction = await tx.transaction.findUnique({
                    where: { asaasPaymentId: payment.id },
                });

                if (!transaction) {
                    console.error(`[PaymentService] Transaction not found for Asaas ID: ${payment.id}`);
                    // We return success to Asaas so they stop retrying, but we log the error
                    return;
                }

                if (transaction.status === "COMPLETED") {
                    console.log(`[PaymentService] Transaction ${transaction.id} already completed. Skipping.`);
                    return;
                }

                // 2. Update transaction status
                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: "COMPLETED",
                        // Optionally update other fields if needed
                    },
                });

                // 3. Credit the user
                await tx.user.update({
                    where: { id: transaction.userId },
                    data: {
                        credits: {
                            increment: transaction.creditsAdded,
                        },
                    },
                });

                console.log(`[PaymentService] Credits added for user ${transaction.userId}`);
            });

            return { success: true };
        } catch (error) {
            console.error("[PaymentService] Error processing webhook:", error);
            throw error; // Re-throw to let the route handler deal with 500s if needed
        }
    },
};
