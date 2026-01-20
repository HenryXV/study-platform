import { feedbackRepository } from "../repositories/feedback-repository";
import { SubmitFeedbackInput } from "../schemas/feedback-schema";

export class FeedbackService {
    async submitFeedback(data: SubmitFeedbackInput, userId?: string) {
        // Here we can perform any business logic, simpler for now just calling repo
        // e.g. We might want to notify admin via email/slack in the future

        return feedbackRepository.createFeedback({
            message: data.message,
            type: data.type,
            url: data.url,
            metadata: data.metadata ? (data.metadata as any) : undefined,
            user: userId ? { connect: { id: userId } } : undefined,
        });
    }
}

export const feedbackService = new FeedbackService();
