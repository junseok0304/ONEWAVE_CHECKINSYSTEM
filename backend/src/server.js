import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import router from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(express.json());

// CORS 설정: localhost와 배포 도메인 모두 허용
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://192.168.68.54:3000',
    'http://192.168.68.54:3001',
    'https://checkin.omong.kr',
    process.env.CORS_ORIGIN,
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS error'));
        }
    }
}));

app.use(morgan('dev'));

// 전역 Rate Limiter
const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5분
    max: 2000, // 5분에 2000개 요청 허용 (매우 관대)
    message: { message: '전역 요청 한도를 초과했습니다.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // 로컬 개발 환경에서는 Rate Limiting 무시
        if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
            return true;
        }
        return false;
    },
});

app.use(globalLimiter);
app.use('/api', router);

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`✅ QRCheckin backend running on port ${PORT}`);
});
