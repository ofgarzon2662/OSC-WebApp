import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { DebugElement } from '@angular/core';
import { Router } from '@angular/router';

import { SignInComponent } from './sign-in.component';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let debugElement: DebugElement;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SignInComponent,
        ReactiveFormsModule,
        FormsModule,
        RouterTestingModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    router = TestBed.inject(Router);
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

      component.signInForm.patchValue({
        username: '',
        password: ''
      });

      component.onSubmit();

      expect(router.navigate).not.toHaveBeenCalled();
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
  });
});
