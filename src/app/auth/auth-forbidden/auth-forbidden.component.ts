import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-auth-forbidden',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './auth-forbidden.component.html',
  styleUrls: ['./auth-forbidden.component.css']
})
export class AuthForbiddenComponent {
  // Esta página solo se muestra a usuarios autenticados que no tienen permisos 
  // para crear artifacts, así que no necesitamos verificar nada aquí
} 