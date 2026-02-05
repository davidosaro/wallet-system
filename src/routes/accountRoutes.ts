import { Router } from 'express';
import { accountController } from '../controllers/accountController';

const router = Router();

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: Accounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 */
router.get('/', accountController.getAll);

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Account retrieved successfully
 *       404:
 *         description: Account not found
 */
router.get('/:id', accountController.getById);

/**
 * @swagger
 * /api/accounts/number/{accountNo}:
 *   get:
 *     summary: Get account by account number
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: accountNo
 *         required: true
 *         schema:
 *           type: string
 *         example: WAL-NGN-001-0000001
 *     responses:
 *       200:
 *         description: Account retrieved successfully
 *       404:
 *         description: Account not found
 */
router.get('/number/:accountNo', accountController.getByAccountNo);

/**
 * @swagger
 * /api/accounts/type/{type}:
 *   get:
 *     summary: Get accounts by type
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [USER_WALLET, POOL, INTEREST_EXPENSE]
 *     responses:
 *       200:
 *         description: Accounts retrieved successfully
 *       400:
 *         description: Invalid account type
 */
router.get('/type/:type', accountController.getByType);

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAccount'
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', accountController.create);

/**
 * @swagger
 * /api/accounts/pool:
 *   post:
 *     summary: Create a pool account
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePoolAccount'
 *     responses:
 *       201:
 *         description: Pool account created successfully
 *       400:
 *         description: Account name is required
 */
router.post('/pool', accountController.createPoolAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Delete an account
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Account deleted successfully
 *       404:
 *         description: Account not found
 */
router.delete('/:id', accountController.delete);

export default router;
