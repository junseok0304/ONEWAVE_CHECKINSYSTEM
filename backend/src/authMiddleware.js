import dotenv from 'dotenv';
dotenv.config();

export const verifyPassword = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No password provided' });

    const token = authHeader.replace('Bearer ', '');
    const master = process.env.MASTER_PASSWORD;
    const kiosk = process.env.KIOSK_PASSWORD;

    const validPasswords = [master, kiosk];

    if (!validPasswords.includes(token)) {
        return res.status(401).json({ message: 'Invalid password' });
    }

    req.isMaster = token === master;
    next();
};
