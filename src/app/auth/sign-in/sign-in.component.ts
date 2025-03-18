import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
// Importa otros módulos que necesites, como ReactiveFormsModule si usas formularios

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule], // Asegúrate de importar CommonModule, FormsModule y ReactiveFormsModule y otros módulos necesarios
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent {
  signInForm: FormGroup;
  showForgotMessage = false;
  isLoading = false;
  invalidCredentials = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly toastr: ToastrService
  ) {
    this.signInForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    // Marcar todos los campos como tocados para mostrar errores de validación
    Object.keys(this.signInForm.controls).forEach(key => {
      const control = this.signInForm.get(key);
      control?.markAsTouched();
    });

    console.log('onSubmit called - Form valid:', this.signInForm.valid);

    if (this.signInForm.valid) {
      this.isLoading = true;
      this.invalidCredentials = false;
      const { username, password } = this.signInForm.value;

      this.authService.login(username, password).subscribe({
        next: () => {
          this.toastr.success('Successfully signed in!', 'Welcome');
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Login error:', error);
          this.invalidCredentials = true;
          this.toastr.error(
            error.error?.message || 'Invalid credentials',
            'Login Failed'
          );
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      console.log('Form is invalid');
      this.toastr.warning('Please fill in all required fields', 'Form Invalid');
    }
  }

  onForgotCredentials(event: Event): void {
    // Prevenir el comportamiento predeterminado del enlace
    event.preventDefault();

    // Mostrar el mensaje
    this.showForgotMessage = true;
    this.toastr.info('Please contact support for assistance', 'Password Recovery');

    console.log('Forgot credentials link clicked');
  }
}
