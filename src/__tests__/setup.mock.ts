/**
 * Mock setup for tests - no real database connection needed
 * This uses an in-memory approach for faster tests
 */

// Store data in memory
const memoryStore: {
  [key: string]: any[];
} = {};

// Mock Sequelize models
const createMockModel = (modelName: string) => {
  if (!memoryStore[modelName]) {
    memoryStore[modelName] = [];
  }

  return {
    findAll: jest.fn(async (options?: any) => {
      let results = [...memoryStore[modelName]];

      if (options?.where) {
        results = results.filter((item) => {
          return Object.entries(options.where).every(
            ([key, value]) => item[key] === value
          );
        });
      }

      return results.map((data) => createModelInstance(data));
    }),

    findOne: jest.fn(async (options?: any) => {
      let results = [...memoryStore[modelName]];

      if (options?.where) {
        results = results.filter((item) => {
          return Object.entries(options.where).every(
            ([key, value]) => item[key] === value
          );
        });
      }

      const result = results[0];
      return result ? createModelInstance(result) : null;
    }),

    findByPk: jest.fn(async (id: string) => {
      const result = memoryStore[modelName].find((item) => item.id === id);
      return result ? createModelInstance(result) : null;
    }),

    create: jest.fn(async (data: any) => {
      const id = data.id || `${modelName.toLowerCase()}-${Date.now()}-${Math.random()}`;
      const newItem = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
      memoryStore[modelName].push(newItem);
      return createModelInstance(newItem);
    }),

    update: jest.fn(async (data: any, options: any) => {
      const updated: any[] = [];
      memoryStore[modelName] = memoryStore[modelName].map((item) => {
        const matches = Object.entries(options.where).every(
          ([key, value]) => item[key] === value
        );
        if (matches) {
          const updatedItem = { ...item, ...data, updatedAt: new Date() };
          updated.push(updatedItem);
          return updatedItem;
        }
        return item;
      });
      return [updated.length];
    }),

    destroy: jest.fn(async (options: any) => {
      const initialLength = memoryStore[modelName].length;
      memoryStore[modelName] = memoryStore[modelName].filter((item) => {
        return !Object.entries(options.where).every(
          ([key, value]) => item[key] === value
        );
      });
      return initialLength - memoryStore[modelName].length;
    }),

    bulkCreate: jest.fn(async (items: any[]) => {
      const created = items.map((data) => {
        const id = data.id || `${modelName.toLowerCase()}-${Date.now()}-${Math.random()}`;
        const newItem = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        memoryStore[modelName].push(newItem);
        return newItem;
      });
      return created.map((data) => createModelInstance(data));
    }),
  };
};

// Create a model instance with get/update/reload methods
const createModelInstance = (data: any): any => {
  const instance: any = {
    ...data,
    get: jest.fn((key?: string) => {
      if (key) return data[key];
      return data;
    }),
    update: jest.fn(async (newData: any): Promise<any> => {
      Object.assign(data, newData);
      return instance;
    }),
    reload: jest.fn(async (): Promise<any> => {
      return instance;
    }),
    toJSON: jest.fn(() => data),
  };
  return instance;
};

// Clear all data before each test
beforeEach(() => {
  Object.keys(memoryStore).forEach((key) => {
    memoryStore[key] = [];
  });
});

// Mock sequelize
jest.mock('../config/database', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(undefined),
    sync: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    transaction: jest.fn(async (callback) => {
      const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
        LOCK: {
          UPDATE: 'UPDATE',
          SHARE: 'SHARE',
          KEY_SHARE: 'KEY_SHARE',
          NO_KEY_UPDATE: 'NO_KEY_UPDATE',
        },
      };
      const result = await callback(mockTransaction);
      return result;
    }),
    models: {},
  },
}));

// Mock models
jest.mock('../models/User', () => ({
  User: createMockModel('User'),
}));

jest.mock('../models/Wallet', () => ({
  Wallet: createMockModel('Wallet'),
}));

jest.mock('../models/Account', () => ({
  Account: createMockModel('Account'),
}));

jest.mock('../models/Transaction', () => ({
  Transaction: createMockModel('Transaction'),
}));

jest.mock('../models/LedgerEntry', () => ({
  LedgerEntry: createMockModel('LedgerEntry'),
}));

jest.mock('../models/Loan', () => ({
  Loan: createMockModel('Loan'),
}));

jest.mock('../models/DailyInterestAccrual', () => ({
  DailyInterestAccrual: createMockModel('DailyInterestAccrual'),
}));

export { memoryStore };
