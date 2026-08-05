/// <reference types="cypress" />

const artifacts = [
  {
    id: 'artifact-nsg-001',
    title: 'Neuroscience image segmentation dataset',
    description:
      'Curated imaging data and metadata used to validate a reproducible segmentation workflow.',
    keywords: ['neuroscience', 'imaging'],
    submittedAt: '2026-07-28T12:00:00.000Z',
    verified: true,
    lastTimeVerified: '2026-07-29T12:00:00.000Z',
    lastTimeUpdated: null,
  },
  {
    id: 'artifact-cs-001',
    title: 'Citizen Science coastal observations',
    description:
      'A community-contributed collection of coastal observations with collection context.',
    keywords: ['citizen-science', 'coastal'],
    submittedAt: '2026-07-27T12:00:00.000Z',
    verified: false,
    lastTimeVerified: null,
    lastTimeUpdated: '2026-07-30T12:00:00.000Z',
  },
];

const workflows = [
  {
    id: 'workflow-nsg-001',
    title: 'Reproducible neuroimaging preparation',
    description:
      'A documented process for preparing, validating, and publishing neuroimaging inputs.',
    keywords: ['neuroscience', 'workflow'],
    submissionState: 'recorded',
    submittedAt: '2026-07-28T12:00:00.000Z',
    updatedAt: '2026-07-29T12:00:00.000Z',
  },
];

const artifactDetail = {
  ...artifacts[0],
  links: [],
  dois: [],
  fundingAgencies: ['National Science Foundation'],
  acknowledgements: 'Prepared for reproducibility testing.',
  submission_comment: 'Initial research release.',
  footprint: 'b731d8f7cc8d9463a5ab13c6bbef70f5103e398ad001aaf52c91a2fb94d6397e',
  manifest: [
    {
      filename: 'dataset_description.json',
      hash: 'f32b925cf835fd2606575a746dad693e3b1b06be81b74135ab9c8027218d63e7',
      algorithm: 'sha256',
    },
  ],
  submissionState: 'CONFIRMED',
  submitterEmail: 'researcher@example.test',
  submitterUsername: 'nsg-researcher',
  blockchainTxId:
    '7c6f65d972d80f65af0f817cbc6f9b5f7bd86e3377bfd593962804afbff02822',
  peerId: 'peer0.nsg.osc.example',
  submissionError: null,
  organization: { name: 'Neuroscience Gateway' },
};

const workflowDetail = {
  ...workflows[0],
  githubRepositories: [],
  artifacts: [
    {
      id: artifactDetail.id,
      title: artifactDetail.title,
      description: artifactDetail.description,
    },
  ],
  submitterEmail: 'researcher@example.test',
  submitterUsername: 'nsg-researcher',
  submission_comment: 'Records the reproducible preparation sequence.',
  blockchainTxId:
    'd4ca802d8b18353f9b538f65f52293a556aa245ff3777bba516f32c27655ee40',
  peerId: 'peer0.nsg.osc.example',
  organization: { name: 'Neuroscience Gateway' },
};

function stubCatalogs(
  artifactResponse: Cypress.StaticResponse = { body: artifacts },
  workflowResponse: Cypress.StaticResponse = { body: workflows },
): void {
  cy.intercept('GET', '**/api/v1/artifacts', artifactResponse).as('artifacts');
  cy.intercept('GET', '**/api/v1/workflows', workflowResponse).as('workflows');
}

function checkWcag(): void {
  cy.injectAxe();
  cy.checkA11y(
    undefined,
    {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      },
    },
    (violations) => {
      if (violations.length === 0) {
        return;
      }

      const details = violations
        .map((violation) => {
          const targets = violation.nodes
            .map((node) => node.target.join(' '))
            .join(', ');
          return `${violation.id}: ${violation.help} [${targets}]`;
        })
        .join('\n');
      throw new Error(`Accessibility violations:\n${details}`);
    },
    true,
  );
}

describe('WCAG 2.2 AA regression checks', () => {
  it('checks the landing page and desktop contribution menu', () => {
    cy.viewport(1440, 900);
    stubCatalogs();
    cy.visit('/');
    cy.wait(['@artifacts', '@workflows']);
    cy.get('h1').should('have.attr', 'aria-label', 'Open Science Chain');
    checkWcag();

    cy.contains('button', 'Contribute').click();
    cy.get('[role="menu"]').should('be.visible');
    checkWcag();
  });

  it('checks keyboard access and mobile navigation', () => {
    cy.viewport(390, 844);
    stubCatalogs();
    cy.visit('/');
    cy.wait(['@artifacts', '@workflows']);
    cy.get('h1').should('be.visible');
    cy.get('.navigation-toggle').click();
    cy.get('#primary-navigation-links').should('be.visible');
    cy.contains('button', 'Contribute').click();
    cy.get('[role="menu"]').should('be.visible');
    checkWcag();

    cy.get('body').type('{esc}');
    cy.get('#primary-navigation-links').should('not.be.visible');
  });

  it('checks the sign-in form and its validation messages', () => {
    cy.visit('/auth/sign-in');
    checkWcag();

    cy.get('#username').focus().blur();
    cy.get('#password').focus().blur();
    cy.get('#username-error').should('be.visible');
    cy.get('#password-error').should('be.visible');
    checkWcag();
  });

  it('checks artifact results, empty search, and API failure states', () => {
    stubCatalogs();
    cy.visit('/list-artifacts');
    cy.wait('@artifacts');
    cy.get('app-artifact-card').should('have.length', artifacts.length);
    checkWcag();

    cy.get('#artifact-title-search').type('no matching title');
    cy.contains('button', 'Search').click();
    cy.contains('No matching artifacts').should('be.visible');
    checkWcag();

    cy.intercept('GET', '**/api/v1/artifacts', {
      statusCode: 503,
      body: { message: 'simulated outage' },
    }).as('artifactFailure');
    cy.visit('/list-artifacts');
    cy.wait('@artifactFailure');
    cy.contains('We could not load the artifact catalog').should('be.visible');
    checkWcag();
  });

  it('checks workflow results and API failure states', () => {
    stubCatalogs();
    cy.visit('/list-workflows');
    cy.wait('@workflows');
    cy.get('app-workflow-card').should('have.length', workflows.length);
    checkWcag();

    cy.intercept('GET', '**/api/v1/workflows', {
      statusCode: 503,
      body: { message: 'simulated outage' },
    }).as('workflowFailure');
    cy.visit('/list-workflows');
    cy.wait('@workflowFailure');
    cy.contains('We could not load the workflow catalog').should('be.visible');
    checkWcag();
  });

  it('checks blockchain provenance on artifact and workflow details', () => {
    cy.intercept('GET', '**/api/v1/artifacts/artifact-nsg-001', {
      body: artifactDetail,
    }).as('artifactDetail');
    cy.visit('/artifacts/artifact-nsg-001');
    cy.wait('@artifactDetail');
    cy.contains('h2', 'Recorded on the OSC permissioned blockchain').should(
      'be.visible',
    );
    checkWcag();

    cy.intercept('GET', '**/api/v1/workflows/workflow-nsg-001', {
      body: workflowDetail,
    }).as('workflowDetail');
    cy.visit('/workflows/workflow-nsg-001');
    cy.wait('@workflowDetail');
    cy.contains(
      'h2',
      'Workflow relationships committed as a ledger event',
    ).should('be.visible');
    checkWcag();
  });
});
