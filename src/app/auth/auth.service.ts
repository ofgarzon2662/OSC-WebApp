import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError, of } from 'rxjs';
import { getApiBaseUrl } from '../config/runtime-config';
import { Router } from '@angular/router';

interface TokenPayload {
  username: string;
  sub: string;
  roles: string[];
  email: string;
  iat: number;
  exp?: number; // Expiration timestamp (standard JWT claim)
}

// Definimos los roles posibles
export enum UserRole {
  ADMIN = 'admin',
  COLLABORATOR = 'collaborator',
  PI = 'pi'
}

// Token storage structure
interface StoredTokenData {
  token: string;
  expiresAt: number; // Timestamp in milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${getApiBaseUrl()}/users`;
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private tokenCheckInterval: any = null;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    this.initializeAuthState();
    
    // Set up periodic token validation (every 5 minutes)
    this.setupTokenRefreshCheck();
  }

  /**
   * Initialize authentication state on service creation
   */
  private initializeAuthState(): void {
    try {
      // Get stored token data
      const storedData = this.getStoredTokenData();
      
      if (!storedData) {
        // No token found
        return;
      }
      
      // Check local expiration
      if (this.isTokenExpiredLocally(storedData)) {
        console.log('Token expired locally, cleaning up session');
        this.cleanupSession();
        return;
      }
      
      // Decode and validate token structure
      const payload = this.decodeToken();
      if (!payload) {
        console.log('Token could not be decoded, cleaning up session');
        this.cleanupSession();
        return;
      }
      
      // Check JWT expiration if available
      if (payload.exp && this.isJwtTokenExpired(payload)) {
        console.log('JWT token expired, cleaning up session');
        this.cleanupSession();
        return;
      }
      
      // If we reach here, token is valid locally - set authenticated state
      this.isAuthenticatedSubject.next(true);
      
      // Backend validation (if backend is available)
      this.validateTokenWithBackend().subscribe({
        error: (err) => {
          console.error('Backend token validation failed:', err);
          this.cleanupSession();
        }
      });
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.cleanupSession();
    }
  }

  /**
   * Setup periodic token validation check
   */
  private setupTokenRefreshCheck(): void {
    // Clear any existing interval
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
    
    // In test environments, setInterval might be replaced by Jasmine clock mock
    try {
      // Check token validity every 5 minutes
      this.tokenCheckInterval = setInterval(() => {
        if (this.isAuthenticatedSubject.value) {
          this.validateTokenLocallyAndWithBackend();
        }
      }, 5 * 60 * 1000); // 5 minutes
    } catch (e) {
      console.warn('Error setting up token refresh timer:', e);
      // Avoid breaking the app - we'll still validate on navigation and other actions
    }
  }

  /**
   * Validate token both locally and with backend
   */
  private validateTokenLocallyAndWithBackend(): void {
    // First check locally
    const storedData = this.getStoredTokenData();
    
    if (!storedData || this.isTokenExpiredLocally(storedData)) {
      this.cleanupSession();
      return;
    }
    
    // Then check with backend if available
    this.validateTokenWithBackend().subscribe({
      error: () => this.cleanupSession()
    });
  }

  /**
   * Validate token with backend
   */
  private validateTokenWithBackend(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Simple validation endpoint call - could be a dedicated endpoint or any authenticated endpoint
    return this.http.get(`${this.apiUrl}/validate-token`, { headers })
      .pipe(
        catchError(error => {
          // If error is 401 or 403, token is invalid
          if (error.status === 401 || error.status === 403) {
            return throwError(() => new Error('Invalid token'));
          }
          
          // For other errors (like network errors), we'll assume token might still be valid
          // to prevent logging users out when backend is temporarily unavailable
          return of(true);
        })
      );
  }

  /**
   * Check if token is expired based on local storage expiration
   */
  private isTokenExpiredLocally(storedData: StoredTokenData): boolean {
    const currentTime = Date.now();
    return storedData.expiresAt < currentTime;
  }

  /**
   * Check if JWT token is expired based on exp claim
   */
  private isJwtTokenExpired(payload: TokenPayload): boolean {
    if (!payload.exp) return false;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  /**
   * Get stored token data from localStorage
   */
  private getStoredTokenData(): StoredTokenData | null {
    try {
      const storedDataStr = localStorage.getItem('tokenData');
      if (!storedDataStr) return null;
      
      const parsedData = JSON.parse(storedDataStr) as StoredTokenData;
      
      // Validate required properties exist
      if (!parsedData.token || typeof parsedData.expiresAt !== 'number') {
        // If data is invalid, clean up and return null
        localStorage.removeItem('tokenData');
        return null;
      }
      
      return parsedData;
    } catch (e) {
      console.error('Error parsing stored token data:', e);
      // Clean up corrupt data
      localStorage.removeItem('tokenData');
      return null;
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          if (response.token) {
            // Store token with expiration (default 24 hours if not in JWT)
            this.storeTokenWithExpiration(response.token);
            this.isAuthenticatedSubject.next(true);
          }
        })
      );
  }

  /**
   * Store token with expiration time
   */
  private storeTokenWithExpiration(token: string): void {
    // Try to get expiration from JWT token
    let expiresAtMs = Date.now() + (24 * 60 * 60 * 1000); // Default: 24 hours from now
    
    try {
      const payload = this.parseJwt(token);
      if (payload?.exp) {
        // exp is in seconds, convert to milliseconds
        expiresAtMs = payload.exp * 1000;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Could not parse JWT expiration: ${errorMessage}. Using default expiration time.`);
      console.error('JWT Parsing Error:', error);
    }
    
    // Store token and expiration
    const tokenData: StoredTokenData = {
      token: token,
      expiresAt: expiresAtMs
    };
    
    localStorage.setItem('tokenData', JSON.stringify(tokenData));
    localStorage.setItem('token', token); // Keep for backward compatibility
  }

  /**
   * Parse JWT token payload without verification
   */
  private parseJwt(token: string): any {
    try {
      // Validation checks
      if (!token || typeof token !== 'string') {
        console.warn('Invalid token format: token is null, undefined, or not a string');
        return null;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format: token should have 3 parts');
        return null;
      }
      
      const base64Url = parts[1];
      if (!base64Url) {
        console.warn('Invalid token format: payload part is empty');
        return null;
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error parsing JWT token:', e);
      return null;
    }
  }

  logout(): Observable<any> {
    const token = this.getToken();
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
    localStorage.removeItem('tokenData');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    const storedData = this.getStoredTokenData();
    if (!storedData) {
      // Fall back to legacy token storage
      return localStorage.getItem('token');
    }
    
    // Check expiration before returning
    if (this.isTokenExpiredLocally(storedData)) {
      this.cleanupSession();
      return null;
    }
    
    return storedData.token;
  }

  isAuthenticated(): boolean {
    // Check token validity before returning authenticated state
    const storedData = this.getStoredTokenData();
    if (!storedData || this.isTokenExpiredLocally(storedData)) {
      this.cleanupSession();
      return false;
    }
    
    return this.isAuthenticatedSubject.value;
  }

  // Método para decodificar el token JWT
  private decodeToken(): TokenPayload | null {
    const token = this.getToken();
    if (!token) return null;
    
    return this.parseJwt(token) as TokenPayload;
  }

  // Métodos relacionados con roles
  
  getUserRoles(): UserRole[] {
    const payload = this.decodeToken();
    if (!payload?.roles) return [];
    
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
    return payload?.username ?? null;
  }

  // Obtener el email del usuario del token
  getUserEmail(): string | null {
    const payload = this.decodeToken();
    return payload?.email ?? null;
  }
}
