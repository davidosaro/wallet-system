import { User } from '../models/User';
import { Wallet } from '../models/Wallet';
import { Account } from '../models/Account';
import { accountService } from '../services/accountService';
import { AccountType } from '../types/account';

let emailCounter = 0;
let accountCounter = 0;

/**
 * Create a test user
 */
export async function createTestUser(overrides?: {
  name?: string;
  email?: string;
}) {
  emailCounter++;
  const userData = {
    name: overrides?.name || `Test User ${emailCounter}`,
    email: overrides?.email || `test${emailCounter}@example.com`,
  };

  return User.create(userData);
}

/**
 * Create a test wallet with associated account
 */
export async function createTestWallet(
  userId: string,
  overrides?: { currency?: string; initialBalance?: number }
) {
  const currency = overrides?.currency || 'NGN';
  const initialBalance = overrides?.initialBalance || 0;

  // Create wallet
  const wallet = await Wallet.create({
    userId,
    currency,
    balance: initialBalance,
  });

  const walletId = wallet.get('id') as string;

  // Create associated account
  const account = await accountService.createWalletAccount(
    walletId,
    currency,
    `Test Wallet Account - ${walletId.slice(0, 8)}`
  );

  const accountNo = account.get('accountNo') as string;

  // Update wallet with account number
  await wallet.update({ accountNo });

  // Set initial balance if provided
  if (initialBalance > 0) {
    await account.update({
      balance: initialBalance,
      clearedBalance: initialBalance,
    });
  }

  return wallet.reload();
}

/**
 * Create a test pool account
 */
export async function createTestPoolAccount(overrides?: {
  accountName?: string;
  currency?: string;
  initialBalance?: number;
}) {
  accountCounter++;
  const accountName =
    overrides?.accountName || `Test Pool Account ${accountCounter}`;
  const currency = overrides?.currency || 'NGN';
  const initialBalance = overrides?.initialBalance || 1000000;

  const account = await Account.create({
    accountType: AccountType.POOL,
    accountName,
    accountNo: `ACC-POOL-TEST-${accountCounter.toString().padStart(6, '0')}`,
    currency,
    balance: initialBalance,
    clearedBalance: initialBalance,
  });

  return account;
}

/**
 * Create a test account
 */
export async function createTestAccount(
  accountType: AccountType,
  overrides?: {
    accountName?: string;
    currency?: string;
    walletId?: string;
    initialBalance?: number;
  }
) {
  accountCounter++;
  const accountName =
    overrides?.accountName || `Test Account ${accountCounter}`;
  const currency = overrides?.currency || 'NGN';
  const initialBalance = overrides?.initialBalance || 0;

  const account = await Account.create({
    accountType,
    accountName,
    accountNo: `ACC-TEST-${accountCounter.toString().padStart(6, '0')}`,
    currency,
    balance: initialBalance,
    clearedBalance: initialBalance,
    walletId: overrides?.walletId || null,
  });

  return account;
}

/**
 * Reset counters (useful for test isolation)
 */
export function resetCounters() {
  emailCounter = 0;
  accountCounter = 0;
}
