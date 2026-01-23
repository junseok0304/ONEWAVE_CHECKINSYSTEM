import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import router from './routes.js';

dotenv.config();

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
app.use('/api', router);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`✅ QRCheckin backend running on port ${PORT}`);
});
