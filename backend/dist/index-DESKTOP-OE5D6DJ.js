import 'dotenv/config';
import app from './src/app.js';
import { SYSTEM_MESSAGES } from './src/constants/messages.js';
/**
 * ARCHITECTURE: ENTRY POINT
 * Purpose: Load environment variables and start the HTTP server.
 */
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
    console.log(SYSTEM_MESSAGES.SERVER_STARTED.replace('{port}', String(PORT)));
});
