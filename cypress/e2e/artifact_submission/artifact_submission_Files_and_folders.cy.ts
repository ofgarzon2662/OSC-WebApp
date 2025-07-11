/// <reference types="cypress" />

describe('Artifact Submission Full Flow Test', () => {
  const loginAsPI = () => {
    cy.visit('/auth/sign-in');
    cy.get('#username').type(Cypress.env('PI1_USERNAME'));
    cy.get('#password').type(Cypress.env('PI1_PASSWORD'));
    cy.contains('button', 'Sign In').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('.toast-success').should('be.visible');
  };

  const navigateToContribute = () => {
    cy.contains('a', 'Contribute').click();
    cy.url().should('include', '/contribute');
    cy.contains('Add a New Artifact').should('be.visible');
  };

  const logout = () => {
    cy.visit('/');
    cy.contains('a', /sign out/i).click();
    cy.contains('a', 'Sign In').should('be.visible');
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    loginAsPI();
    navigateToContribute();
  });

  afterEach(() => {
    logout();
  });

  it('validates big folders', () => {
    /* ---------- 1. Campos obligatorios ---------- */
  
    // Título único (evita colisiones en el backend)
    const uniqueTitle = `Valid Artifact Title ${Date.now()}`;
    cy.get('#title').type(uniqueTitle).blur();
    cy.contains('Title must be at least 3 characters').should('not.exist');
    cy.contains('Title cannot exceed 200 characters').should('not.exist');
  
    // Descripción válida (> 50 caracteres)
    cy.get('#description')
      .type('This is a valid description with more than fifty characters to meet the minimum requirement.')
      .blur();
    cy.contains('Description must be at least 50 characters').should('not.exist');
    cy.contains('Description cannot exceed 3000 characters').should('not.exist');
  
    /* ---------- 2. Upload de una carpeta ---------- */
  
    const folderName   = `random_files_${Date.now()}`; // nombre virtual
    const filesCount   = 50;                           // Nº de archivos de la carpeta
    const dataTransfer = new DataTransfer();
  
    for (let i = 0; i < filesCount; i++) {
      // crea un Blob pequeño para cada archivo
      const blob = new Blob([`sample content ${i}`], { type: 'text/plain' });
  
      // File con nombre file_i.txt
      const file = new File([blob], `file_${i}.txt`, { type: 'text/plain' });
  
      // 👉 Clave: asignar webkitRelativePath para que el frontend lo reconozca como “folder/file”
      Object.defineProperty(file, 'webkitRelativePath', {
        value: `${folderName}/file_${i}.txt`,
      });
  
      dataTransfer.items.add(file);
    }
  
    // Dispara el drop en tu zona drag-and-drop
    cy.get('.drop-zone').trigger('drop', { dataTransfer });
  
    /* ---------- 3. Asserts de que se subió una carpeta ---------- */
  
  
    // Hash calculado
    cy.get('.file-hash').should('not.be.empty');
  
    /* ---------- 4. Enviar el formulario ---------- */
  
    cy.intercept('POST', '**/api/v1/artifacts').as('submitArtifact');
  
    cy.get('[data-cy="submit-btn"]')
      .should('not.be.disabled')  // debe estar habilitado ahora
      .click();
  
    cy.wait('@submitArtifact').its('response.statusCode').should('eq', 201);
    cy.get('.toast-success')
      .should('contain', 'Your artifact has been successfully submitted');
  
    // Redirección / confirmación final
    cy.url().should('include', '/contribute');
  });
  
  it('Validate big files - Retries submission', () => {
    const uniqueTitle = `Valid Artifact Title ${Date.now()}`;

    cy.get('#title').type(uniqueTitle).blur();
    cy.contains('Title must be at least 3 characters').should('not.exist');
    cy.contains('Title cannot exceed 200 characters').should('not.exist');

    cy.get('#description').type('This is a valid description with more than fifty characters to meet the minimum requirement.').blur();
    cy.contains('Description must be at least 50 characters').should('not.exist');
    cy.contains('Description cannot exceed 3000 characters').should('not.exist');

    // Upload file
    cy.fixture('bigfile_21MB.bin', 'base64').then(fileContent => {
      const testFile = Cypress.Blob.base64StringToBlob(fileContent, 'text/plain');
      const file = new File([testFile], 'bigfile_21MB.bin', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      cy.get('.drop-zone').trigger('drop', { dataTransfer });
    });

    cy.get('[data-cy="submit-btn"]').should('be.disabled');
    cy.contains('😬 Well, that didn\'t go as planned...').should('be.visible');
    cy.contains('File size (21 MB) exceeds the limit of 20 MB.').should('be.visible');
    cy.url().should('include', '/contribute');
    cy.wait(1000);

    cy.get('button:contains("Try Again")').click();
    cy.wait(2000);

    // Upload file
    cy.fixture('bigfile_20MB.bin', 'base64').then(fileContent => {
      const testFile = Cypress.Blob.base64StringToBlob(fileContent, 'text/plain');
      const file = new File([testFile], 'bigfile_20MB.bin', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      cy.get('.drop-zone').trigger('drop', { dataTransfer });
      cy.get('.file-info').should('contain', 'bigfile_20MB.bin');
      cy.get('.file-hash').should('not.be.empty');
    });

    cy.intercept('POST', '**/api/v1/artifacts').as('submitArtifact');
    cy.get('[data-cy="submit-btn"]').should('not.be.disabled').click();
    cy.wait('@submitArtifact').its('response.statusCode').should('eq', 201);
    cy.get('.toast-success').should('contain', 'Your artifact has been successfully submitted');
    cy.url().should('include', '/contribute');
  });

    
    
});
