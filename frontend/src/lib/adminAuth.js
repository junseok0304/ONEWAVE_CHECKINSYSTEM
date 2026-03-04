import crypto from 'crypto';

export const ADMIN_SESSION_COOKIE = 'gdgcheckin_admin_session';

const normalizeSecret = (value) => value?.trim().replace(/^["']|["']$/g, '') || '';

const safeEqual = (left, right) => {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export function getAdminPassword() {
    return normalizeSecret(process.env.ADMIN_UI_PASSWORD);
}

export function isValidAdminPassword(candidate) {
    const expected = getAdminPassword();
    if (!expected || !candidate) {
        return false;
    }

    return safeEqual(candidate, expected);
}

export function getAdminSessionValue() {
    return normalizeSecret(
        process.env.ADMIN_SESSION_SECRET ||
        process.env.MASTER_PASSWORD
    );
}

export function isValidAdminSession(candidate) {
    const expected = getAdminSessionValue();
    if (!expected || !candidate) {
        return false;
    }

    return safeEqual(candidate, expected);
}
