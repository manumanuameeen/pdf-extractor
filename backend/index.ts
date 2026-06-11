import dotenv from 'dotenv';
import app from './src/app';
import { SYSTEM_MESSAGES } from './src/constants/messages';

/**
 * ARCHITECTURE: ENTRY POINT
 * Purpose: Load environment variables and start the HTTP server.
 */

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(SYSTEM_MESSAGES.SERVER_STARTED.replace('{port}', String(PORT)));
});
