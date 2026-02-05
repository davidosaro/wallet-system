import { sequelize } from '../config/database';

/**
 * Setup for all tests
 * Runs before all test suites
 */
beforeAll(async () => {
  // Ensure database connection
  await sequelize.authenticate();

  // Sync all models (creates tables if they don't exist)
  await sequelize.sync({ force: true });
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
  // Clear all tables after each test
  const models = Object.values(sequelize.models);
  for (const model of models) {
    await model.destroy({ where: {}, truncate: true, cascade: true });
  }
});

/**
 * Cleanup after all tests
 */
afterAll(async () => {
  await sequelize.close();
});
