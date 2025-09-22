'use client';

import PaymentHubComponent from '@/components/PaymentHubComponent';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ระบบเติมเงินครบวงจร
          </h1>
          <p className="text-gray-600">
            รองรับทั้ง PromptPay และ TrueWallet ซองอั่งเปา
          </p>
        </div>

        <PaymentHubComponent userId="user_123" />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>สนับสนุนโดย PromptPay QR Code และ TrueWallet Voucher API</p>
          <p className="mt-1">เบอร์รับเงิน: 0944283381</p>
        </div>
      </div>
    </div>
  );
}