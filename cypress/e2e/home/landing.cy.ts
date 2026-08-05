describe('OSC-IS landing page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('introduces provenance and the three audience paths', () => {
    cy.get('h1').should('have.attr', 'aria-label', 'Open Science Chain');
    cy.contains('h3', 'Discover research').should('be.visible');
    cy.contains('h3', 'Share your work').should('be.visible');
    cy.contains('h3', 'Reproduce a process').should('be.visible');
    cy.contains('h2', 'Evidence that travels with the work').should(
      'be.visible',
    );
    cy.contains('h2', 'Trust infrastructure that stays out of the way').should(
      'be.visible',
    );
    cy.contains('Permissioned Hyperledger Fabric').should('be.visible');
  });

  it('provides working routes to artifacts, workflows, and sign in', () => {
    cy.contains('a', 'Explore artifacts').should(
      'have.attr',
      'href',
      '/list-artifacts',
    );
    cy.contains('a', 'Explore workflows').should(
      'have.attr',
      'href',
      '/list-workflows',
    );
    cy.contains('a', 'Sign in to contribute').should(
      'have.attr',
      'href',
      '/auth/sign-in',
    );
  });

  it('keeps the primary actions visible on a narrow mobile viewport', () => {
    cy.viewport(320, 700);
    cy.get('h1').should('be.visible');
    cy.contains('a', 'Explore artifacts').should('be.visible');
    cy.contains('a', 'See how it works').should('be.visible');
    cy.contains('p', 'Choose your path').should('be.visible');
  });
});
