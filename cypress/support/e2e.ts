/// <reference types="cypress" />

// Import commands.js using ES2015 syntax:
import './commands';
import 'cypress-axe';

function configureRuntimeStorage(storage: Storage): void {
  const useStaging = Cypress.env('USE_STAGING_API');
  if (String(useStaging).toLowerCase() === 'true') {
    storage.setItem('USE_STAGING_API', 'true');
  } else {
    storage.removeItem('USE_STAGING_API');
  }

  const apiBaseUrl = Cypress.env('API_BASE_URL');
  if (apiBaseUrl) {
    storage.setItem('API_BASE_URL', String(apiBaseUrl));
  } else {
    storage.removeItem('API_BASE_URL');
  }
}

function installLocalSession(win: Window): void {
  const token = String(Cypress.env('AUTH_TOKEN') ?? '').trim();
  if (!token) return;

  const payloadSegment = token.split('.')[1];
  if (!payloadSegment) {
    throw new Error('CYPRESS_AUTH_TOKEN is not a JWT');
  }

  const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const payload = JSON.parse(win.atob(padded)) as { exp?: number };
  if (!payload.exp || payload.exp * 1000 <= Date.now()) {
    throw new Error('CYPRESS_AUTH_TOKEN is missing an expiry or has expired');
  }

  const tokenData = JSON.stringify({
    token,
    expiresAt: payload.exp * 1000,
  });
  win.localStorage.setItem('tokenData', tokenData);
  win.localStorage.setItem('token', token);
}

// Configure the application origin before Angular initializes. This works for
// both credential-driven specs and an explicitly supplied local session token.
Cypress.on('window:before:load', (win) => {
  configureRuntimeStorage(win.localStorage);
  installLocalSession(win);
});
