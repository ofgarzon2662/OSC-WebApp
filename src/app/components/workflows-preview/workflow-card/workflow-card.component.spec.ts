import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkflowCardComponent } from './workflow-card.component';
import { Workflow } from '../../../models/workflow.model';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

describe('WorkflowCardComponent', () => {
  let component: WorkflowCardComponent;
  let fixture: ComponentFixture<WorkflowCardComponent>;

  // Datos de prueba para el workflow
  const testWorkflow: Workflow = {
    id: '1',
    name: 'Test Workflow',
    description: 'This is a test description for the workflow',
    recentUpdates: 'These are the recent updates for the workflow',
    lastUpdated: new Date('2023-01-15')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, WorkflowCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowCardComponent);
    component = fixture.componentInstance;

    // Asignar el workflow de prueba al componente
    component.workflow = testWorkflow;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should receive the workflow input correctly', () => {
    expect(component.workflow).toEqual(testWorkflow);
  });

  // Añadir una prueba para inspeccionar la estructura del DOM
  it('should have the expected DOM structure', () => {
    // Imprimir la estructura del DOM para depuración
    console.log('DOM structure:', fixture.nativeElement.innerHTML);

    // Verificar que al menos existe un elemento que contiene el nombre del workflow
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Test Workflow');
  });

  it('should display the workflow name', () => {
    // Verificar que el texto del componente contiene el nombre del workflow
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Test Workflow');
  });

  it('should display the workflow description', () => {
    // Verificar que el texto del componente contiene la descripción del workflow
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('This is a test description');
  });

  it('should display the updates section', () => {
    // Verificar que el texto del componente contiene la palabra "Updates"
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Updates');

    // Verificar que se muestra la fecha de última actualización
    expect(textContent).toContain('Last Updated at');
  });

  it('should display the last updated date', () => {
    // Buscar cualquier elemento que contenga una fecha
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toMatch(/2023|Jan|15|January/);
  });

  it('should have a view button', () => {
    // Buscar botones con la clase btn-primary o view-button
    const viewButton = fixture.debugElement.query(By.css('.btn-primary, .view-button'));
    expect(viewButton).toBeTruthy();
    expect(viewButton.nativeElement.textContent.trim()).toBe('View');
  });

  it('should apply the correct CSS classes', () => {
    // Verificar que existe un elemento con la clase card
    const cardElement = fixture.debugElement.query(By.css('.card'));
    expect(cardElement).toBeTruthy();

    // Verificar que existe un elemento con la clase card-header
    const headerElement = fixture.debugElement.query(By.css('.card-header'));
    expect(headerElement).toBeTruthy();

    // Verificar que existe un elemento con la clase card-body
    const bodyElement = fixture.debugElement.query(By.css('.card-body'));
    expect(bodyElement).toBeTruthy();
  });
});
