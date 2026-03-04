import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const normalizeSecret = (value) => value?.trim().replace(/^["']|["']$/g, '') || '';

const extractBearerToken = (authHeader = '') => authHeader.replace(/^Bearer\s+/i, '').replace(/\\/g, '');

const safeEqual = (left, right) => {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const verifySecret = (expectedSecret, missingMessage, invalidMessage) => (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: missingMessage });
    }

    const token = extractBearerToken(authHeader);
    if (!expectedSecret || !safeEqual(token, expectedSecret)) {
        return res.status(401).json({ message: invalidMessage });
    }

    next();
};

export const verifyMasterPassword = verifySecret(
    normalizeSecret(process.env.MASTER_PASSWORD),
    'No admin password provided',
    'Invalid admin password'
);

export const verifyKioskPassword = verifySecret(
    normalizeSecret(process.env.KIOSK_PASSWORD),
    'No kiosk password provided',
    'Invalid kiosk password'
);
