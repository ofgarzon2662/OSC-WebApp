import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Component } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// Crear componentes mock como standalone
@Component({
  selector: 'app-artifacts-preview',
  template: '',
  standalone: true
})
class MockArtifactsPreviewComponent {}

@Component({
  selector: 'app-workflows-preview',
  template: '',
  standalone: true
})
class MockWorkflowsPreviewComponent {}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([]), // Configurar con rutas vacías
        NgbModule, // Añadir NgbModule si el componente lo usa
        AppComponent,
        MockArtifactsPreviewComponent,
        MockWorkflowsPreviewComponent
      ],
      declarations: []
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;

    // Configurar la URL actual para las pruebas
    spyOnProperty(router, 'url', 'get').and.returnValue('/');

    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have a navbar', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('nav')).toBeTruthy();
  });

  it('should display the logo', () => {
    const compiled = fixture.nativeElement;
    const logo = compiled.querySelector('img');
    expect(logo).toBeTruthy();
    expect(logo.src).toContain('assets/images/OpenScienceChain_logo_horiz_white.png');
  });

  it('should have Contribute and Sign in links', () => {
    const compiled = fixture.nativeElement;
    const links = compiled.querySelectorAll('a');

    // Verificar que existan al menos dos enlaces
    expect(links.length).toBeGreaterThanOrEqual(2);

    // Usar forEach para construir el array de textos
    const linkTexts = Array.from<Element, string>(links, (link) =>
      (link as HTMLAnchorElement).textContent?.trim() ?? '');

    expect(linkTexts).toContain('Contribute');
    expect(linkTexts).toContain('Sign in');
  });

  it('should include artifacts-preview component', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-artifacts-preview')).toBeTruthy();
  });

  it('should include workflows-preview component', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-workflows-preview')).toBeTruthy();
  });
});
