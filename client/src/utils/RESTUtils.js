export async function fetchJSON(url, options = {}) {
    const res = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        },
        ...options,
    });

    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json() : await res.text();

    if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        err.body = body;
        throw err;
    }
    return body; // <- just the parsed body
}