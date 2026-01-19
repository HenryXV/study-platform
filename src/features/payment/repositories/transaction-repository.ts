
import { prisma } from "@/lib/prisma";
import { Transaction, Prisma } from "@/app/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export const transactionRepository = {
    async create(data: {
        userId: string;
        asaasId: string;
        amount: number;
        creditsAmount: number;
        status: string;
        invoiceUrl?: string; // Prisma model says String? so it can be undefined/null
        pixCode?: string;
    }, tx?: Tx) {
        const client = tx || prisma;
        return await client.transaction.create({
            data: {
                userId: data.userId,
                asaasId: data.asaasId,
                amount: data.amount,
                creditsAmount: data.creditsAmount,
                status: data.status,
                invoiceUrl: data.invoiceUrl,
                pixCode: data.pixCode,
            },
        });
    },

    async findByAsaasId(asaasId: string, tx?: Tx): Promise<Transaction | null> {
        const client = tx || prisma;
        return await client.transaction.findUnique({
            where: { asaasId },
        });
    },

    async findById(id: string, tx?: Tx): Promise<Transaction | null> {
        const client = tx || prisma;
        return await client.transaction.findUnique({
            where: { id },
        });
    },

    async updateStatus(id: string, status: string, tx?: Tx) {
        const client = tx || prisma;
        return await client.transaction.update({
            where: { id },
            data: { status },
        });
    },

    // Using transaction client for atomic updates (e.g. within a webhook processing flow)
    // However, Prisma repositories usually just expose methods. 
    // For the webhook transaction (update tx + update user), it's often better to keep the transaction logic in the Service 
    // or expose a method that accepts a prisma Client/TransactionClient.
    // Given the constraints/simplicity, I will keep the transaction block in the service but use the repository methods if possible, 
    // OR expose a method that takes `tx` as an optional argument.
    // Let's stick to simple methods first. The Service handles the atomic business logic.
};
