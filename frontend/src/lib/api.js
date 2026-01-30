/**
 * API 베이스 URL 동적 구성
 * - 프로덕션: 환경 변수 사용
 * - 개발/로컬 네트워크: 현재 호스트 자동 감지
 */
function getApiBaseUrl() {
    // 프로덕션 환경이면 환경 변수 사용
    if (process.env.NEXT_PUBLIC_API_BASE_URL &&
        process.env.NEXT_PUBLIC_API_BASE_URL.includes('https')) {
        return process.env.NEXT_PUBLIC_API_BASE_URL;
    }

    // 브라우저 환경에서만 실행
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081/api';
    }

    // 현재 페이지의 호스트명과 포트 사용
    const { hostname, port } = window.location;
    const protocol = window.location.protocol;

    // localhost/127.0.0.1의 경우 8081 사용, 그 외 현재 호스트의 8081 사용
    return `${protocol}//${hostname}:8081/api`;
}

export async function apiRequest(path, method = 'GET', body, password) {
    const apiUrl = getApiBaseUrl();

    const res = await fetch(`${apiUrl}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${password}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `API Error: ${res.status}`);
    }

    return res.json();
}
