import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
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
      // Aquí normalmente llamarías a un servicio de autenticación
      console.log('Form submitted:', this.signInForm.value);

      // No hacemos nada más, solo registramos en consola
      console.log('Login successful (no redirect)');

      // Comentamos la navegación para que no haga nada
      // try {
      //   this.router.navigate(['/home']).then(
      //     navigated => console.log('Navigation result:', navigated)
      //   ).catch(err => console.error('Navigation error:', err));
      // } catch (error) {
      //   console.error('Error during navigation:', error);
      // }
    } else {
      console.log('Form is invalid');
    }
  }
}
