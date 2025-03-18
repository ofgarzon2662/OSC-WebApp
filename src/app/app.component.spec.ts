import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Component } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject, of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from './services/auth.service';

// Mock services
const mockToastr = {
  success: jasmine.createSpy('success'),
  error: jasmine.createSpy('error'),
  warning: jasmine.createSpy('warning'),
  info: jasmine.createSpy('info')
};

const mockAuthService = {
  logout: jasmine.createSpy('logout').and.returnValue(of({})),
  isAuthenticated$: of(false),
  getToken: jasmine.createSpy('getToken').and.returnValue('mock-token')
};

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
  let authService: AuthService;
  let toastrService: ToastrService;

  beforeEach(async () => {
    routerEventsSubject = new Subject<any>();

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([]),
        NgbModule,
        HttpClientTestingModule,
        AppComponent,
        MockArtifactsPreviewComponent,
        MockWorkflowsPreviewComponent
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastrService, useValue: mockToastr }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    authService = TestBed.inject(AuthService);
    toastrService = TestBed.inject(ToastrService);

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
      urlSpy.and.returnValue('/auth/sign-in');
      spyOn(router, 'navigate');
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should use location.back() for non-auth routes', () => {
      urlSpy.and.returnValue('/home');
      spyOn(location, 'back');
      component.goBack();
      expect(location.back).toHaveBeenCalled();
    });

    it('should handle successful logout', () => {
      spyOn(router, 'navigate');
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
      expect(toastrService.success).toHaveBeenCalledWith('Successfully signed out', 'Goodbye!');
    });

    it('should handle logout error gracefully', () => {
      const error = new Error('Logout failed');
      (authService.logout as jasmine.Spy).and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.logout();

      expect(console.error).toHaveBeenCalledWith('Logout error:', error);
      expect(toastrService.success).toHaveBeenCalledWith('Successfully signed out', 'Goodbye!');
    });
  });

  describe('Contribute Navigation', () => {
    it('should show info message and navigate to sign-in when not authenticated', () => {
      component.isAuthenticated = false;
      spyOn(router, 'navigate');

      component.onContributeClick();

      expect(toastrService.info).toHaveBeenCalledWith(
        "We'd love to have your contribution, but first Sign in to continue",
        'Welcome!'
      );
      expect(router.navigate).toHaveBeenCalledWith(['/auth/sign-in']);
    });

    it('should navigate to contribute page when authenticated', () => {
      component.isAuthenticated = true;
      spyOn(router, 'navigate');

      component.onContributeClick();

      expect(router.navigate).toHaveBeenCalledWith(['/contribute']);
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
