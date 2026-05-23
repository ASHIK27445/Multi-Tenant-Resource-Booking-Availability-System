import dotenv from "dotenv";
dotenv.config();

import { app } from './app';
import { connectDatabase } from './config/database';
import { environment } from './config/environment';

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(environment.PORT, () => {
      console.log(`Server running on port ${environment.PORT} in ${environment.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();