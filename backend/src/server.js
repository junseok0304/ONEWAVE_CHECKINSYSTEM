import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import router from './routes.js';

dotenv.config();

const app = express();

// 보안 헤더 추가
app.use(helmet());

// 요청 바디 파싱
app.use(express.json({ limit: '10mb' }));

// 전역 Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100,
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // 헬스 체크 요청은 제한하지 않음
        return req.path === '/health';
    }
});

// 엄격한 Rate Limiting (인증 엔드포인트)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    message: '너무 많은 시도가 있었습니다. 15분 후 다시 시도해주세요.',
});

app.use(globalLimiter);

// CORS 설정
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://192.168.68.54:3000',
    'http://192.168.68.54:3001',
    'https://checkin.omong.kr',
];

// 환경 변수에서 추가 origin 읽기
if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
    origin: (origin, callback) => {
        // origin이 없으면 (예: 같은 도메인 요청) 허용
        if (!origin) {
            callback(null, true);
            return;
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS not allowed from ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// app.use(morgan('dev')); // 로그 비활성화
app.use('/api', router);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`✅ QRCheckin backend running on port ${PORT}`);
});
