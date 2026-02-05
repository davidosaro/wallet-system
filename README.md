# Loan Disbursement System API

A comprehensive wallet and loan management system built with Node.js, TypeScript, Express, and PostgreSQL. Features include user wallets, transfers, loan management with automatic interest accrual, and double-entry bookkeeping.

## 🚀 Features

- **User & Wallet Management**: Multi-currency wallet support
- **Transfers**: Secure peer-to-peer transfers with idempotency
- **Funding**: Pool-based wallet funding system
- **Loan System**: Loan creation, disbursement, and management
- **Interest Accrual**: Automatic daily interest calculation (27.5% APR)
  - Precise math using Decimal.js
  - Leap year support (365/366 days)
  - Background job for daily accrual
- **Double-Entry Bookkeeping**: Complete audit trail with ledger entries
- **Error Handling**: Comprehensive validation and error responses
- **API Documentation**: Swagger/OpenAPI documentation

## 📋 Prerequisites

- Node.js (v18+)
- PostgreSQL (v13+)
- npm or yarn

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd wallet-system
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wallet_db
DB_USER=postgres
DB_PASSWORD=your_password

# Logging
LOG_LEVEL=info
```

### 3. Database Setup

```bash
# Create database
createdb wallet_db

# Run migrations
npm run migrate
```

### 4. Start the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:3000`

### 5. View API Documentation

Open your browser and navigate to:

```
http://localhost:3000/api-docs
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

Current coverage: **85%+** on critical business logic

- Services: 85-97% coverage
- Controllers: 83-89% coverage
- Middleware: 84% coverage

See [TESTING.md](TESTING.md) for detailed testing documentation.

## 📝 API Endpoints

### Users

```http
POST   /api/users              # Create a new user
GET    /api/users              # Get all users
GET    /api/users/:id          # Get user by ID
PUT    /api/users/:id          # Update user
DELETE /api/users/:id          # Delete user
```

### Wallets

```http
POST   /api/wallets            # Create a new wallet
GET    /api/wallets            # Get all wallets
GET    /api/wallets/:id        # Get wallet by ID
DELETE /api/wallets/:id        # Delete wallet
```

### Accounts

```http
POST   /api/accounts           # Create an account
POST   /api/accounts/pool      # Create a pool account
GET    /api/accounts           # Get all accounts
GET    /api/accounts/:accountNo # Get account by number
```

### Transfers

```http
POST   /api/transfers          # Transfer between accounts
GET    /api/transfers          # Get all transfers
GET    /api/transfers/:id      # Get transfer by ID
```

### Funding

```http
POST   /api/funding/accounts   # Fund an account from pool
POST   /api/funding/wallets/:walletId # Fund a wallet from pool
```

### Loans

```http
POST   /api/loans              # Create a new loan
POST   /api/loans/:loanId/disburse # Disburse a loan
GET    /api/loans              # Get all loans
GET    /api/loans/:loanId      # Get loan by ID
GET    /api/loans/:loanId/accruals # Get loan accruals
POST   /api/loans/interest/accrue # Manually trigger interest accrual
```

## 🧪 Step-by-Step Testing Guide

### Prerequisites for Testing

You'll need a tool like [Postman](https://www.postman.com/), [Insomnia](https://insomnia.rest/), or `curl`.

### Test Scenario: Complete Loan Flow

#### Step 1: Create Two Users

```bash
# User 1 (Alice)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com"
  }'
```

**Save the user ID from the response** as `USER_1_ID`

```bash
# User 2 (Bob)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Smith",
    "email": "bob@example.com"
  }'
```

**Save the user ID from the response** as `USER_2_ID`

#### Step 2: Create Two Wallets (NGN for both users)

```bash
# Alice's Wallet
curl -X POST http://localhost:3000/api/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_1_ID",
    "currency": "NGN"
  }'
```

**Save the wallet ID and account number** as `ALICE_WALLET_ID` and `ALICE_ACCOUNT_NO`

```bash
# Bob's Wallet
curl -X POST http://localhost:3000/api/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_2_ID",
    "currency": "NGN"
  }'
```

**Save the wallet ID and account number** as `BOB_WALLET_ID` and `BOB_ACCOUNT_NO`

#### Step 3: Create Pool Account

```bash
curl -X POST http://localhost:3000/api/accounts/pool \
  -H "Content-Type: application/json" \
  -d '{
    "accountName": "Main Pool Account",
    "currency": "NGN",
    "initialBalance": 10000000
  }'
```

**Save the account number** as `POOL_ACCOUNT_NO`

#### Step 4: Fund Alice's Wallet from Pool

```bash
curl -X POST http://localhost:3000/api/funding/accounts \
  -H "Content-Type: application/json" \
  -H "idempotency-key: fund-alice-001" \
  -d '{
    "accountNo": "ALICE_ACCOUNT_NO",
    "sourceAccountNo": "POOL_ACCOUNT_NO",
    "amount": 500000,
    "reference": "Initial funding for Alice"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Account funded successfully",
  "data": {
    "transactionId": "...",
    "status": "COMPLETED",
    "amount": 500000,
    "destinationAccount": {
      "accountNo": "ALICE_ACCOUNT_NO",
      "balanceBefore": 0,
      "balanceAfter": 500000
    }
  }
}
```

#### Step 5: Transfer from Alice to Bob

```bash
curl -X POST http://localhost:3000/api/transfers \
  -H "Content-Type: application/json" \
  -H "idempotency-key: transfer-001" \
  -d '{
    "debitAccountNo": "ALICE_ACCOUNT_NO",
    "creditAccountNo": "BOB_ACCOUNT_NO",
    "amount": 100000,
    "metadata": {
      "purpose": "Payment for services"
    }
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Transfer completed successfully",
  "data": {
    "transactionId": "...",
    "status": "COMPLETED",
    "amount": 100000,
    "debitAccount": {
      "balanceBefore": 500000,
      "balanceAfter": 400000
    },
    "creditAccount": {
      "balanceBefore": 0,
      "balanceAfter": 100000
    }
  }
}
```

#### Step 6: Create a Loan for Bob

```bash
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -d '{
    "accountNo": "BOB_ACCOUNT_NO",
    "principalAmount": 200000,
    "maturityDate": "2026-12-31"
  }'
```

**Save the loan ID** as `LOAN_ID`

**Expected Response:**

```json
{
  "success": true,
  "message": "Loan created successfully",
  "data": {
    "id": "LOAN_ID",
    "loanNumber": "LOAN-...",
    "accountNo": "BOB_ACCOUNT_NO",
    "principalAmount": 200000,
    "interestRate": 0.275,
    "status": "PENDING",
    "accruedInterest": 0
  }
}
```

#### Step 7: Disburse the Loan

```bash
curl -X POST http://localhost:3000/api/loans/LOAN_ID/disburse \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountNo": "POOL_ACCOUNT_NO"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Loan disbursed successfully",
  "data": {
    "id": "LOAN_ID",
    "loanNumber": "LOAN-...",
    "status": "ACTIVE",
    "disbursementDate": "2026-02-05T10:00:00.000Z",
    "principalAmount": 200000,
    "outstandingPrincipal": 200000,
    "accruedInterest": 0
  }
}
```

**Check Bob's Balance:**

```bash
curl http://localhost:3000/api/wallets/BOB_WALLET_ID
```

Bob's balance should now be: 100,000 (transfer) + 200,000 (loan) = **300,000 NGN**

#### Step 8: Trigger Interest Accrual (Manual)

```bash
curl -X POST http://localhost:3000/api/loans/interest/accrue \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Interest accrued successfully",
  "data": {
    "processed": 1,
    "errors": []
  }
}
```

#### Step 9: Get Loan Accruals by Loan ID

```bash
curl http://localhost:3000/api/loans/LOAN_ID/accruals
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Loan accruals retrieved successfully",
  "data": [
    {
      "id": "...",
      "loanId": "LOAN_ID",
      "accrualDate": "2026-02-05",
      "principalBalance": 200000,
      "dailyRate": 0.00075136612,
      "interestAmount": 150.27,
      "daysInYear": 366,
      "cumulativeInterest": 150.27
    }
  ]
}
```

#### Step 10: Check Final Loan Status

```bash
curl http://localhost:3000/api/loans/LOAN_ID
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Loan retrieved successfully",
  "data": {
    "id": "LOAN_ID",
    "loanNumber": "LOAN-...",
    "accountNo": "BOB_ACCOUNT_NO",
    "principalAmount": 200000,
    "outstandingPrincipal": 200000,
    "interestRate": 0.275,
    "accruedInterest": 150.27,
    "status": "ACTIVE",
    "disbursementDate": "2026-02-05T10:00:00.000Z",
    "lastAccrualDate": "2026-02-05T00:00:00.000Z"
  }
}
```

## 🔄 Background Jobs

### Interest Accrual Job

The system automatically runs a daily interest accrual job at **midnight (00:00)** every day.

**Configuration**: `src/jobs/interestAccrualJob.ts`

**Cron Schedule**: `0 0 * * *` (daily at midnight)

**What it does:**

- Processes all active loans
- Calculates daily interest based on 27.5% annual rate
- Adjusts for leap years (365/366 days)
- Creates daily interest accrual records
- Updates loan's accrued interest

To modify the schedule, edit `src/jobs/interestAccrualJob.ts`:

```typescript
const schedule = '0 0 * * *'; // Change this cron expression
```

## 📊 Interest Calculation

### Formula

```
Daily Interest = Principal × (Annual Rate / Days in Year)

Where:
- Annual Rate = 0.275 (27.5%)
- Days in Year = 365 (regular year) or 366 (leap year)
- Principal = Outstanding loan principal
```

### Example

For a ₦200,000 loan at 27.5% in a leap year (2024):

```
Daily Interest = 200,000 × (0.275 / 366)
               = 200,000 × 0.000751366
               = ₦150.27 per day
```

After 30 days:

```
Total Interest = 150.27 × 30 = ₦4,508.10
```

## 🏗️ Project Structure

```
wallet-system/
├── src/
│   ├── __tests__/           # Test files
│   ├── config/              # Configuration (database, swagger)
│   ├── controllers/         # Request handlers
│   ├── jobs/                # Background jobs
│   ├── middleware/          # Express middleware
│   ├── migrations/          # Database migrations
│   ├── models/              # Sequelize models
│   ├── repositories/        # Data access layer
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── app.ts               # Application entry point
├── .env                     # Environment variables
├── jest.config.js           # Jest configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## 🔒 Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ],
  "data": null
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## 🛡️ Features in Detail

### Idempotency

Transfers and funding operations support idempotency to prevent duplicate transactions:

```bash
curl -X POST http://localhost:3000/api/transfers \
  -H "idempotency-key: unique-key-123" \
  -d '{ ... }'
```

Multiple requests with the same key will return the same response without creating duplicate transactions.

### Double-Entry Bookkeeping

Every transaction creates corresponding ledger entries:

- **Debit Entry**: Money out of source account
- **Credit Entry**: Money into destination account

### Pessimistic Locking

Concurrent transactions are handled safely using database-level row locking to prevent race conditions.

### Math Precision

All financial calculations use `Decimal.js` to ensure precise arithmetic without floating-point errors.

## 📚 Additional Documentation

- [TESTING.md](TESTING.md) - Comprehensive testing guide
- [TEST_SUMMARY.md](TEST_SUMMARY.md) - Test coverage breakdown
- [Swagger UI](http://localhost:3000/api-docs) - Interactive API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Verify database exists
psql -l | grep wallet_db

# Test connection
psql -U postgres -d wallet_db -c "SELECT 1"
```

### Migration Errors

```bash
# Reset migrations (WARNING: This drops all data)
npm run migrate:down
npm run migrate
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

## 📞 Support

For issues and questions:

- Create an issue in the repository
- Contact: [your-email@example.com]

---

**Built with ❤️ using Node.js, TypeScript, Express, and PostgreSQL**
