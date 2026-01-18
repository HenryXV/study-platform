import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/features/payment/payment-service";

export async function POST(req: NextRequest) {
    try {
        // 1. Security Check
        const asaasToken = req.headers.get("asaas-access-token");
        if (asaasToken !== process.env.ASAAS_WEBHOOK_SECRET) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Parse Body
        const body = await req.json();

        // 3. Process
        await paymentService.processWebhook(body);

        // 4. Respond OK
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[Asaas Webhook] Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
