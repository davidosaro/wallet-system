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
 *     summary: Get wallet by ID
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
 * /api/wallets/{id}/deposit:
 *   post:
 *     summary: Deposit to wallet
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Amount'
 *     responses:
 *       200:
 *         description: Deposit successful
 *       404:
 *         description: Wallet not found
 */
router.post('/:id/deposit', walletController.deposit);

/**
 * @swagger
 * /api/wallets/{id}/withdraw:
 *   post:
 *     summary: Withdraw from wallet
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Amount'
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Insufficient balance
 *       404:
 *         description: Wallet not found
 */
router.post('/:id/withdraw', walletController.withdraw);

/**
 * @swagger
 * /api/wallets/{id}/transfer:
 *   post:
 *     summary: Transfer between wallets
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transfer'
 *     responses:
 *       200:
 *         description: Transfer successful
 *       400:
 *         description: Insufficient balance
 *       404:
 *         description: Wallet not found
 */
router.post('/:id/transfer', walletController.transfer);

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
