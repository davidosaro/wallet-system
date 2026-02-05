import { Router } from 'express';
import { fundingController } from '../controllers/fundingController';

const router = Router();

/**
 * @swagger
 * /api/funding:
 *   post:
 *     summary: Fund an account from a source account
 *     description: |
 *       Funds a destination account from a source account (typically a pool account).
 *       Creates proper double-entry bookkeeping with DEBIT on source and CREDIT on destination.
 *       Supports idempotency via the Idempotency-Key header.
 *     tags: [Funding]
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         schema:
 *           type: string
 *         description: Unique key to ensure idempotent funding (optional but recommended)
 *         example: "fund-12345-abc"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FundAccountRequest'
 *     responses:
 *       201:
 *         description: Account funded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FundingResponse'
 *       400:
 *         description: Invalid request (invalid amount, currency mismatch)
 *       404:
 *         description: Account not found
 *       409:
 *         description: Previous funding with same idempotency key failed
 */
router.post('/', fundingController.fundAccount);

/**
 * @swagger
 * /api/funding/wallet/{walletId}:
 *   post:
 *     summary: Fund a wallet from a source account
 *     description: |
 *       Funds a wallet's associated account from a source account.
 *       This is a convenience endpoint that looks up the wallet's account number
 *       and performs the funding operation.
 *     tags: [Funding]
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         schema:
 *           type: string
 *         description: Unique key to ensure idempotent funding (optional but recommended)
 *       - in: path
 *         name: walletId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The wallet ID to fund
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FundWalletRequest'
 *     responses:
 *       201:
 *         description: Wallet funded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FundingResponse'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Wallet or source account not found
 */
router.post('/wallet/:walletId', fundingController.fundWallet);

export default router;
