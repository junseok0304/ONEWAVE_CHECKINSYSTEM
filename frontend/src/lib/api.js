/**
 * API 베이스 URL 동적 구성
 * - 프로덕션: 상대 경로 /api (nginx가 백엔드로 프록시)
 * - 개발: 환경 변수 또는 localhost:8081
 */
function getApiBaseUrl() {
    // 브라우저 환경에서만 실행
    if (typeof window === 'undefined') {
        return '/api';
    }

    // 프로덕션/배포 환경: 항상 상대 경로 사용 (nginx 프록시)
    return '/api';
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
