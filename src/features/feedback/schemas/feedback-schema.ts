import { z } from "zod";

export const submitFeedbackSchema = z.object({
    message: z.string().min(10, "Message must be at least 10 characters long"),
    type: z.enum(["BUG", "FEATURE", "OTHER"]),
    url: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
