import { prisma } from "@/lib/prisma";
import { User, UsageLog } from "@/app/generated/prisma/client";

export const CreditRepository = {
    /**
     * Gets the current credit balance for a user.
     */
    async getBalance(userId: string): Promise<number> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true }
        });
        return user?.credits ?? 0;
    },

    /**
     * Deducts credits and logs usage in a transaction.
     */
    async billUsage(
        userId: string,
        amount: number,
        logData: {
            action: string;
            modelUsed: string;
            tokensIn: number;
            tokensOut: number;
            resourceId?: string;
        }
    ): Promise<void> {
        if (!amount || isNaN(amount) || amount <= 0) {
            console.warn(`[CreditRepository] Invalid billing amount: ${amount}. Defaulting to minimal charge.`);
            // Fallback strategy: prevents crash, but logs warning. 
            // Better than crashing the transaction.
            amount = 10;
        }

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: {
                    credits: {
                        decrement: amount
                    }
                }
            });

            await tx.usageLog.create({
                data: {
                    userId,
                    action: logData.action,
                    cost: amount,
                    modelUsed: logData.modelUsed,
                    tokensIn: logData.tokensIn,
                    tokensOut: logData.tokensOut,
                    resourceId: logData.resourceId,
                }
            });
        });
    }
};
