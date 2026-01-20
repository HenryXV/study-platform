import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export class FeedbackRepository {
    async createFeedback(data: Prisma.FeedbackCreateInput) {
        return prisma.feedback.create({
            data,
        });
    }
}

export const feedbackRepository = new FeedbackRepository();
