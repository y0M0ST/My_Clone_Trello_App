import express from 'express';
import { setupSwagger } from './config/swagger';
import * as dotenv from 'dotenv';
import { AppDataSource } from './config/data-source';
import AppRoute from './apis/index';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
app.use(express.json());
const PORT = Number(process.env.PORT);
app.use(
  cors({
    // origin: 'http://localhost:5173',
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use('', AppRoute);

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized');
  })
  .catch((err) => {
    console.log('Error during Data Source initialization', err);
  });

setupSwagger(app);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
