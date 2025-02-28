import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Component } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';

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
  let routerEventsSubject: Subject<any>;
  let urlSpy: jasmine.Spy<any>;

  beforeEach(async () => {
    routerEventsSubject = new Subject<any>();

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

    // Mock para router.events
    Object.defineProperty(router, 'events', {
      get: () => routerEventsSubject.asObservable()
    });

    // Configurar la URL actual para las pruebas
    urlSpy = spyOnProperty(router, 'url', 'get').and.returnValue('/');

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

  // Pruebas para los métodos no cubiertos
  describe('Navigation and Initialization', () => {
    it('should subscribe to navigation events in ngOnInit', () => {
      // Espiar el método updateBackButtonVisibility
      spyOn<any>(component, 'updateBackButtonVisibility');

      // Llamar a ngOnInit de nuevo para asegurarnos de que se ejecuta
      component.ngOnInit();

      // Simular un evento de navegación
      routerEventsSubject.next(new NavigationEnd(1, '/', '/'));

      // Verificar que se llamó al método updateBackButtonVisibility
      expect(component['updateBackButtonVisibility']).toHaveBeenCalled();
    });
  });

  describe('Navigation Methods', () => {
    it('should navigate to home when going back from auth route', () => {
      // Cambiar la URL a una ruta de autenticación
      urlSpy.and.returnValue('/auth/sign-in');

      // Espiar el método navigate del router
      spyOn(router, 'navigate');

      // Llamar al método goBack
      component.goBack();

      // Verificar que se navegó a la página principal
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should use location.back() for non-auth routes', () => {
      // Cambiar la URL a una ruta que no es de autenticación
      urlSpy.and.returnValue('/home');

      // Espiar el método back de location
      spyOn(location, 'back');

      // Llamar al método goBack
      component.goBack();

      // Verificar que se llamó a location.back()
      expect(location.back).toHaveBeenCalled();
    });

    it('should handle logout correctly', () => {
      // Establecer isAuthenticated a true inicialmente
      component.isAuthenticated = true;

      // Espiar el método navigate del router
      spyOn(router, 'navigate');

      // Llamar al método logout
      component.logout();

      // Verificar que isAuthenticated se estableció a false
      expect(component.isAuthenticated).toBeFalse();

      // Verificar que se navegó a la página principal
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('Error Handling', () => {
    it('should handle logo loading error', () => {
      // Espiar console.error
      spyOn(console, 'error');

      // Llamar al método onLogoError
      component.onLogoError();

      // Verificar que logoError se estableció a true
      expect(component.logoError).toBeTrue();

      // Verificar que se registró el error
      expect(console.error).toHaveBeenCalledWith('Error loading logo image');
    });
  });
});
