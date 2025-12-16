
export interface WebdetekConfig {
    apiKey: string;
    apiUrl: string;
}

export interface Buyer {
    id: string;
    name: string;
    surname: string;
    email: string;
    identityNumber: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    ip?: string;
}

export interface ProductData {
    name?: string; // e.g. "Yıllık Abonelik"
    sku?: string;
    paymentGroup?: string; // DEFAULT, SUBSCRIPTION
    paymentChannel?: string; // WEB, MOBILE
    conversationId?: string;
    externalProductId?: string; // Sizin sisteminizdeki paket ID
}

export interface CreditCard {
    cardHolderName: string;
    cardNumber: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
    registerCard?: boolean; // Kartı sakla (opsiyonel)
}

export interface CreatePaymentRequest {
    orderId: string;
    amount: number | string;
    currency: 'TRY' | 'USD' | 'EUR';
    installment?: number; // Taksit (varsayılan 1)
    productData?: ProductData;
    buyer: Buyer;
    callbackUrl?: string; // Ödeme sonrası dönüş adresi
}

export interface CreateDirectPaymentRequest extends CreatePaymentRequest {
    card: CreditCard;
}

export interface PaymentResponse {
    status: 'success' | 'failure';
    paymentPageUrl?: string; // Ödeme formu modu için
    htmlContent?: string;    // iframe/html modu için
    transactionId?: string;
    paymentId?: string;
    errorCode?: string;
    errorMessage?: string;
    systemTime?: number;
}
