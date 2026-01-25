import dotenv from 'dotenv';
dotenv.config();

export const verifyPassword = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No password provided' });

    // Bearer 토큰 추출 및 이스케이프 문자 제거
    let token = authHeader.replace('Bearer ', '');
    // 백슬래시 제거 (Shell 이스케이핑)
    token = token.replace(/\\/g, '');

    const master = process.env.MASTER_PASSWORD?.trim().replace(/^["']|["']$/g, '');
    const kiosk = process.env.KIOSK_PASSWORD?.trim().replace(/^["']|["']$/g, '');

    const validPasswords = [master, kiosk];

    if (!validPasswords.includes(token)) {
        return res.status(401).json({ message: 'Invalid password' });
    }

    req.isMaster = token === master;
    next();
};
