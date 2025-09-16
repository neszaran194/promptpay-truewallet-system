# PromptPay & TrueWallet Payment System

A complete payment integration system supporting both PromptPay QR Code generation and TrueWallet voucher redemption with automatic SMS detection.

## Features

### PromptPay Integration
- Generate dynamic PromptPay QR codes with random cents for security
- Automatic transaction timeout (5 minutes)
- SMS detection with KBank curl format support
- Real-time transaction status monitoring
- Auto-cleanup of expired transactions

### TrueWallet Integration
- Redeem TrueWallet vouchers using codes or gift URLs
- Duplicate voucher protection
- Voucher transaction history tracking
- Comprehensive error handling with Thai language messages
- Statistics and analytics

### System Features
- User credit management
- Transaction history for both payment methods
- Admin dashboard with payment statistics
- RESTful API with comprehensive endpoints
- React frontend with tabbed interface
- SQLite database with auto-migrations
- Rate limiting and security headers

## Tech Stack

**Backend:**
- Node.js + Express
- SQLite database
- @fortune-inc/tw-voucher for TrueWallet integration
- promptpay-qr for QR code generation
- SMS webhook integration

**Frontend:**
- React 19
- Tailwind CSS
- Lucide React icons
- Axios for API calls

## Quick Start

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/neszaran194/promptpay-truewallet-system.git
cd promptpay-truewallet-system
```

2. **Backend setup**
```bash
# Install backend dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# The phone number 0944283381 is locked for both payment methods
```

3. **Frontend setup**
```bash
cd frontend
npm install

# Copy environment file
cp .env.example .env
```

4. **Start the application**
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Environment Configuration

### Backend (.env)
```env
PORT=3001
DB_PATH=./transactions.db
NODE_ENV=development

# Locked phone numbers
PROMPTPAY_PHONE=0944283381
TRUEWALLET_PHONE=0944283381

# Security
SMS_WEBHOOK_SECRET=your_webhook_secret_here
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_TRUEWALLET_PHONE=0944283381
REACT_APP_PROMPTPAY_PHONE=0944283381
```

## API Documentation

### Core Endpoints

#### PromptPay
- `POST /api/create-transaction` - Create new transaction
- `GET /api/transaction-status/:id` - Check transaction status
- `POST /api/sms-webhook` - SMS webhook for auto-confirmation

#### TrueWallet
- `POST /api/truewallet/redeem` - Redeem voucher
- `GET /api/truewallet/history/:userId` - Voucher history
- `GET /api/truewallet/stats` - Voucher statistics
- `POST /api/truewallet/validate` - Validate voucher code

#### User Management
- `GET /api/user-credits/:userId` - Get user credits
- `GET /api/transactions/:userId` - Transaction history
- `POST /api/fix-credits/:userId` - Manual credit adjustment

#### System
- `GET /api/health` - Health check
- `GET /api/stats` - System statistics
- `GET /api/payment/stats` - Payment method statistics

### Usage Examples

#### Create PromptPay Transaction
```javascript
const response = await fetch('/api/create-transaction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_123',
    amount: 100
  })
});
```

#### Redeem TrueWallet Voucher
```javascript
const response = await fetch('/api/truewallet/redeem', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_123',
    voucherCode: 'xxxxhFog10Ijbmg1c'
  })
});
```

## Project Structure

```
promptpay-truewallet-system/
├── backend/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── services/
│   │   ├── userService.js       # User management
│   │   ├── transactionService.js # PromptPay transactions
│   │   └── truewalletService.js # TrueWallet vouchers
│   ├── utils/
│   │   ├── promptpay.js         # QR code generation
│   │   └── smsParser.js         # SMS detection logic
│   ├── routes/
│   │   ├── transactions.js      # PromptPay endpoints
│   │   ├── users.js            # User endpoints
│   │   ├── sms.js              # SMS webhook
│   │   ├── truewallet.js       # TrueWallet endpoints
│   │   └── test.js             # Testing endpoints
│   ├── middleware/
│   │   └── index.js            # Security & logging
│   └── server.js               # Main application
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PaymentHubComponent.jsx   # Main interface
│   │   │   ├── TopUpComponent.jsx        # PromptPay UI
│   │   │   └── TrueWalletComponent.jsx   # TrueWallet UI
│   │   ├── App.js
│   │   └── index.js
│   └── public/
├── .env.example
├── .gitignore
└── README.md
```

## SMS Webhook Integration

The system supports automatic transaction confirmation via SMS webhooks. Currently supports:

- KBank curl format detection
- Standard Thai SMS patterns
- Amount parsing with multiple patterns
- Transaction type detection (incoming/outgoing)

Example webhook payload:
```json
{
  "from": "KBANK",
  "message": "15/09/68 03:49 ?? X-0147 ???????? 100.47 ??????? 435.55 ?.",
  "timestamp": 1640995200000
}
```

## TrueWallet Error Handling

The system handles various TrueWallet error codes with user-friendly Thai messages:

- `VOUCHER_OUT_OF_STOCK` - Voucher is used up
- `INVALID_VOUCHER` - Invalid voucher code
- `VOUCHER_EXPIRED` - Voucher has expired
- `CANNOT_GET_OWN_VOUCHER` - Cannot redeem own voucher
- `TARGET_USER_REDEEMED` - Target user already redeemed

## Security Features

- Phone number locked to 0944283381 in environment variables
- Rate limiting (100 requests/minute per IP)
- Security headers (XSS protection, CSRF protection)
- Input validation and sanitization
- SMS injection protection
- Duplicate voucher prevention

## Database Schema

### Tables
- `transactions` - PromptPay transactions
- `voucher_transactions` - TrueWallet voucher redemptions
- `users` - User accounts and credit balances
- `outgoing_transactions` - SMS tracking for outgoing payments
- `failed_vouchers` - Failed voucher redemption attempts

## Testing

### Test Endpoints
```bash
# Test QR generation
curl -X POST http://localhost:3001/api/test-qr \
  -H "Content-Type: application/json" \
  -d '{"phone":"0944283381","amount":100}'

# Test SMS detection
curl -X POST http://localhost:3001/api/test-sms-detection \
  -H "Content-Type: application/json" \
  -d '{"message":"เงินเข้า 100.50 บาท"}'

# Test voucher validation
curl -X POST http://localhost:3001/api/truewallet/validate \
  -H "Content-Type: application/json" \
  -d '{"voucherCode":"xxxxhFog10Ijbmg1c"}'
```

## Deployment

### Production Environment Variables
```env
NODE_ENV=production
PORT=3001
DB_PATH=/app/data/transactions.db
PROMPTPAY_PHONE=0944283381
TRUEWALLET_PHONE=0944283381
```

### Build Frontend
```bash
cd frontend
npm run build
```

## Monitoring

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Statistics
- System statistics: `GET /api/stats`
- Payment method breakdown: `GET /api/payment/stats`
- TrueWallet specific: `GET /api/truewallet/stats`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create Pull Request

## Troubleshooting

### Common Issues

1. **TrueWallet voucher errors**
   - Check if `@fortune-inc/tw-voucher` is installed
   - Verify phone number in .env
   - Use test endpoints to validate codes

2. **SMS detection not working**
   - Check SMS format with test endpoints
   - Verify webhook URL configuration
   - Check console logs for pattern matching

3. **Database connection errors**
   - Ensure write permissions for database file
   - Check disk space
   - Verify DB_PATH in environment

### Debug Mode
```bash
NODE_ENV=development npm run dev
```

## License

MIT License - see LICENSE file for details

## Support

- Repository: https://github.com/neszaran194/promptpay-truewallet-system
- Issues: https://github.com/neszaran194/promptpay-truewallet-system/issues
- Phone: 0944283381 (PromptPay & TrueWallet)

## Acknowledgments

- [@fortune-inc/tw-voucher](https://github.com/Fortune-Inc/tw-voucher) for TrueWallet integration
- PromptPay QR standard by Bank of Thailand
- React and Node.js communities