import { Router } from 'express';
import { walletController } from '../controllers/walletController';

const router = Router();

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: Get all wallets
 *     tags: [Wallets]
 *     responses:
 *       200:
 *         description: Wallets retrieved successfully
 */
router.get('/', walletController.getAll);

/**
 * @swagger
 * /api/wallets/{id}:
 *   get:
 *     summary: Get wallet by ID with account balance
 *     description: Returns the wallet with balance from the associated account (source of truth)
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 *       404:
 *         description: Wallet not found
 */
router.get('/:id', walletController.getById);

/**
 * @swagger
 * /api/wallets:
 *   post:
 *     summary: Create a new wallet
 *     description: Creates a wallet and its associated account
 *     tags: [Wallets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWallet'
 *     responses:
 *       201:
 *         description: Wallet created successfully
 */
router.post('/', walletController.create);

/**
 * @swagger
 * /api/wallets/{id}:
 *   delete:
 *     summary: Delete a wallet
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Wallet deleted successfully
 *       404:
 *         description: Wallet not found
 */
router.delete('/:id', walletController.delete);

export default router;
