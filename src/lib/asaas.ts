import "server-only";

const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://api-sandbox.asaas.com/v3";
// Note: ASAAS_ACCESS_TOKEN should include the "$aact_" prefix in the env var
const ASAAS_ACCESS_TOKEN = process.env.ASAAS_ACCESS_TOKEN;

if (!ASAAS_ACCESS_TOKEN) {
    console.warn("[Asaas] Missing ASAAS_ACCESS_TOKEN in environment variables.");
}


interface AsaasPaymentRequest {
    customer: string;
    billingType: "PIX";
    value: number;
    dueDate: string;
    description?: string;
}

interface AsaasPaymentResponse {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    billingType: string;
    status: string;
    invoiceUrl: string;
}

interface AsaasPixQrCodeResponse {
    encodedImage: string;
    payload: string;
    expirationDate: string;
}

interface AsaasCustomerRequest {
    name: string;
    cpfCnpj?: string;
    email?: string;
    phone?: string;
    mobilePhone?: string;
    externalReference?: string;
}

interface AsaasCustomerResponse {
    id: string;
}

export const asaas = {
    async createCustomer(data: AsaasCustomerRequest): Promise<AsaasCustomerResponse> {
        const response = await fetch(`${ASAAS_API_URL}/customers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                access_token: ASAAS_ACCESS_TOKEN!,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Asaas Create Customer Error: ${JSON.stringify(errorData)}`);
        }

        return response.json();
    },

    async createPayment(data: AsaasPaymentRequest): Promise<AsaasPaymentResponse> {
        const response = await fetch(`${ASAAS_API_URL}/payments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                access_token: ASAAS_ACCESS_TOKEN!,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Asaas Create Payment Error: ${JSON.stringify(errorData)}`);
        }

        return response.json();
    },

    async getPixQrCode(paymentId: string): Promise<AsaasPixQrCodeResponse> {
        const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                access_token: ASAAS_ACCESS_TOKEN!,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Asaas Get Pix QR Code Error: ${JSON.stringify(errorData)}`);
        }

        return response.json();
    },
};
