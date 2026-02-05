import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wallet System API',
      version: '1.0.0',
      description: 'A simple wallet management API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateUser: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
          },
        },
        Wallet: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            balance: { type: 'number', example: 100.0 },
            currency: { type: 'string', example: 'NGN' },
            accountNo: { type: 'string', example: 'WALNGN0000001' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateWallet: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
            currency: { type: 'string', default: 'NGN' },
          },
        },
        Amount: {
          type: 'object',
          required: ['amount'],
          properties: {
            amount: { type: 'number', example: 50.0 },
          },
        },
        Transfer: {
          type: 'object',
          required: ['toWalletId', 'amount'],
          properties: {
            toWalletId: { type: 'string', format: 'uuid' },
            amount: { type: 'number', example: 25.0 },
          },
        },
        Response: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        Account: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            accountType: {
              type: 'string',
              enum: ['USER_WALLET', 'POOL', 'INTEREST_EXPENSE'],
            },
            accountName: { type: 'string', example: 'Main Pool Account' },
            accountNo: { type: 'string', example: 'WAL-NGN-001-0000001' },
            balance: { type: 'number', example: 0 },
            clearedBalance: { type: 'number', example: 0 },
            currency: { type: 'string', example: 'NGN' },
            walletId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateAccount: {
          type: 'object',
          required: ['accountType', 'accountName'],
          properties: {
            accountType: {
              type: 'string',
              enum: ['USER_WALLET', 'POOL', 'INTEREST_EXPENSE'],
              example: 'POOL',
            },
            accountName: { type: 'string', example: 'Main Pool Account' },
            currency: { type: 'string', default: 'NGN' },
          },
        },
        CreatePoolAccount: {
          type: 'object',
          required: ['accountName'],
          properties: {
            accountName: { type: 'string', example: 'Main Pool Account' },
            currency: { type: 'string', default: 'NGN' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            idempotencyKey: { type: 'string', nullable: true },
            transactionType: {
              type: 'string',
              enum: ['TRANSFER', 'FUNDING', 'INTEREST'],
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'COMPLETED', 'FAILED'],
            },
            reference: { type: 'string', example: 'TRF-ABC123-XYZ789' },
            metadata: { type: 'object', nullable: true },
            errorMessage: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        LedgerEntry: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            transactionId: { type: 'string', format: 'uuid' },
            accountNo: { type: 'string', example: 'WALNGN0000001' },
            entryType: { type: 'string', enum: ['DEBIT', 'CREDIT'] },
            amount: { type: 'number', example: 100.0 },
            balanceBefore: { type: 'number', example: 500.0 },
            balanceAfter: { type: 'number', example: 400.0 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TransferRequest: {
          type: 'object',
          required: ['debitAccountNo', 'creditAccountNo', 'amount'],
          properties: {
            debitAccountNo: { type: 'string', example: 'WALNGN0000001' },
            creditAccountNo: { type: 'string', example: 'POLNGN0000001' },
            amount: { type: 'number', example: 100.0 },
            reference: { type: 'string', example: 'Payment for services' },
            metadata: { type: 'object', example: { orderId: '12345' } },
          },
        },
        TransferResponse: {
          type: 'object',
          properties: {
            transactionId: { type: 'string', format: 'uuid' },
            reference: { type: 'string' },
            status: { type: 'string', enum: ['COMPLETED', 'FAILED'] },
            debitAccount: {
              type: 'object',
              properties: {
                accountNo: { type: 'string' },
                balanceBefore: { type: 'number' },
                balanceAfter: { type: 'number' },
              },
            },
            creditAccount: {
              type: 'object',
              properties: {
                accountNo: { type: 'string' },
                balanceBefore: { type: 'number' },
                balanceAfter: { type: 'number' },
              },
            },
            amount: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        FundAccountRequest: {
          type: 'object',
          required: ['accountNo', 'sourceAccountNo', 'amount'],
          properties: {
            accountNo: {
              type: 'string',
              example: 'WALNGN0000001',
              description: 'Destination account number to fund',
            },
            sourceAccountNo: {
              type: 'string',
              example: 'POLNGN0000001',
              description: 'Source account (typically a pool account)',
            },
            amount: { type: 'number', example: 100.0 },
            reference: { type: 'string', example: 'Deposit from bank transfer' },
            metadata: { type: 'object', example: { bankRef: 'BNK123' } },
          },
        },
        FundWalletRequest: {
          type: 'object',
          required: ['sourceAccountNo', 'amount'],
          properties: {
            sourceAccountNo: {
              type: 'string',
              example: 'POLNGN0000001',
              description: 'Source account (typically a pool account)',
            },
            amount: { type: 'number', example: 100.0 },
            reference: { type: 'string', example: 'Deposit from bank transfer' },
            metadata: { type: 'object', example: { bankRef: 'BNK123' } },
          },
        },
        FundingResponse: {
          type: 'object',
          properties: {
            transactionId: { type: 'string', format: 'uuid' },
            reference: { type: 'string' },
            status: { type: 'string', enum: ['COMPLETED', 'FAILED'] },
            sourceAccount: {
              type: 'object',
              properties: {
                accountNo: { type: 'string' },
                balanceBefore: { type: 'number' },
                balanceAfter: { type: 'number' },
              },
            },
            destinationAccount: {
              type: 'object',
              properties: {
                accountNo: { type: 'string' },
                balanceBefore: { type: 'number' },
                balanceAfter: { type: 'number' },
              },
            },
            amount: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
