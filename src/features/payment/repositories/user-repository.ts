
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export const userRepository = {
    async addCredits(userId: string, amount: number, tx?: Tx) {
        const client = tx || prisma;
        return await client.user.update({
            where: { id: userId },
            data: {
                credits: {
                    increment: amount,
                },
            },
        });
    },

    async updateAsaasCustomerId(userId: string, asaasCustomerId: string, tx?: Tx) {
        const client = tx || prisma;
        return await client.user.update({
            where: { id: userId },
            data: { asaasCustomerId },
        });
    },

    async findById(userId: string, tx?: Tx) {
        const client = tx || prisma;
        return await client.user.findUnique({
            where: { id: userId },
        });
    }
};
