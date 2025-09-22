# PromptPay & TrueWallet System (Next.js + Nest.js)

ระบบเติมเงินครบวงจรที่รองรับทั้ง PromptPay และ TrueWallet ซองอั่งเปา แปลงจาก React/Express มาเป็น Next.js/Nest.js

## 🚀 Features

### Frontend (Next.js)
- ✅ **PaymentHubComponent** - หน้าหลักสำหรับเลือกวิธีการเติมเงิน
- ✅ **TopUpComponent** - สร้าง QR Code PromptPay และตรวจสอบสถานะการชำระ
- ✅ **TrueWalletComponent** - แลกซองอั่งเปา TrueWallet
- ✅ TypeScript support
- ✅ Tailwind CSS
- ✅ Responsive design

### Backend (Nest.js)
- ✅ **Users Module** - จัดการ user และ credits
- ✅ **Transactions Module** - สร้างและจัดการ PromptPay transactions
- ✅ **TrueWallet Module** - แลกซองและจัดการ vouchers
- ✅ **SMS Module** - รับ SMS webhook สำหรับยืนยันการชำระ
- ✅ **Test Module** - ทดสอบระบบทั้งหมด
- ✅ TypeORM + SQLite
- ✅ CORS enabled
- ✅ Global validation

## 📁 Project Structure

```
├── nextjs-frontend/          # Next.js Frontend
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── PaymentHubComponent.tsx
│   │   ├── TopUpComponent.tsx
│   │   └── TrueWalletComponent.tsx
│   └── .env.local
│
├── nestjs-backend/           # Nest.js Backend
│   ├── src/
│   │   ├── entities/
│   │   ├── users/
│   │   ├── transactions/
│   │   ├── truewallet/
│   │   ├── sms/
│   │   ├── test/
│   │   ├── utils/
│   │   └── main.ts
│   └── .env
│
└── original/                 # Original Project (for reference)
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup (Nest.js)

```bash
cd nestjs-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env file with your settings

# Start development server
npm run start:dev
```

### Frontend Setup (Next.js)

```bash
cd nextjs-frontend

# Install dependencies
npm install

# Configure environment
# Create .env.local with API URL

# Start development server
npm run dev
```

## 🔧 Configuration

### Backend (.env)
```bash
# Database Configuration
DATABASE_URL=database.sqlite

# PromptPay Configuration
PROMPTPAY_PHONE=0944283381

# TrueWallet Configuration
TRUEWALLET_PHONE=0944283381

# Server Configuration
PORT=3001
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 📡 API Endpoints

### Users
- `GET /api/user-credits/:userId` - Get user credits
- `POST /api/fix-credits/:userId` - Fix user credits

### Transactions (PromptPay)
- `POST /api/create-transaction` - Create new transaction
- `GET /api/transaction-status/:transactionId` - Check transaction status
- `GET /api/transactions/:userId` - Get transaction history
- `DELETE /api/transaction/:transactionId` - Delete transaction
- `POST /api/confirm-transaction/:transactionId` - Confirm transaction
- `GET /api/stats` - Get transaction statistics

### TrueWallet
- `POST /api/truewallet/validate` - Validate voucher code
- `POST /api/truewallet/redeem` - Redeem voucher
- `GET /api/truewallet/history/:userId` - Get voucher history
- `GET /api/truewallet/stats` - Get voucher statistics

### SMS Webhook
- `POST /api/sms-webhook` - SMS webhook endpoint
- `GET /api/sms-logs` - Get SMS logs
- `POST /api/test-sms-parsing` - Test SMS parsing

### Testing
- `POST /api/test-qr` - Test QR generation
- `POST /api/test-sms-parse` - Test SMS parsing
- `GET /api/system-info` - Get system information
- `GET /api/run-all-tests` - Run all tests
- `GET /api/health-check` - Health check

## 🚀 Usage

1. Start both backend and frontend servers
2. Open http://localhost:3000 for the frontend
3. Backend API available at http://localhost:3001/api

### PromptPay Flow
1. Enter amount in TopUp component
2. Generate QR Code
3. Scan and pay via PromptPay
4. SMS webhook confirms payment
5. Credits automatically updated

### TrueWallet Flow
1. Copy voucher code from TrueWallet app
2. Paste into TrueWallet component
3. Redeem voucher
4. Credits automatically updated

## 🧪 Testing

```bash
# Backend tests
cd nestjs-backend
npm run test

# Test all systems
curl http://localhost:3001/api/run-all-tests

# Test specific features
curl -X POST http://localhost:3001/api/test-qr \
  -H "Content-Type: application/json" \
  -d '{"phone":"0944283381","amount":100}'
```

## 📋 Migration Changes

### From Original React/Express to Next.js/Nest.js

#### Frontend Changes:
- ✅ React → Next.js 15
- ✅ JavaScript → TypeScript
- ✅ CSS → Tailwind CSS
- ✅ Component structure preserved
- ✅ API calls updated to TypeScript

#### Backend Changes:
- ✅ Express → Nest.js
- ✅ JavaScript → TypeScript
- ✅ SQLite queries → TypeORM
- ✅ Route handlers → Controllers
- ✅ Business logic → Services
- ✅ Modular architecture
- ✅ Global validation & CORS

#### Database Changes:
- ✅ Raw SQL → TypeORM entities
- ✅ Type safety
- ✅ Auto-migration support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is private and confidential.

## 🆘 Support

For issues and questions:
1. Check the original project documentation
2. Test endpoints using the built-in test module
3. Review TypeScript types and interfaces

---

**Note**: This is a complete conversion from the original React/Express system to Next.js/Nest.js with TypeScript, maintaining all original functionality while adding modern development practices and type safety.