const MOXFIELD_API_ORIGIN = 'https://api2.moxfield.com';

if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (urlStr.startsWith(MOXFIELD_API_ORIGIN)) {
      const proxiedPath = urlStr.replace(MOXFIELD_API_ORIGIN, '/api/moxfield');
      return originalFetch(proxiedPath, init);
    }

    return originalFetch(input, init);
  };
}
