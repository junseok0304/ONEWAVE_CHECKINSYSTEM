import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/adminAuth';

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

function getBackendBaseUrl() {
    const directBaseUrl = process.env.BACKEND_INTERNAL_URL || process.env.INTERNAL_API_BASE_URL;
    if (directBaseUrl) {
        return directBaseUrl.replace(/\/$/, '');
    }

    const publicBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (publicBaseUrl && /^https?:\/\//.test(publicBaseUrl)) {
        return publicBaseUrl.replace(/\/$/, '');
    }

    return 'http://localhost:8080/api';
}

async function forwardRequest(request, context) {
    const params = await context.params;
    const cookieStore = await cookies();
    const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || '';
    if (!isValidAdminSession(session)) {
        return NextResponse.json(
            { message: '관리자 인증이 필요합니다.' },
            { status: 401 }
        );
    }

    const adminPassword = process.env.MASTER_PASSWORD;
    if (!adminPassword) {
        return NextResponse.json(
            { message: 'Frontend admin proxy is missing MASTER_PASSWORD.' },
            { status: 500 }
        );
    }

    const upstreamUrl = new URL(
        `${getBackendBaseUrl()}/${params.path.join('/')}${request.nextUrl.search}`
    );

    const headers = new Headers({
        Authorization: `Bearer ${adminPassword}`,
    });

    const contentType = request.headers.get('content-type');
    if (contentType) {
        headers.set('content-type', contentType);
    }

    const init = {
        method: request.method,
        headers,
    };

    if (BODY_METHODS.has(request.method)) {
        const body = await request.text();
        if (body) {
            init.body = body;
        }
    }

    const upstreamResponse = await fetch(upstreamUrl, init);
    const responseText = await upstreamResponse.text();

    return new NextResponse(responseText, {
        status: upstreamResponse.status,
        headers: {
            'content-type': upstreamResponse.headers.get('content-type') || 'application/json',
        },
    });
}

export async function GET(request, context) {
    return forwardRequest(request, context);
}

export async function POST(request, context) {
    return forwardRequest(request, context);
}

export async function PUT(request, context) {
    return forwardRequest(request, context);
}

export async function PATCH(request, context) {
    return forwardRequest(request, context);
}

export async function DELETE(request, context) {
    return forwardRequest(request, context);
}
