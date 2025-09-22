/// <reference types="cypress" />

describe('History flow - single artifact', () => {
  const UNIQUE_TITLE = `e2e-history-artifact-${Date.now()}`;
  const UNIQUE_KEYWORDS = 'hist-k1, hist-k2, special-hist-key';
  const UNIQUE_LINKS = 'https://example.com/a, https://example.com/b';
  const UNIQUE_DOIS = '10.1234/abcd1, 10.5678/efgh2';
  const DESCRIPTION = 'E2E history test description with more than fifty characters to pass validation.';

  function loginAsPI() {
    cy.contains('Contribute').click();
    cy.url().should('include', '/auth/sign-in');
    cy.get('input[formcontrolname="username"]').type(Cypress.env('PI1_EMAIL'));
    cy.get('input[formcontrolname="password"]').type(Cypress.env('PI1_PASSWORD'), { log: false });
    cy.get('.form-actions button').click();
    cy.url().should('not.include', '/auth/sign-in');
  }

  it('creates artifact, searches it, opens history and validates single current card', () => {
    cy.visit('/');

    // Sign in
    loginAsPI();

    // Go to create page
    cy.contains('Contribute').click();

    // Fill minimal metadata
    cy.get('input[formcontrolname="title"]').type(UNIQUE_TITLE);
    cy.get('textarea[formcontrolname="description"]').type(DESCRIPTION);
    cy.get('input[formcontrolname="keywords"]').type(UNIQUE_KEYWORDS);
    cy.get('input[formcontrolname="links"]').type(UNIQUE_LINKS);
    cy.get('input[formcontrolname="doi"]').type(UNIQUE_DOIS);
    // Funding agencies: check NSF and NIH, plus type other agency
    cy.get('input[formcontrolname="nsf"]').check({ force: true });
    cy.get('input[formcontrolname="nih"]').check({ force: true });
    cy.get('input[formcontrolname="otherAgency"]').type('Agency-X, Agency-Y');

    // Upload single file (fixtures/sample.txt must exist)
    cy.get('input[type="file"]').first().selectFile('cypress/fixtures/sample.txt', { force: true });

    // Submit
    cy.get('[data-cy="submit-btn"]').should('not.be.disabled').click();
    cy.contains('Your artifact has been successfully submitted!').should('be.visible');

    // Navigate to list and search by unique terms
    cy.visit('/list-artifacts');
    cy.get('input[placeholder="Artifact\'s title contains"]').type(UNIQUE_TITLE);
    cy.get('button').contains('Search').click();
    cy.get('app-artifact-card').should('have.length', 1);

    // Open Detail → verify fields → then History
    cy.get('app-artifact-card a.view-button').contains('View').click();
    cy.url().should('match', /\/artifacts\/.+/);

    // Detail assertions (title, description, keywords, links, agencies, dois)
    cy.contains(UNIQUE_TITLE).should('exist');
    cy.contains('Description').should('exist');
    cy.contains(DESCRIPTION.substring(0, 20)).should('exist');
    UNIQUE_KEYWORDS.split(',').forEach(k => {
      cy.contains(k.trim()).should('exist');
    });
    UNIQUE_LINKS.split(',').forEach(l => {
      cy.get(`a[href="${l.trim()}"]`).should('exist');
    });
    cy.contains('Funding Agencies').parent().should('contain.text', 'NSF').and('contain.text', 'NIH').and('contain.text', 'Agency-X');
    cy.contains('DOIs').parent().should('contain.text', '10.1234/abcd1').and('contain.text', '10.5678/efgh2');

    // Open history
    cy.contains('History').click();
    cy.url().should('match', /\/artifacts\/.+\/history$/);
    cy.wait(2000);

    // History page: click Refresh first, then expect exactly one card
    cy.contains('button', 'Refresh History').click();
    cy.contains('Loading history…', { timeout: 10000 }).should('exist');
    cy.contains('Loading history…', { timeout: 10000 }).should('not.exist');
    cy.contains('No history found.').should('not.exist');
    cy.get('.history-list a').should('have.length', 1).first().click();

    // History detail should show Current State badge and metadata
    cy.contains('Current State').should('be.visible');
    cy.contains(UNIQUE_TITLE).should('be.visible');
    cy.contains(DESCRIPTION.substring(0, 20)).should('be.visible');

    // From History detail: go to See Artifact's Detail and validate all fields
    cy.contains("See Artifact's Detail").click();
    cy.url().should('match', /\/artifacts\/.+$/);
    cy.contains(UNIQUE_TITLE).should('exist');
    cy.contains(DESCRIPTION.substring(0, 20)).should('exist');
    UNIQUE_KEYWORDS.split(',').forEach(k => cy.contains(k.trim()).should('exist'));
    UNIQUE_LINKS.split(',').forEach(l => cy.get(`a[href="${l.trim()}"]`).should('exist'));
    cy.contains('Funding Agencies').parent().should('contain.text', 'NSF').and('contain.text', 'NIH').and('contain.text', 'Agency-X');
    cy.contains('DOIs').parent().should('contain.text', '10.1234/abcd1').and('contain.text', '10.5678/efgh2');

    // Click Update Artifact and modify metadata
    cy.contains('Update Artifact').click();
    cy.url().should('include', '/update-artifact/');

    // Change metadata fields
    const NEW_KEYWORDS = 'new-k1, new-k2';
    const NEW_LINKS = 'https://example.com/c, https://example.com/d';
    const NEW_DOIS = '10.9999/xyz1, 10.8888/xyz2';
    const NEW_ACK = 'Updated acknowledgements for history flow.';

    cy.get('input[formcontrolname="keywords"]').clear().type(NEW_KEYWORDS);
    cy.get('input[formcontrolname="links"]').clear().type(NEW_LINKS);
    cy.get('input[formcontrolname="doi"]').clear().type(NEW_DOIS);
    // Toggle agencies: uncheck NIH, check NASA and type other agency
    cy.get('input[formcontrolname="nih"]').uncheck({ force: true });
    cy.get('input[formcontrolname="nasa"]').check({ force: true });
    cy.get('input[formcontrolname="otherAgency"]').clear().type('Agency-Z');
    cy.get('textarea[formcontrolname="acknowledgment"]').clear().type(NEW_ACK);

    // Select a new file (or folder) and store footprint
    cy.get('input[type="file"]').first().selectFile('cypress/fixtures/sample.txt', { force: true });

    // Ensure Update button is enabled and submit
    cy.contains('button', 'Update').should('not.be.disabled').click();

    // Expect success toast and CTA
    cy.contains('Artifact updated successfully!', { timeout: 10000 }).should('be.visible');
    cy.contains('Check your modified artifact')
      .scrollIntoView()
      .should('exist')
      .click({ force: true });

    // On updated detail, verify new values
    cy.contains(NEW_KEYWORDS.split(',')[0].trim()).should('exist');
    NEW_LINKS.split(',').forEach(l => cy.get(`a[href="${l.trim()}"]`).should('exist'));
    cy.contains('Funding Agencies').parent().should('contain.text', 'NSF').and('not.contain.text', 'NIH').and('contain.text', 'NASA').and('contain.text', 'Agency-Z');
    cy.contains('DOIs').parent().should('contain.text', '10.9999/xyz1').and('contain.text', '10.8888/xyz2');
    cy.contains(NEW_ACK).should('exist');

    // Go to history, refresh, and assert two cards: Current and Initial
    cy.contains('History').click();
    cy.url().should('match', /\/artifacts\/.+\/history$/);
    cy.wait(2000);
    cy.contains('button', 'Refresh History').click();
    cy.contains('Loading history…', { timeout: 10000 }).should('exist');
    cy.contains('Loading history…', { timeout: 10000 }).should('not.exist');
    cy.get('.history-list a').should('have.length', 2);

    // Open the Current State snapshot via its permalink (🔗)
    cy.contains('.history-card', 'Current State')
      .find('a.permalink')
      .first()
      .click();
    cy.contains('Current State').should('be.visible');
    // Validate updated fields in snapshot detail
    cy.contains(NEW_KEYWORDS.split(',')[0].trim()).should('exist');
    NEW_LINKS.split(',').forEach(l => cy.contains(l.trim()).should('exist'));
    cy.contains('Description').should('exist');
  });
});


