import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

interface TokenPayload {
  username: string;
  sub: string;
  roles: string[];
  email: string;
  iat: number;
}

// Definimos los roles posibles
export enum UserRole {
  ADMIN = 'admin',
  COLLABORATOR = 'collaborator',
  PI = 'pi'
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    // Check if there's a token in localStorage on service initialization
    const token = localStorage.getItem('token');
    if (token) {
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('token', response.token);
            this.isAuthenticatedSubject.next(true);
          }
        })
      );
  }

  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      // If no token, just clean up and redirect
      this.cleanupSession();
      return new Observable(subscriber => {
        subscriber.complete();
      });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/logout`, {}, { headers })
      .pipe(
        tap(() => this.cleanupSession()),
        catchError(error => {
          // Even if the server request fails, we should clean up the local session
          this.cleanupSession();
          throw error;
        })
      );
  }

  private cleanupSession(): void {
    localStorage.removeItem('token');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Método para decodificar el token JWT
  private decodeToken(): TokenPayload | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      // Dividir el token en sus partes (header, payload, signature)
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      // Decodificar la parte del payload (Base64Url)
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload) as TokenPayload;
    } catch (e) {
      console.error('Error decoding token', e);
      return null;
    }
  }

  // Métodos relacionados con roles
  
  getUserRoles(): UserRole[] {
    const payload = this.decodeToken();
    if (!payload || !payload.roles) return [];
    
    // Convertir los roles del token a UserRole (asumiendo que coinciden con nuestro enum)
    return payload.roles.map(role => role.toLowerCase() as UserRole);
  }

  hasRole(role: UserRole): boolean {
    const roles = this.getUserRoles();
    return roles.includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isCollaborator(): boolean {
    return this.hasRole(UserRole.COLLABORATOR);
  }

  isPI(): boolean {
    return this.hasRole(UserRole.PI);
  }

  // Un usuario puede crear artifacts si tiene el rol COLLABORATOR o PI,
  // incluso si también tiene el rol ADMIN
  canCreateArtifact(): boolean {
    return this.isCollaborator() || this.isPI();
  }

  // Obtener el nombre de usuario del token
  getUsername(): string | null {
    const payload = this.decodeToken();
    return payload?.username || null;
  }

  // Obtener el email del usuario del token
  getUserEmail(): string | null {
    const payload = this.decodeToken();
    return payload?.email || null;
  }
}
