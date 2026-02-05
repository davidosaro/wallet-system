import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { sequelize } from './config/database';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './utils/logger';
import userRoutes from './routes/userRoutes';
import walletRoutes from './routes/walletRoutes';
import accountRoutes from './routes/accountRoutes';
import transferRoutes from './routes/transferRoutes';
import fundingRoutes from './routes/fundingRoutes';
import loanRoutes from './routes/loanRoutes';
import { startInterestAccrualJob } from './jobs/interestAccrualJob';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/funding', fundingRoutes);
app.use('/api/loans', loanRoutes);

app.use(errorHandler);

sequelize.authenticate().then(() => {
  logger.info('Database connected');
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);

    // Start background jobs
    startInterestAccrualJob();
    logger.info('Background jobs started');
  });
});
