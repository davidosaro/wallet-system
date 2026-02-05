import crypto from 'crypto';

let emailCounter = 0;
let accountCounter = 0;

/**
 * Create a test user (mocked)
 */
export async function createTestUser(overrides?: {
  name?: string;
  email?: string;
}) {
  const { User } = require('../models/User');
  emailCounter++;

  const userData = {
    id: crypto.randomUUID(),
    name: overrides?.name || `Test User ${emailCounter}`,
    email: overrides?.email || `test${emailCounter}@example.com`,
    createdAt: new Date(),
  };

  return User.create(userData);
}

/**
 * Create a test wallet with associated account (mocked)
 */
export async function createTestWallet(
  userId: string,
  overrides?: { currency?: string; initialBalance?: number }
) {
  const { Wallet } = require('../models/Wallet');
  const { Account } = require('../models/Account');

  const currency = overrides?.currency || 'NGN';
  const initialBalance = overrides?.initialBalance || 0;

  const walletId = crypto.randomUUID();
  accountCounter++;
  const accountNo = `ACC-TEST-${accountCounter.toString().padStart(6, '0')}`;

  // Create account first
  await Account.create({
    id: crypto.randomUUID(),
    accountType: 'USER_WALLET',
    accountName: `Test Wallet Account`,
    accountNo,
    currency,
    balance: initialBalance,
    clearedBalance: initialBalance,
    walletId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create wallet
  const wallet = await Wallet.create({
    id: walletId,
    userId,
    currency,
    balance: initialBalance,
    accountNo,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return wallet;
}

/**
 * Create a test pool account (mocked)
 */
export async function createTestPoolAccount(overrides?: {
  accountName?: string;
  currency?: string;
  initialBalance?: number;
}) {
  const { Account } = require('../models/Account');

  accountCounter++;
  const accountName =
    overrides?.accountName || `Test Pool Account ${accountCounter}`;
  const currency = overrides?.currency || 'NGN';
  const initialBalance = overrides?.initialBalance || 1000000;

  return Account.create({
    id: crypto.randomUUID(),
    accountType: 'POOL',
    accountName,
    accountNo: `ACC-POOL-TEST-${accountCounter.toString().padStart(6, '0')}`,
    currency,
    balance: initialBalance,
    clearedBalance: initialBalance,
    walletId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Create a test account (mocked)
 */
export async function createTestAccount(
  accountType: string,
  overrides?: {
    accountName?: string;
    currency?: string;
    walletId?: string;
    initialBalance?: number;
  }
) {
  const { Account } = require('../models/Account');

  accountCounter++;
  const accountName =
    overrides?.accountName || `Test Account ${accountCounter}`;
  const currency = overrides?.currency || 'NGN';
  const initialBalance = overrides?.initialBalance || 0;

  return Account.create({
    id: crypto.randomUUID(),
    accountType,
    accountName,
    accountNo: `ACC-TEST-${accountCounter.toString().padStart(6, '0')}`,
    currency,
    balance: initialBalance,
    clearedBalance: initialBalance,
    walletId: overrides?.walletId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Reset counters
 */
export function resetCounters() {
  emailCounter = 0;
  accountCounter = 0;
}
