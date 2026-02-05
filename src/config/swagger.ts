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
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
