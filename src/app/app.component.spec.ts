import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Component } from '@angular/core';

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Mover AppComponent al array imports ya que es un componente standalone
      imports: [
        AppComponent,
        MockArtifactsPreviewComponent,
        MockWorkflowsPreviewComponent
      ],
      // El array declarations queda vacío
      declarations: []
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
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
    const linkTexts: string[] = [];
    links.forEach((link: HTMLAnchorElement) => {
      linkTexts.push(link.textContent?.trim() || '');
    });

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
