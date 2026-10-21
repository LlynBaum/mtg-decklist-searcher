const MOXFIELD_API_ORIGIN = 'https://api2.moxfield.com';

if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (urlStr.startsWith(MOXFIELD_API_ORIGIN)) {
      const proxiedPath = urlStr.replace(MOXFIELD_API_ORIGIN, '/api/moxfield');
      try {
        const response = await originalFetch(proxiedPath, init);
        // If Vite proxy is active, return its response; if static server returns 404 HTML for /api/moxfield, fallback
        const contentType = response.headers.get('content-type') ?? '';
        if (response.ok || contentType.includes('application/json')) {
          return response;
        }
      } catch {
        // Fallback to direct fetch below
      }
    }

    return originalFetch(input, init);
  };
}
