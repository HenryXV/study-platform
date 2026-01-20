import { prisma } from "@/lib/prisma";
import { asaas } from "@/lib/asaas";
import { transactionRepository } from "./repositories/transaction-repository";
import { userRepository } from "./repositories/user-repository";
import { ValidationError } from "@/lib/errors";

export interface AsaasWebhookEvent {
    id?: string;
    event: string;
    dateCreated?: string;
    payment: {
        id: string;
        customer: string;
        value: number;
        netValue: number;
        status: string;
        billingType: string;
        description?: string;
        externalReference?: string;
    };
}

export const paymentService = {
    async processWebhook(webhookEvent: AsaasWebhookEvent) {
        const { event, payment } = webhookEvent;

        console.log(`[PaymentService] Processing webhook: ${event} for payment ${payment.id}`, JSON.stringify(webhookEvent, null, 2));

        // We only care about payments that are confirmed/received for now
        if (event !== "PAYMENT_RECEIVED" && event !== "PAYMENT_CONFIRMED") {
            console.log(`[PaymentService] Ignoring event: ${event}`);
            return { success: true, message: "Event ignored" };
        }

        try {
            // Use a transaction to ensure atomicity
            await prisma.$transaction(async (tx) => {
                // 1. Find the local transaction record
                const transaction = await transactionRepository.findByAsaasId(payment.id, tx);

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
                await transactionRepository.updateStatus(transaction.id, "COMPLETED", tx);

                // 3. Credit the user
                await userRepository.addCredits(transaction.userId, transaction.creditsAmount, tx);

                console.log(`[PaymentService] Credits added for user ${transaction.userId}`);
            });

            return { success: true };
        } catch (error) {
            console.error("[PaymentService] Error processing webhook:", error);
            throw error; // Re-throw to let the route handler deal with 500s if needed
        }
    },

    async createPixTransaction(params: {
        userId: string;
        userEmail: string;
        userName: string;
        cpf: string;
        amount: number;
        credits: number;
    }) {
        const { userId, userEmail, userName, cpf, amount, credits } = params;

        try {
            // 1. Create OR Retrieve Customer in Asaas
            let asaasCustomerId: string | undefined;

            // Check if user already has an Asaas Customer ID
            const user = await userRepository.findById(userId);
            if (user?.asaasCustomerId) {
                asaasCustomerId = user.asaasCustomerId;
            } else {
                // Create new customer
                try {
                    const customer = await asaas.createCustomer({
                        name: userName,
                        email: userEmail,
                        cpfCnpj: cpf,
                        notificationDisabled: true,
                    });

                    asaasCustomerId = customer.id;

                    // Save to user for future use
                    await userRepository.updateAsaasCustomerId(userId, asaasCustomerId);

                } catch (error: any) {
                    // Handle specific Asaas errors
                    const errorString = String(error);
                    if (errorString.includes("invalid_cpf") || errorString.includes("cpf_cnpj_invalid")) {
                        throw new ValidationError("The provided CPF is invalid. Please check and try again.");
                    }
                    throw error;
                }
            }

            if (!asaasCustomerId) {
                throw new Error("Failed to resolve Asaas Customer ID");
            }

            // 2. Create Payment
            const payment = await asaas.createPayment({
                customer: asaasCustomerId,
                billingType: "PIX",
                value: amount,
                dueDate: new Date().toISOString().split("T")[0], // Today
                description: `Credits purchase: ${credits} credits`,
            });

            // 3. Get Pix QR Code
            const qrCode = await asaas.getPixQrCode(payment.id);

            // 4. Save to Database
            const transaction = await transactionRepository.create({
                userId,
                asaasId: payment.id,
                amount,
                creditsAmount: credits,
                status: "PENDING",
                invoiceUrl: payment.invoiceUrl,
                pixCode: qrCode.payload,
            });

            return {
                paymentId: payment.id,
                invoiceUrl: payment.invoiceUrl,
                pixCode: qrCode.payload,
                encodedImage: qrCode.encodedImage,
                expirationDate: qrCode.expirationDate,
            };

        } catch (error: any) {
            console.error("[PaymentService] Error creating Pix transaction:", error);

            if (error.message === "The provided CPF is invalid. Please check and try again.") {
                throw error; // Pass through our custom error
            }

            // Check generic Asaas errors in createPayment if any
            const errorString = String(error);
            if (errorString.includes("invalid_cpf") || errorString.includes("cpf_cnpj_invalid")) {
                throw new ValidationError("The provided CPF is invalid. Please check and try again.");
            }

            throw error;
        }
    },
};
