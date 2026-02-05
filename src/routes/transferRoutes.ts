import { Router } from 'express';
import { transferController } from '../controllers/transferController';

const router = Router();

/**
 * @swagger
 * /api/transfers:
 *   post:
 *     summary: Transfer funds between accounts
 *     description: |
 *       Transfers money from one account to another.
 *       Supports idempotency via the Idempotency-Key header.
 *       Uses pessimistic locking to prevent race conditions.
 *     tags: [Transfers]
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         schema:
 *           type: string
 *         description: Unique key to ensure idempotent transfers (optional but recommended)
 *         example: "txn-12345-abc"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferRequest'
 *     responses:
 *       201:
 *         description: Transfer completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferResponse'
 *       400:
 *         description: Invalid request (insufficient balance, invalid amount, currency mismatch)
 *       404:
 *         description: Account not found
 *       409:
 *         description: Previous transfer with same idempotency key failed
 */
router.post('/', transferController.transfer);

/**
 * @swagger
 * /api/transfers/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transfers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       404:
 *         description: Transaction not found
 */
router.get('/:id', transferController.getTransaction);

/**
 * @swagger
 * /api/transfers/{id}/details:
 *   get:
 *     summary: Get detailed transfer information
 *     tags: [Transfers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferResponse'
 *       404:
 *         description: Transaction not found
 */
router.get('/:id/details', transferController.getTransactionDetails);

/**
 * @swagger
 * /api/transfers/{id}/ledger:
 *   get:
 *     summary: Get ledger entries for a transaction
 *     tags: [Transfers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ledger entries retrieved successfully
 */
router.get('/:id/ledger', transferController.getLedgerEntries);

/**
 * @swagger
 * /api/transfers/account/{accountNo}/ledger:
 *   get:
 *     summary: Get ledger history for an account
 *     tags: [Transfers]
 *     parameters:
 *       - in: path
 *         name: accountNo
 *         required: true
 *         schema:
 *           type: string
 *         example: WALNGN0000001
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of entries to return
 *     responses:
 *       200:
 *         description: Account ledger retrieved successfully
 */
router.get('/account/:accountNo/ledger', transferController.getAccountLedger);

export default router;
