export interface DailyInterestAccrualAttributes {
  id: string;
  loanId: string;
  accrualDate: string; // YYYY-MM-DD format
  principalBalance: number;
  dailyRate: number;
  interestAmount: number;
  daysInYear: number;
  cumulativeInterest: number;
  createdAt?: Date;
}

export interface CreateDailyAccrualDto {
  loanId: string;
  accrualDate: string;
  principalBalance: number;
  dailyRate: number;
  interestAmount: number;
  daysInYear: number;
  cumulativeInterest: number;
}

export interface AccrueInterestDto {
  loanId?: string; // If provided, accrue for specific loan, otherwise all active loans
  accrualDate?: Date; // If provided, accrue for specific date, otherwise today
}

export interface InterestCalculation {
  principalBalance: number;
  annualRate: number;
  dailyRate: number;
  daysInYear: number;
  interestAmount: number;
}
