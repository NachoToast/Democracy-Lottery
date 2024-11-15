import { SocketManager } from './classes/SocketManager.js';
import { connectToMongoDb } from './startup/connectToMongoDb.js';
import { validateEnvironmentVariables } from './startup/validateEnvironmentVariables.js';

process.on('uncaughtException', (error) => {
    console.log('Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.log('Unhandled rejection:', error);
    process.exit(1);
});

console.log(`[${new Date().toLocaleString()}] Starting...`);

const envVars = validateEnvironmentVariables();

const db = await connectToMongoDb(envVars.MONGO_URI, envVars.MONGO_DB_NAME);

new SocketManager(envVars, db, () => {
    console.log(
        `[${new Date().toLocaleString()}] Listening on http://localhost:${envVars.PORT.toString()}`,
    );
});
