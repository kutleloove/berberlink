
import { WebdetekConfig, CreatePaymentRequest, CreateDirectPaymentRequest, PaymentResponse } from "./types";

class WebdetekClient {
    private config: WebdetekConfig;

    constructor(config?: Partial<WebdetekConfig>) {
        this.config = {
            apiKey: config?.apiKey || process.env.WEBDETEK_API_KEY || "",
            apiUrl: config?.apiUrl || process.env.WEBDETEK_API_URL || "http://localhost:3000",
        };

        if (!this.config.apiKey) {
            console.warn("⚠️ Webdetek API Key bulunamadı! Lütfen WEBDETEK_API_KEY env değişkenini tanımlayın.");
        }
    }

    private async request<T>(endpoint: string, method: "GET" | "POST", data?: any): Promise<T> {
        const url = `${this.config.apiUrl}/api/gateway${endpoint}`;

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.config.apiKey,
                },
                body: data ? JSON.stringify(data) : undefined,
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.errorMessage || responseData.message || "Webdetek Gateway Error");
            }

            return responseData as T;
        } catch (error: any) {
            console.error(`Webdetek Request Error [${endpoint}]:`, error.message);
            throw error;
        }
    }

    /**
     * Ortak Ödeme Sayfası Başlatır (Link üretir)
     * Iyzico/PayTR gibi hazır form sayfası döndürür.
     */
    async createPayment(data: CreatePaymentRequest): Promise<PaymentResponse> {
        return this.request<PaymentResponse>("/payment", "POST", data);
    }

    /**
     * Doğrudan (API üzerinden) Ödeme Alır
     * Kendi arayüzünüzdeki kart formu ile çalışır.
     */
    async createDirectPayment(data: CreateDirectPaymentRequest): Promise<PaymentResponse> {
        return this.request<PaymentResponse>("/payment-direct", "POST", data);
    }
}

// Singleton instance export ediyoruz
export const webdetek = new WebdetekClient();
export default WebdetekClient;
