/// <reference types="cypress" />

describe('Authentication Navigation Flow', () => {
  beforeEach(() => {
    // Reset any previous state
    cy.clearLocalStorage();
    cy.clearCookies();
    // Start from home page
    cy.visit('/');
  });

  it('should navigate to sign-in page and back', () => {
    // Click on Sign In link from home page
    cy.get('a.signin-link').click();

    // Verify we're on the sign-in page
    cy.url().should('include', '/auth/sign-in');
    cy.get('form.sign-in-form').should('be.visible');

    // Go back
    cy.go('back');

    // Verify we're back on the home page
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('should show sign-in page when clicking Contribute', () => {
    // Click on Contribute link
    cy.get('a.contribute-link').click();

    // Verify redirect to sign-in
    cy.url().should('include', '/auth/sign-in');
    cy.get('form.sign-in-form').should('be.visible');
  });
});

describe('Sign In Form Validation', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/auth/sign-in');
  });

  it('should show required error messages when fields are touched and empty', () => {
    // Click username field and then click outside to trigger validation
    cy.get('#username').click().blur();
    cy.get('.error-message')
      .first()
      .should('be.visible')
      .and('contain', 'Username is required');

    // Click password field and then click outside to trigger validation
    cy.get('#password').click().blur();
    cy.get('.error-message')
      .last()
      .should('be.visible')
      .and('contain', 'Password is required');
  });

  it('should show forgot credentials message', () => {
    // Click on forgot credentials link
    cy.get('.forgot-password a').click();

    // Verify the message in the form
    cy.get('.forgot-message')
      .should('be.visible')
      .and('contain', 'If you forgot your password or username, please send an email to block@manager.com');

    // Verify the toastr message
    cy.get('.toast-info', { timeout: 8000 })
      .should('be.visible')
      .and('contain', 'Please contact support for assistance');
  });
});

describe('Login/Logout Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/auth/sign-in');
  });

  it('should login and logout successfully with User 1 (username)', () => {
    // Set up interceptors first
    cy.intercept('POST', '**/api/v1/users/login').as('loginRequest');
    cy.intercept('POST', '**/api/v1/users/logout').as('logoutRequest');

    // Login with username
    cy.get('#username').type(Cypress.env('USER1_USERNAME'));
    cy.get('#password').type(Cypress.env('USER1_PASSWORD'));
    cy.get('.form-actions button').click();

    // Wait for login response and verify
    cy.wait('@loginRequest');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('.toast-success', { timeout: 8000 })
      .should('be.visible')
      .and('contain', 'Successfully signed in!');

    // Verify token exists
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.exist;
    });

    // Logout
    cy.get('a:contains("Sign out")').click();
    cy.wait('@logoutRequest');

    // Verify logout
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
    cy.visit('/auth/sign-in');
  });

  it('should login and logout successfully with User 1 (email)', () => {
    // Set up interceptors first
    cy.intercept('POST', '**/api/v1/users/login').as('loginRequest');
    cy.intercept('POST', '**/api/v1/users/logout').as('logoutRequest');

    // Login with email
    cy.get('#username').type(Cypress.env('USER1_EMAIL'));
    cy.get('#password').type(Cypress.env('USER1_PASSWORD'));
    cy.get('.form-actions button').click();

    // Wait for login response and verify
    cy.wait('@loginRequest');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('.toast-success', { timeout: 8000 })
      .should('be.visible')
      .and('contain', 'Successfully signed in!');

    // Verify token exists
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.exist;
    });

    // Logout
    cy.get('a:contains("Sign out")').click();
    cy.wait('@logoutRequest');

    // Verify logout
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
    cy.visit('/auth/sign-in');
  });

  it('should login and logout successfully with User 2 (username)', () => {
    // Set up interceptors first
    cy.intercept('POST', '**/api/v1/users/login').as('loginRequest');
    cy.intercept('POST', '**/api/v1/users/logout').as('logoutRequest');

    // Login with username
    cy.get('#username').type(Cypress.env('USER2_USERNAME'));
    cy.get('#password').type(Cypress.env('USER2_PASSWORD'));
    cy.get('.form-actions button').click();

    // Wait for login response and verify
    cy.wait('@loginRequest');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('.toast-success', { timeout: 8000 })
      .should('be.visible')
      .and('contain', 'Successfully signed in!');

    // Verify token exists
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.exist;
    });

    // Logout
    cy.get('a:contains("Sign out")').click();
    cy.wait('@logoutRequest');

    // Verify logout
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
    cy.visit('/auth/sign-in');
  });

  it('should login and logout successfully with User 2 (email)', () => {
    // Set up interceptors first
    cy.intercept('POST', '**/api/v1/users/login').as('loginRequest');
    cy.intercept('POST', '**/api/v1/users/logout').as('logoutRequest');

    // Login with email
    cy.get('#username').type(Cypress.env('USER2_EMAIL'));
    cy.get('#password').type(Cypress.env('USER2_PASSWORD'));
    cy.get('.form-actions button').click();

    // Wait for login response and verify
    cy.wait('@loginRequest');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('.toast-success', { timeout: 8000 })
      .should('be.visible')
      .and('contain', 'Successfully signed in!');

    // Verify token exists
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.exist;
    });

    // Logout
    cy.get('a:contains("Sign out")').click();
    cy.wait('@logoutRequest');

    // Verify logout
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
    cy.visit('/auth/sign-in');
  });
});
