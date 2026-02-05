import { Router } from 'express';
import { loanController } from '../controllers/loanController';

const router = Router();

/**
 * @swagger
 * /api/loans:
 *   post:
 *     summary: Create a new loan (book a loan)
 *     description: Creates a loan with status PENDING. The loan needs to be disbursed separately.
 *     tags: [Loans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNo
 *               - principalAmount
 *             properties:
 *               accountNo:
 *                 type: string
 *                 example: WALNGN0000001
 *               principalAmount:
 *                 type: number
 *                 example: 10000
 *               interestRate:
 *                 type: number
 *                 example: 0.275
 *                 description: Annual interest rate (defaults to 0.275 for 27.5%)
 *               maturityDate:
 *                 type: string
 *                 format: date
 *               currency:
 *                 type: string
 *                 example: NGN
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Loan created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/', loanController.createLoan);

/**
 * @swagger
 * /api/loans/{loanId}/disburse:
 *   post:
 *     summary: Disburse a loan
 *     description: Transfers loan amount from source account to borrower account and activates the loan
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceAccountNo
 *             properties:
 *               sourceAccountNo:
 *                 type: string
 *                 example: POLNGN0000001
 *                 description: Pool account that will fund the loan
 *               disbursementDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Loan disbursed successfully
 *       400:
 *         description: Invalid loan status or request
 *       404:
 *         description: Loan or account not found
 */
router.post('/:loanId/disburse', loanController.disburseLoan);

/**
 * @swagger
 * /api/loans/{loanId}:
 *   get:
 *     summary: Get loan by ID
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Loan retrieved successfully
 *       404:
 *         description: Loan not found
 */
router.get('/:loanId', loanController.getLoan);

/**
 * @swagger
 * /api/loans:
 *   get:
 *     summary: Get all loans
 *     tags: [Loans]
 *     responses:
 *       200:
 *         description: Loans retrieved successfully
 */
router.get('/', loanController.getAllLoans);

/**
 * @swagger
 * /api/loans/account/{accountNo}:
 *   get:
 *     summary: Get loans for an account
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: accountNo
 *         required: true
 *         schema:
 *           type: string
 *         example: WALNGN0000001
 *     responses:
 *       200:
 *         description: Account loans retrieved successfully
 */
router.get('/account/:accountNo', loanController.getLoansByAccount);

/**
 * @swagger
 * /api/loans/interest/accrue:
 *   post:
 *     summary: Accrue daily interest
 *     description: |
 *       Calculates and records daily interest at 27.5% per annum.
 *       Can accrue for a specific loan or all active loans.
 *       Handles leap years correctly (365/366 days).
 *     tags: [Loans]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loanId:
 *                 type: string
 *                 format: uuid
 *                 description: If provided, accrue for specific loan only
 *               accrualDate:
 *                 type: string
 *                 format: date
 *                 description: Date to accrue interest (defaults to today)
 *     responses:
 *       200:
 *         description: Interest accrued successfully
 *       400:
 *         description: Invalid request
 */
router.post('/interest/accrue', loanController.accrueInterest);

/**
 * @swagger
 * /api/loans/{loanId}/accruals:
 *   get:
 *     summary: Get interest accrual history for a loan
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of records to return
 *     responses:
 *       200:
 *         description: Accrual history retrieved successfully
 */
router.get('/:loanId/accruals', loanController.getLoanAccrualHistory);

export default router;
