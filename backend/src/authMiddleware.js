import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

/**
 * 타이밍 공격을 방지하는 안전한 문자열 비교
 */
function timingSafeCompare(a, b) {
    if (!a || !b) return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

export const verifyPassword = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No password provided' });
    }

    // Bearer 토큰 추출
    let token = authHeader.replace('Bearer ', '').trim();

    // 백슬래시 제거 (Shell 이스케이핑)
    token = token.replace(/\\/g, '');

    const master = process.env.MASTER_PASSWORD?.trim().replace(/^["']|["']$/g, '');
    const kiosk = process.env.KIOSK_PASSWORD?.trim().replace(/^["']|["']$/g, '');

    // 타이밍 공격 방지: 모든 비밀번호와 비교
    let isValid = false;
    let isMaster = false;

    if (master && timingSafeCompare(token, master)) {
        isValid = true;
        isMaster = true;
    } else if (kiosk && timingSafeCompare(token, kiosk)) {
        isValid = true;
        isMaster = false;
    }

    if (!isValid) {
        return res.status(401).json({ message: 'Invalid password' });
    }

    req.isMaster = isMaster;
    req.user = { type: isMaster ? 'master' : 'kiosk' };
    next();
};
