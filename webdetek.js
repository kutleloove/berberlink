/**
 * Webdetek Ödeme Entegrasyon Kütüphanesi
 * 
 * Bu dosya Webdetek Sanal POS Gateway servisi ile iletişim kurmak için kullanılır.
 * Diğer Node.js projelerinizde (örn: Novelhan) bu dosyayı 'utils' klasörüne atıp
 * aşağıda belirtilen env değişkenlerini ayarlayarak kullanabilirsiniz.
 * 
 * GEREKSİNİMLER:
 * - Node.js v18+ (yerel 'fetch' API'si kullanılır)
 * - .env dosyasında aşağıdaki değişkenler tanımlanmalıdır:
 * 
 * WEBDETEK_API_URL=http://localhost:3000 (veya canlı sunucu adresi)
 * WEBDETEK_API_KEY=pk_... (Dashboard'dan aldığınız API Key)
 * 
 * KULLANIM ÖRNEKLERİ:
 * -------------------
 * const Webdetek = require('./utils/webdetek');
 * 
 * // 1. Ödeme Formu Başlatma (Iyzico Ortak Ödeme Sayfası)
 * try {
 *    const result = await Webdetek.Payment.create({
 *        orderId: 'SIP-1001',
 *        amount: '150.00',
 *        currency: 'TRY',
 *        productData: { name: 'Yıllık Abonelik', sku: 'SUB-Year' },
 *        buyer: {
 *             id: 'USR-123',
 *             name: 'Ali',
 *             surname: 'Veli',
 *             email: 'ali@test.com',
 *             identityNumber: '11111111111',
 *             address: 'Istanbul',
 *             phone: '+905555555555'
 *        }
 *    });
 *    console.log('Ödeme Sayfası:', result.paymentPageUrl);
 * } catch (error) {
 *    console.error('Hata:', error.message);
 * }
 * 
 * // 2. Doğrudan Ödeme (Kart Bilgisi ile - API)
 * try {
 *     const result = await Webdetek.Payment.createDirect({
 *         orderId: 'SIP-1002',
 *         amount: '200.00',
 *         card: {
 *             cardHolderName: 'Ali Veli',
 *             cardNumber: '4543...',
 *             expireMonth: '12',
 *             expireYear: '2025',
 *             cvc: '123'
 *         },
 *         buyer: { ... }, // Alıcı bilgileri (zorunlu)
 *         productData: { ... }
 *     });
 *     console.log('Sonuç:', result.status);
 * } catch (err) { ... }
 */

// Konfigürasyon
const config = {
    apiKey: process.env.WEBDETEK_API_KEY,
    apiUrl: process.env.WEBDETEK_API_URL || 'http://localhost:3001', // Gateway adresi
    // Secret key şu an imzalama için zorunlu değil ama ileride webhook doğrulama için kullanılabilir
    apiSecret: process.env.WEBDETEK_API_SECRET
};

/**
 * HTTP İsteği Yardımcı Fonksiyonu
 */
async function request(endpoint, method, data) {
    if (!config.apiKey) {
        throw new Error('WEBDETEK_API_KEY environment variable is not set.');
    }

    const url = `${config.apiUrl}/api/gateway${endpoint}`;

    // Node.js v18+ yerel fetch API
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey
        },
        body: JSON.stringify(data)
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw new Error(responseData.message || responseData.errorMessage || 'Webdetek Gateway Error');
    }

    return responseData;
}

const Webdetek = {
    Payment: {
        /**
         * Ödeme Formu Başlatır (Link üretir)
         * @param {Object} data Ödeme verileri
         * @returns {Promise<Object>} { paymentPageUrl, transactionId, ... }
         */
        create: async (data) => {
            return await request('/payment', 'POST', data);
        },

        /**
         * Doğrudan Kart ile Ödeme Alır
         * @param {Object} data Ödeme verileri + kart bilgisi
         * @returns {Promise<Object>} { status, transactionId, paymentId }
         */
        createDirect: async (data) => {
            return await request('/payment-direct', 'POST', data);
        }
    },

    /**
     * Webhook'tan gelen imzanın doğruluğunu kontrol eder (Opsiyonel Güvenlik)
     * Henüz gateway tarafında imza gönderme aktif değilse bu fonksiyon şablon niteliğindedir.
     */
    verifyWebhook: (signature, body) => {
        // İleride eklenebilir: crypto.createHmac...
        return true;
    }
};

module.exports = Webdetek;
