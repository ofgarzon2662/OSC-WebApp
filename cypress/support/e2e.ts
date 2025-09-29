/// <reference types="cypress" />


// Import commands.js using ES2015 syntax:
import './commands';

// Before each test, set the runtime API toggle via localStorage
// so the Angular app uses staging or local backend accordingly.
beforeEach(() => {
  const useStaging = Cypress.env('USE_STAGING_API');
  if (String(useStaging).toLowerCase() === 'true') {
    // Persist for the app under test (same origin)
    window.localStorage.setItem('USE_STAGING_API', 'true');
  } else {
    window.localStorage.removeItem('USE_STAGING_API');
  }

  const apiBaseUrl = Cypress.env('API_BASE_URL');
  if (apiBaseUrl) {
    window.localStorage.setItem('API_BASE_URL', String(apiBaseUrl));
  } else {
    window.localStorage.removeItem('API_BASE_URL');
  }
});