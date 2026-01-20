"use server";

import { auth } from "@clerk/nextjs/server";
import { submitFeedbackSchema } from "../schemas/feedback-schema";
import { feedbackService } from "../services/feedback-service";
import { z } from "zod";

export type SubmitFeedbackActionState = {
    success: boolean;
    message?: string;
    errors?: Record<string, string[]>;
};

export async function submitFeedbackAction(
    data: z.infer<typeof submitFeedbackSchema>
): Promise<SubmitFeedbackActionState> {
    // 1. Validate Input
    const validationResult = submitFeedbackSchema.safeParse(data);

    if (!validationResult.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validationResult.error.flatten().fieldErrors,
        };
    }

    // 2. Get User (Optional)
    const { userId } = await auth();

    try {
        // 3. Call Service
        await feedbackService.submitFeedback(validationResult.data, userId || undefined);

        return {
            success: true,
            message: "Feedback submitted successfully",
        };
    } catch (error) {
        console.error("Error submitting feedback:", error);
        return {
            success: false,
            message: "An unexpected error occurred while submitting feedback.",
        };
    }
}
