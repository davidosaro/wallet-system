import Decimal from 'decimal.js';
import { sequelize } from '../config/database';
import { loanRepository } from '../repositories/loanRepository';
import { dailyInterestAccrualRepository } from '../repositories/dailyInterestAccrualRepository';
import { LoanStatus } from '../types/loan';
import { AccrueInterestDto, InterestCalculation } from '../types/interestAccrual';

// Configure Decimal.js for high precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class InterestAccrualError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'InterestAccrualError';
  }
}

/**
 * Check if a year is a leap year
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get number of days in a year (365 or 366 for leap years)
 */
function getDaysInYear(date: Date): number {
  return isLeapYear(date.getFullYear()) ? 366 : 365;
}

/**
 * Calculate daily interest with precision
 */
function calculateDailyInterest(
  principalBalance: number,
  annualRate: number,
  daysInYear: number
): InterestCalculation {
  // Use Decimal.js for precise calculations
  const principal = new Decimal(principalBalance);
  const rate = new Decimal(annualRate);
  const days = new Decimal(daysInYear);

  // Daily rate = Annual rate / Days in year
  const dailyRate = rate.dividedBy(days);

  // Interest = Principal * Daily rate
  const interest = principal.times(dailyRate);

  return {
    principalBalance,
    annualRate,
    dailyRate: parseFloat(dailyRate.toFixed(12)),
    daysInYear,
    interestAmount: parseFloat(interest.toFixed(4)),
  };
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get all dates between start and end (inclusive)
 */
function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export const interestAccrualService = {
  /**
   * Calculate daily interest for a given principal and rate
   */
  calculateDailyInterest(
    principal: number,
    annualRate: number,
    date: Date
  ): InterestCalculation {
    const daysInYear = getDaysInYear(date);
    return calculateDailyInterest(principal, annualRate, daysInYear);
  },

  /**
   * Accrue interest for a specific loan on a specific date
   */
  async accrueLoanInterest(loanId: string, accrualDate: Date): Promise<void> {
    await sequelize.transaction(async (t) => {
      const loan = await loanRepository.findByIdWithLock(loanId, t);
      if (!loan) {
        throw new InterestAccrualError('Loan not found', 'LOAN_NOT_FOUND');
      }

      const status = loan.get('status') as LoanStatus;
      if (status !== LoanStatus.ACTIVE) {
        throw new InterestAccrualError(
          `Interest can only be accrued for active loans. Current status: ${status}`,
          'INVALID_LOAN_STATUS'
        );
      }

      const disbursementDate = loan.get('disbursementDate') as Date;
      if (!disbursementDate) {
        throw new InterestAccrualError('Loan has not been disbursed', 'LOAN_NOT_DISBURSED');
      }

      // Check if accrual date is after disbursement
      if (accrualDate < disbursementDate) {
        throw new InterestAccrualError(
          'Cannot accrue interest before disbursement date',
          'INVALID_ACCRUAL_DATE'
        );
      }

      const accrualDateStr = formatDate(accrualDate);

      // Check if interest already accrued for this date
      const existing = await dailyInterestAccrualRepository.findByLoanIdAndDate(
        loanId,
        accrualDateStr
      );
      if (existing) {
        console.log(`Interest already accrued for loan ${loanId} on ${accrualDateStr}`);
        return;
      }

      const principalBalance = parseFloat(loan.get('outstandingPrincipal') as string);
      const annualRate = parseFloat(loan.get('interestRate') as string);
      const currentAccruedInterest = parseFloat(loan.get('accruedInterest') as string);

      // Calculate daily interest
      const calculation = this.calculateDailyInterest(
        principalBalance,
        annualRate,
        accrualDate
      );

      // Calculate cumulative interest
      const cumulativeInterest = new Decimal(currentAccruedInterest)
        .plus(calculation.interestAmount)
        .toNumber();

      // Create daily accrual record
      await dailyInterestAccrualRepository.create(
        {
          loanId,
          accrualDate: accrualDateStr,
          principalBalance,
          dailyRate: calculation.dailyRate,
          interestAmount: calculation.interestAmount,
          daysInYear: calculation.daysInYear,
          cumulativeInterest,
        },
        t
      );

      // Update loan's accrued interest and last accrual date
      await loanRepository.updateAccruedInterest(
        loanId,
        cumulativeInterest,
        accrualDate,
        t
      );
    });
  },

  /**
   * Accrue interest for all active loans up to a specific date
   */
  async accrueInterestForAllLoans(accrualDate: Date): Promise<{
    processed: number;
    errors: Array<{ loanId: string; error: string }>;
  }> {
    const activeLoans = await loanRepository.findActiveLoans();
    const errors: Array<{ loanId: string; error: string }> = [];
    let processed = 0;

    for (const loan of activeLoans) {
      const loanId = loan.get('id') as string;
      const disbursementDate = loan.get('disbursementDate') as Date;
      const lastAccrualDate = loan.get('lastAccrualDate') as Date | null;

      if (!disbursementDate) {
        errors.push({ loanId, error: 'No disbursement date' });
        continue;
      }

      // Determine start date for accrual
      let startDate: Date;
      if (lastAccrualDate) {
        // Start from the day after last accrual
        startDate = new Date(lastAccrualDate);
        startDate.setDate(startDate.getDate() + 1);
      } else {
        // Start from disbursement date
        startDate = disbursementDate;
      }

      // Don't accrue if start date is after accrual date
      if (startDate > accrualDate) {
        continue;
      }

      // Get all dates that need accrual
      const datesToAccrue = getDateRange(startDate, accrualDate);

      try {
        for (const date of datesToAccrue) {
          await this.accrueLoanInterest(loanId, date);
        }
        processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ loanId, error: errorMessage });
      }
    }

    return { processed, errors };
  },

  /**
   * Accrue interest for a specific loan (convenience method)
   */
  async accrueInterest(data: AccrueInterestDto): Promise<any> {
    const accrualDate = data.accrualDate || new Date();

    if (data.loanId) {
      await this.accrueLoanInterest(data.loanId, accrualDate);
      return { loanId: data.loanId, accrualDate: formatDate(accrualDate) };
    } else {
      return this.accrueInterestForAllLoans(accrualDate);
    }
  },

  /**
   * Get interest accrual history for a loan
   */
  async getLoanAccrualHistory(loanId: string, limit?: number) {
    return dailyInterestAccrualRepository.findByLoanId(loanId, limit);
  },

  /**
   * Get total accrued interest for a loan
   */
  async getLoanTotalAccruedInterest(loanId: string): Promise<number> {
    const loan = await loanRepository.findById(loanId);
    if (!loan) {
      throw new InterestAccrualError('Loan not found', 'LOAN_NOT_FOUND');
    }
    return parseFloat(loan.get('accruedInterest') as string);
  },
};
