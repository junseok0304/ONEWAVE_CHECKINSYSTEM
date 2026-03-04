export async function apiRequest(path, method = 'GET', body) {
    const res = await fetch(`/internal-api${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `API Error: ${res.status}`);
    }

    return res.json();
}
