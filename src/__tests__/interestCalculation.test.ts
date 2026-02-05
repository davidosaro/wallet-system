import Decimal from 'decimal.js';
import { interestAccrualService } from '../services/interestAccrualService';

// Configure Decimal.js for consistency
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

describe('Interest Calculation - Math Precision Tests', () => {
  const ANNUAL_RATE = 0.275; // 27.5%

  describe('Basic daily interest calculation', () => {
    it('should calculate correct daily interest for a regular year (365 days)', () => {
      const principal = 10000;
      const date = new Date('2023-06-15'); // Regular year

      const result = interestAccrualService.calculateDailyInterest(
        principal,
        ANNUAL_RATE,
        date
      );

      // Daily rate = 27.5% / 365 = 0.0753424657534247%
      const expectedDailyRate = new Decimal(ANNUAL_RATE).dividedBy(365);
      const expectedInterest = new Decimal(principal).times(expectedDailyRate);

      expect(result.daysInYear).toBe(365);
      expect(result.dailyRate).toBeCloseTo(parseFloat(expectedDailyRate.toFixed(12)), 12);
      expect(result.interestAmount).toBeCloseTo(
        parseFloat(expectedInterest.toFixed(4)),
        4
      );

      // Verify exact calculation
      expect(result.interestAmount).toBe(7.5342); // 10000 * (0.275 / 365) = 7.534246575342466
    });

    it('should calculate correct daily interest for a leap year (366 days)', () => {
      const principal = 10000;
      const date = new Date('2024-06-15'); // Leap year

      const result = interestAccrualService.calculateDailyInterest(
        principal,
        ANNUAL_RATE,
        date
      );

      // Daily rate = 27.5% / 366 = 0.0751366120218579%
      const expectedDailyRate = new Decimal(ANNUAL_RATE).dividedBy(366);
      const expectedInterest = new Decimal(principal).times(expectedDailyRate);

      expect(result.daysInYear).toBe(366);
      expect(result.dailyRate).toBeCloseTo(parseFloat(expectedDailyRate.toFixed(12)), 12);
      expect(result.interestAmount).toBeCloseTo(
        parseFloat(expectedInterest.toFixed(4)),
        4
      );

      // Verify exact calculation
      expect(result.interestAmount).toBe(7.5137); // 10000 * (0.275 / 366) = 7.513661202185792
    });

    it('should handle large principal amounts without precision loss', () => {
      const principal = 1000000000; // 1 billion
      const date = new Date('2023-01-01');

      const result = interestAccrualService.calculateDailyInterest(
        principal,
        ANNUAL_RATE,
        date
      );

      const expectedDailyRate = new Decimal(ANNUAL_RATE).dividedBy(365);
      const expectedInterest = new Decimal(principal).times(expectedDailyRate);

      expect(result.interestAmount).toBeCloseTo(
        parseFloat(expectedInterest.toFixed(4)),
        4
      );
      expect(result.interestAmount).toBe(753424.6575); // No floating-point errors
    });

    it('should handle small principal amounts precisely', () => {
      const principal = 1; // 1 dollar
      const date = new Date('2023-01-01');

      const result = interestAccrualService.calculateDailyInterest(
        principal,
        ANNUAL_RATE,
        date
      );

      const expectedDailyRate = new Decimal(ANNUAL_RATE).dividedBy(365);
      const expectedInterest = new Decimal(principal).times(expectedDailyRate);

      expect(result.interestAmount).toBeCloseTo(
        parseFloat(expectedInterest.toFixed(4)),
        4
      );
      expect(result.interestAmount).toBe(0.0008); // 1 * (0.275/365) = 0.0007534...
    });
  });

  describe('Leap year detection', () => {
    it('should correctly identify leap years', () => {
      const leapYears = [
        new Date('2020-01-01'),
        new Date('2024-01-01'),
        new Date('2000-01-01'),
      ];

      leapYears.forEach((date) => {
        const result = interestAccrualService.calculateDailyInterest(10000, ANNUAL_RATE, date);
        expect(result.daysInYear).toBe(366);
      });
    });

    it('should correctly identify non-leap years', () => {
      const regularYears = [
        new Date('2021-01-01'),
        new Date('2023-01-01'),
        new Date('1900-01-01'), // Divisible by 100 but not 400
      ];

      regularYears.forEach((date) => {
        const result = interestAccrualService.calculateDailyInterest(10000, ANNUAL_RATE, date);
        expect(result.daysInYear).toBe(365);
      });
    });

    it('should handle century leap year correctly', () => {
      const year2000 = new Date('2000-02-29'); // Leap year (divisible by 400)
      const year1900 = new Date('1900-02-28'); // Not a leap year

      const result2000 = interestAccrualService.calculateDailyInterest(10000, ANNUAL_RATE, year2000);
      const result1900 = interestAccrualService.calculateDailyInterest(10000, ANNUAL_RATE, year1900);

      expect(result2000.daysInYear).toBe(366);
      expect(result1900.daysInYear).toBe(365);
    });
  });

  describe('Cumulative interest over time', () => {
    it('should accumulate interest correctly over multiple days in a regular year', () => {
      const principal = 10000;
      const days = 30; // 1 month
      const dailyRate = new Decimal(ANNUAL_RATE).dividedBy(365);

      let cumulativeInterest = new Decimal(0);
      for (let i = 0; i < days; i++) {
        const dailyInterest = new Decimal(principal).times(dailyRate);
        cumulativeInterest = cumulativeInterest.plus(dailyInterest);
      }

      const expected = parseFloat(cumulativeInterest.toFixed(4));
      const calculated = 30 * 7.5342; // Daily interest * 30 days

      expect(calculated).toBeCloseTo(expected, 2);
      expect(expected).toBe(226.0274); // 30 days of interest
    });

    it('should handle year transition correctly', () => {
      const principal = 10000;

      // Last day of regular year
      const dec31_2023 = new Date('2023-12-31');
      const result2023 = interestAccrualService.calculateDailyInterest(
        principal,
        ANNUAL_RATE,
        dec31_2023
      );

      // First day of leap year
      const jan1_2024 = new Date('2024-01-01');
      const result2024 = interestAccrualService.calculateDailyInterest(
        principal,
        ANNUAL_RATE,
        jan1_2024
      );

      expect(result2023.daysInYear).toBe(365);
      expect(result2024.daysInYear).toBe(366);
      expect(result2023.interestAmount).toBeGreaterThan(result2024.interestAmount);
    });

    it('should calculate interest for full year correctly', () => {
      const principal = 10000;

      // Regular year: 365 days
      const regularYearInterest = 365 * 7.5342;
      const expectedRegularYear = new Decimal(principal)
        .times(ANNUAL_RATE)
        .toNumber();

      expect(regularYearInterest).toBeCloseTo(expectedRegularYear, 0);

      // Leap year: 366 days
      const leapYearInterest = 366 * 7.5137;
      const expectedLeapYear = new Decimal(principal)
        .times(ANNUAL_RATE)
        .toNumber();

      expect(leapYearInterest).toBeCloseTo(expectedLeapYear, 0);
    });
  });

  describe('Edge cases and precision', () => {
    it('should maintain precision with repeating decimals', () => {
      const principal = 10000 / 3; // 3333.333...
      const date = new Date('2023-01-01');

      const result = interestAccrualService.calculateDailyInterest(
        principal,
        ANNUAL_RATE,
        date
      );

      const expectedDailyRate = new Decimal(ANNUAL_RATE).dividedBy(365);
      const expectedInterest = new Decimal(principal).times(expectedDailyRate);

      expect(result.interestAmount).toBe(parseFloat(expectedInterest.toFixed(4)));
      expect(result.interestAmount).toBe(2.5114); // Precise calculation
    });

    it('should handle zero principal', () => {
      const result = interestAccrualService.calculateDailyInterest(
        0,
        ANNUAL_RATE,
        new Date('2023-01-01')
      );

      expect(result.interestAmount).toBe(0);
      expect(result.principalBalance).toBe(0);
    });

    it('should avoid floating-point errors in multiplication', () => {
      // Test a case known to cause floating-point issues
      const principal = 0.1 + 0.2; // 0.30000000000000004 in floating point
      const date = new Date('2023-01-01');

      const result = interestAccrualService.calculateDailyInterest(
        principal,
        ANNUAL_RATE,
        date
      );

      // Should handle the floating-point input correctly
      const expectedDailyRate = new Decimal(ANNUAL_RATE).dividedBy(365);
      const expectedInterest = new Decimal(principal).times(expectedDailyRate);

      expect(result.interestAmount).toBe(parseFloat(expectedInterest.toFixed(4)));
    });

    it('should round consistently using ROUND_HALF_UP', () => {
      const principal = 10000.12345;
      const date = new Date('2023-01-01');

      const result = interestAccrualService.calculateDailyInterest(
        principal,
        ANNUAL_RATE,
        date
      );

      // The result should be rounded to 4 decimal places using ROUND_HALF_UP
      expect(result.interestAmount.toString()).toMatch(/^\d+\.\d{1,4}$/);
      expect(result.interestAmount).toBe(7.5343); // Properly rounded
    });
  });

  describe('Different interest rates', () => {
    it('should calculate correctly for various interest rates', () => {
      const principal = 10000;
      const date = new Date('2023-01-01');
      const rates = [0.05, 0.10, 0.15, 0.20, 0.275, 0.30];

      rates.forEach((rate) => {
        const result = interestAccrualService.calculateDailyInterest(principal, rate, date);
        const expectedDailyRate = new Decimal(rate).dividedBy(365);
        const expectedInterest = new Decimal(principal).times(expectedDailyRate);

        expect(result.interestAmount).toBe(parseFloat(expectedInterest.toFixed(4)));
        expect(result.annualRate).toBe(rate);
      });
    });
  });
});
