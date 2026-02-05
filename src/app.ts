import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { sequelize } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import userRoutes from './routes/userRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

app.use(errorHandler);

sequelize.authenticate().then(() => {
  console.log('Database connected');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
