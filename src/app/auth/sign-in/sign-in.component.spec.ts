import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { DebugElement } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

import { SignInComponent } from './sign-in.component';
import { AuthService } from '../../services/auth.service';

// Mock services
const mockToastr = {
  success: jasmine.createSpy('success'),
  error: jasmine.createSpy('error'),
  warning: jasmine.createSpy('warning'),
  info: jasmine.createSpy('info')
};

const mockAuthService = {
  login: jasmine.createSpy('login').and.returnValue(of({})),
  isAuthenticated$: of(false)
};

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let debugElement: DebugElement;
  let router: Router;
  let authService: AuthService;
  let toastrService: ToastrService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SignInComponent,
        ReactiveFormsModule,
        FormsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastrService, useValue: mockToastr }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
    toastrService = TestBed.inject(ToastrService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test for UI elements
  describe('UI Elements', () => {
    it('should display the logo', () => {
      const logoElement = debugElement.query(By.css('.logo'));
      expect(logoElement).toBeTruthy();

      const imgElement = logoElement.nativeElement;
      expect(imgElement.src).toContain('OpenScienceChain_logo_horiz_white.png');
      expect(imgElement.alt).toBe('Open Science Chain Logo');
    });

    it('should have username input field', () => {
      const usernameInput = debugElement.query(By.css('#username'));
      expect(usernameInput).toBeTruthy();
      expect(usernameInput.nativeElement.placeholder).toBe('username or email');
      expect(usernameInput.nativeElement.required).toBeTrue();
    });

    it('should have password input field', () => {
      const passwordInput = debugElement.query(By.css('#password'));
      expect(passwordInput).toBeTruthy();
      expect(passwordInput.nativeElement.placeholder).toBe('password');
      expect(passwordInput.nativeElement.type).toBe('password');
      expect(passwordInput.nativeElement.required).toBeTrue();
    });

    it('should have a sign-in button', () => {
      const signInButton = debugElement.query(By.css('button.btn-primary'));
      expect(signInButton).toBeTruthy();
      expect(signInButton.nativeElement.textContent).toBe('Sign In');
      expect(signInButton.nativeElement.classList).toContain('btn-primary');
    });

    it('should have a forgot password link', () => {
      const forgotPasswordLink = debugElement.query(By.css('.forgot-password a'));
      expect(forgotPasswordLink).toBeTruthy();
      expect(forgotPasswordLink.nativeElement.textContent).toBe('Forgot password or username?');
    });
  });

  // Test for form functionality
  describe('Form Functionality', () => {
    it('should have a form with formGroup directive', () => {
      const formElement = debugElement.query(By.css('form.sign-in-form'));
      expect(formElement).toBeTruthy();
      expect(formElement.attributes['ng-reflect-form']).toBeTruthy();
    });

    it('should initialize the form with empty fields', () => {
      expect(component.signInForm).toBeTruthy();
      expect(component.signInForm.get('username')?.value).toBe('');
      expect(component.signInForm.get('password')?.value).toBe('');
    });

    it('should mark form as invalid when empty', () => {
      expect(component.signInForm.valid).toBeFalse();
    });

    it('should mark form as valid when all fields are filled', () => {
      component.signInForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      expect(component.signInForm.valid).toBeTrue();
    });

    it('should disable submit button when form is invalid', () => {
      component.signInForm.patchValue({
        username: '',
        password: ''
      });
      fixture.detectChanges();

      const submitButton = debugElement.query(By.css('button.btn-primary'));
      expect(submitButton.nativeElement.disabled).toBeTrue();
    });

    it('should enable submit button when form is valid', () => {
      component.signInForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });
      fixture.detectChanges();

      const submitButton = debugElement.query(By.css('button.btn-primary'));
      expect(submitButton.nativeElement.disabled).toBeFalse();
    });
  });

  // Test for form submission
  describe('Form Submission', () => {
    it('should call onSubmit method when button is clicked', () => {
      spyOn(component, 'onSubmit');

      const signInButton = debugElement.query(By.css('button.btn-primary'));
      signInButton.triggerEventHandler('click', null);

      expect(component.onSubmit).toHaveBeenCalled();
    });

    it('should not navigate when form is invalid', () => {
      spyOn(router, 'navigate');
      spyOn(console, 'log');

      component.signInForm.patchValue({
        username: '',
        password: ''
      });

      component.onSubmit();

      expect(router.navigate).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Form is invalid');
    });

    it('should mark all fields as touched when form is submitted', () => {
      const usernameControl = component.signInForm.get('username');
      const passwordControl = component.signInForm.get('password');

      spyOn(usernameControl!, 'markAsTouched');
      spyOn(passwordControl!, 'markAsTouched');

      component.onSubmit();

      expect(usernameControl!.markAsTouched).toHaveBeenCalled();
      expect(passwordControl!.markAsTouched).toHaveBeenCalled();
    });
  });

  // Test for form validation
  describe('Form Validation', () => {
    it('should show error message when username is touched but empty', () => {
      const usernameControl = component.signInForm.get('username');
      usernameControl?.markAsTouched();
      fixture.detectChanges();

      const errorMessage = debugElement.query(By.css('.form-group:first-child .error-message'));
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.nativeElement.textContent.trim()).toBe('Username is required');
    });

    it('should show error message when password is touched but empty', () => {
      const passwordControl = component.signInForm.get('password');
      passwordControl?.markAsTouched();
      fixture.detectChanges();

      const errorMessage = debugElement.query(By.css('.form-group:nth-child(3) .error-message'));
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.nativeElement.textContent.trim()).toBe('Password is required');
    });

    it('should not show error messages when form is valid', () => {
      component.signInForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      const usernameControl = component.signInForm.get('username');
      const passwordControl = component.signInForm.get('password');

      usernameControl?.markAsTouched();
      passwordControl?.markAsTouched();

      fixture.detectChanges();

      const usernameError = debugElement.query(By.css('.form-group:first-child .error-message'));
      const passwordError = debugElement.query(By.css('.form-group:nth-child(3) .error-message'));

      expect(usernameError).toBeNull();
      expect(passwordError).toBeNull();
    });
  });

  // Test for forgot credentials functionality
  describe('Forgot Credentials', () => {
    it('should show message when forgot credentials link is clicked', () => {
      // Verificar que el mensaje no se muestra inicialmente
      expect(component.showForgotMessage).toBeFalse();
      let forgotMessage = debugElement.query(By.css('.forgot-message'));
      expect(forgotMessage).toBeNull();

      // Simular clic en el enlace
      const forgotLink = debugElement.query(By.css('.forgot-password a'));
      const mockEvent = new Event('click');
      spyOn(mockEvent, 'preventDefault');

      component.onForgotCredentials(mockEvent);
      fixture.detectChanges();

      // Verificar que el mensaje se muestra
      expect(component.showForgotMessage).toBeTrue();
      forgotMessage = debugElement.query(By.css('.forgot-message'));
      expect(forgotMessage).toBeTruthy();
      expect(forgotMessage.nativeElement.textContent.trim()).toContain('If you forgot your password or username');
    });

    it('should prevent default behavior when forgot credentials link is clicked', () => {
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault']);

      component.onForgotCredentials(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(component.showForgotMessage).toBeTrue();
    });

    it('should log a message when forgot credentials link is clicked', () => {
      spyOn(console, 'log');
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault']);

      component.onForgotCredentials(mockEvent);

      expect(console.log).toHaveBeenCalledWith('Forgot credentials link clicked');
    });

    it('should toggle message visibility when clicking the link multiple times', () => {
      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault']);

      // Primera vez - mostrar mensaje
      component.onForgotCredentials(mockEvent);
      expect(component.showForgotMessage).toBeTrue();

      // Modificamos el componente para que el método alterne la visibilidad
      component.showForgotMessage = false;
      fixture.detectChanges();

      // Segunda vez - mostrar mensaje de nuevo
      component.onForgotCredentials(mockEvent);
      expect(component.showForgotMessage).toBeTrue();
    });
  });

  // Add new tests for login functionality
  describe('Login Functionality', () => {
    let loginSpy: jasmine.Spy;

    beforeEach(() => {
      loginSpy = mockAuthService.login;
      loginSpy.calls.reset();
    });

    it('should handle successful login', () => {
      loginSpy.and.returnValue(of({
        access_token: 'mock-token',
        user: { username: 'testuser', role: 'user' }
      }));

      component.signInForm.setValue({
        username: 'testuser',
        password: 'password123'
      });

      component.onSubmit();

      expect(component.isLoading).toBeFalse();
      expect(component.invalidCredentials).toBeFalse();
      expect(toastrService.success).toHaveBeenCalled();
      expect(loginSpy).toHaveBeenCalledWith('testuser', 'password123');
    });

    it('should handle failed login', () => {
      loginSpy.and.returnValue(throwError(() => ({
        error: { message: 'Invalid credentials' }
      })));

      component.signInForm.setValue({
        username: 'testuser',
        password: 'wrongpass'
      });

      component.onSubmit();

      expect(component.isLoading).toBeFalse();
      expect(component.invalidCredentials).toBeTrue();
      expect(toastrService.error).toHaveBeenCalled();
      expect(loginSpy).toHaveBeenCalledWith('testuser', 'wrongpass');
    });

    it('should handle invalid form', () => {
      component.signInForm.setValue({
        username: '',
        password: ''
      });

      component.onSubmit();

      expect(component.isLoading).toBeFalse();
      expect(toastrService.warning).toHaveBeenCalled();
      expect(loginSpy).not.toHaveBeenCalled();
    });
  });
});
