import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importa otros módulos que necesites, como ReactiveFormsModule si usas formularios

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule], // Asegúrate de importar CommonModule y otros módulos necesarios
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent {
  // Tu código aquí
}
