import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
    ADMIN_SESSION_COOKIE,
    getAdminSessionValue,
    isValidAdminPassword,
    isValidAdminSession,
} from '@/lib/adminAuth';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const loginAttempts = new Map();

function getClientIp(request) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    return request.headers.get('x-real-ip') || 'unknown';
}

function getAttemptState(ip) {
    const now = Date.now();
    const current = loginAttempts.get(ip);

    if (!current || current.expiresAt <= now) {
        const nextState = {
            count: 0,
            expiresAt: now + LOGIN_WINDOW_MS,
        };
        loginAttempts.set(ip, nextState);
        return nextState;
    }

    return current;
}

function clearAttemptState(ip) {
    loginAttempts.delete(ip);
}

function buildCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 12,
    };
}

export async function GET() {
    const cookieStore = await cookies();
    const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || '';

    return NextResponse.json({
        authenticated: isValidAdminSession(session),
    });
}

export async function POST(request) {
    const clientIp = getClientIp(request);
    const attemptState = getAttemptState(clientIp);

    if (attemptState.count >= MAX_LOGIN_ATTEMPTS) {
        return NextResponse.json(
            { message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' },
            { status: 429 }
        );
    }

    const { password } = await request.json().catch(() => ({}));

    if (!isValidAdminPassword(password || '')) {
        attemptState.count += 1;
        return NextResponse.json(
            { message: '비밀번호가 올바르지 않습니다.' },
            { status: 401 }
        );
    }

    clearAttemptState(clientIp);

    const response = NextResponse.json({ success: true });
    response.cookies.set(
        ADMIN_SESSION_COOKIE,
        getAdminSessionValue(),
        buildCookieOptions()
    );

    return response;
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, '', {
        ...buildCookieOptions(),
        maxAge: 0,
    });
    return response;
}
