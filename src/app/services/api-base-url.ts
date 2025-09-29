import { environment } from '../../environments/environment';

export function getApiBaseUrl(): string {
  const runtimeUrl = String((window as any)?.__RUNTIME_CONFIG__?.['API_BASE_URL'] ?? '').trim();
  if (runtimeUrl) {
    return runtimeUrl;
  }

  // Allow overriding via localStorage without rebuilds (e.g., set by Cypress)
  try {
    const lsUrl = String(localStorage.getItem('API_BASE_URL') ?? '').trim();
    if (lsUrl) {
      return lsUrl;
    }
  } catch {
    // ignore
  }
  try {
    const useStaging = localStorage.getItem('USE_STAGING_API');
    if (useStaging && useStaging.toLowerCase() === 'true') {
      // If staging flag is set but no URL provided, we still need a base.
      // Fall back to env apiUrl if set; otherwise warn and use localhost dev API.
      const base = String(environment.apiUrl ?? '').trim();
      if (base) return base;
      console.warn('API_BASE_URL not provided; falling back to http://localhost:3000/api/v1');
      return 'http://localhost:3000/api/v1';
    }
  } catch {
    // Ignore storage access errors and fall back to default
  }

  const envBase = String(environment.apiUrl ?? '').trim();
  if (envBase) return envBase;
  console.warn('environment.apiUrl is empty; falling back to http://localhost:3000/api/v1');
  return 'http://localhost:3000/api/v1';
}


