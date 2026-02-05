import cron from 'node-cron';
import { interestAccrualService } from '../services/interestAccrualService';
import { logger } from '../utils/logger';

/**
 * Daily Interest Accrual Job
 * Runs daily at midnight (00:00) to accrue interest for all active loans
 */
export function startInterestAccrualJob() {
  // Schedule: Every day at midnight (00:00)
  // Cron format: second minute hour day month weekday
  // '0 0 * * *' = At 00:00 every day
  const schedule = '* * * * *'; //TODO: Change this to Midnight '0 0 * * *'

  cron.schedule(schedule, async () => {
    logger.info('Starting daily interest accrual job...');
    const startTime = Date.now();

    try {
      const today = new Date();
      const result =
        await interestAccrualService.accrueInterestForAllLoans(today);

      const duration = Date.now() - startTime;
      logger.info('Daily interest accrual completed', {
        processed: result.processed,
        errors: result.errors.length,
        duration: `${duration}ms`,
      });

      if (result.errors.length > 0) {
        logger.warn('Some loans failed to accrue interest', {
          errors: result.errors,
        });
      }
    } catch (error) {
      logger.error('Daily interest accrual job failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  logger.info(
    `Interest accrual job scheduled: ${schedule} (daily at midnight)`
  );
}

/**
 * Manual trigger for testing or catch-up scenarios
 */
export async function triggerInterestAccrualNow(date?: Date): Promise<{
  processed: number;
  errors: Array<{ loanId: string; error: string }>;
}> {
  logger.info('Manually triggering interest accrual job...');
  const accrualDate = date || new Date();

  try {
    const result =
      await interestAccrualService.accrueInterestForAllLoans(accrualDate);
    logger.info('Manual interest accrual completed', {
      processed: result.processed,
      errors: result.errors.length,
    });
    return result;
  } catch (error) {
    logger.error('Manual interest accrual failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
