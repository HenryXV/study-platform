import { CreditRepository } from "@/features/payment/repositories/credit-repository";

/**
 * Checks if the user has enough credits for the estimated operation cost.
 */
export async function hasSufficientBalance(userId: string, estimatedCost: number): Promise<boolean> {
    const balance = await CreditRepository.getBalance(userId);
    return balance >= estimatedCost;
}

/**
 * Deducts credits from user and logs the usage.
 */
export async function billUsage(
    userId: string,
    cost: number,
    details: {
        action: string;
        model: string;
        inputTokens: number;
        outputTokens: number;
        resourceId?: string;
    }
): Promise<void> {
    await CreditRepository.billUsage(userId, cost, {
        action: details.action,
        modelUsed: details.model,
        tokensIn: details.inputTokens,
        tokensOut: details.outputTokens,
        resourceId: details.resourceId,
    });
}
