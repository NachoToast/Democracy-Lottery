import { EnvVars } from '../types/EnvVars.js';

function isUndefinedOrEmpty(s?: string): s is undefined {
    return s === undefined || s.length === 0;
}

export function validateEnvironmentVariables(): EnvVars {
    const PORT = Number(process.env['PORT']);

    const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'];

    const MONGO_URI = process.env['MONGO_URI'];

    const MONGO_DB_NAME = process.env['MONGO_DB_NAME'];

    if (!Number.isInteger(PORT)) {
        throw new Error(`PORT must be an integer`);
    }

    if (isUndefinedOrEmpty(ADMIN_PASSWORD)) {
        throw new Error(`ADMIN_PASSWORD must be defined`);
    }

    if (isUndefinedOrEmpty(MONGO_URI)) {
        throw new Error(`MONGO_URI must be defined`);
    }

    if (isUndefinedOrEmpty(MONGO_DB_NAME)) {
        throw new Error(`MONGO_DB_NAME must be defined`);
    }

    if (MONGO_DB_NAME.length > 38) {
        throw new Error(`MONGO_DB_NAME cannot be more than 38 characters long`);
    }

    return {
        PORT,
        ADMIN_PASSWORD,
        MONGO_URI,
        MONGO_DB_NAME,
    };
}
