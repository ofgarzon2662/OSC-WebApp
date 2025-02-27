import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArtifactCardComponent } from './artifact-card.component';
import { Artifact } from '../../../models/artifact.model';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

describe('ArtifactCardComponent', () => {
  let component: ArtifactCardComponent;
  let fixture: ComponentFixture<ArtifactCardComponent>;

  // Datos de prueba para el artefacto
  const testArtifact: Artifact = {
    id: '1',
    name: 'Test Artifact',
    description: 'This is a test description for the artifact',
    lastUpdated: new Date('2023-01-15')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, ArtifactCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ArtifactCardComponent);
    component = fixture.componentInstance;

    // Asignar el artefacto de prueba al componente
    component.artifact = testArtifact;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should receive the artifact input correctly', () => {
    expect(component.artifact).toEqual(testArtifact);
  });

  // Añadir una prueba para inspeccionar la estructura del DOM
  it('should have the expected DOM structure', () => {
    // Imprimir la estructura del DOM para depuración
    console.log('DOM structure:', fixture.nativeElement.innerHTML);

    // Verificar que al menos existe un elemento que contiene el nombre del artefacto
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Test Artifact');
  });

  it('should display the artifact name', () => {
    // Verificar que el texto del componente contiene el nombre del artefacto
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Test Artifact');
  });

  it('should display the artifact description', () => {
    // Verificar que el texto del componente contiene la descripción del artefacto
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('This is a test description');
  });

  it('should display the last updated date', () => {
    // Buscar cualquier elemento que contenga una fecha
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toMatch(/2023|Jan|15|January/);
  });

  it('should have a view button or link', () => {
    // Buscar botones o enlaces
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const links = fixture.debugElement.queryAll(By.css('a'));

    // Verificar que existe al menos un botón o enlace
    expect(buttons.length + links.length).toBeGreaterThan(0);
  });

  it('should apply some CSS classes', () => {
    // Verificar que existe al menos un elemento con alguna clase
    const elementsWithClass = fixture.debugElement.queryAll(By.css('[class]'));
    expect(elementsWithClass.length).toBeGreaterThan(0);
  });
});
