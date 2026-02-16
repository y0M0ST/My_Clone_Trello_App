import 'dotenv/config';
import express from 'express';
import { setupSwagger } from './config/swagger';
// import * as dotenv from 'dotenv'; // Removed as we use 'dotenv/config'
import { AppDataSource } from './config/data-source';
import AppRoute from './apis/index';
import { connectRedis } from './config/redisClient';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// dotenv.config(); // Loaded at top via import 'dotenv/config'

const app = express();
app.use(express.json());
const PORT = Number(process.env.PORT);
app.use(
  cors({
    // origin: 'http://localhost:5173',
    origin: '*',
    credentials: true,
  })
);
app.use(cookieParser());
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});
app.use('', AppRoute);

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized');
  })
  .catch((err) => {
    console.log('Error during Data Source initialization', err);
  });

connectRedis().catch((err) => {
  console.error('Failed to connect to Redis:', err);
});

setupSwagger(app);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
