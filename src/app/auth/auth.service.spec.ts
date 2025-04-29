import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthService, UserRole } from './auth.service';
import { environment } from '../../environments/environment';
import { take } from 'rxjs/operators';

// Add Jasmine types
declare const jasmine: any;

interface MockJwtPayload {
  username: string;
  sub: string;
  roles: string[];
  email: string;
  iat: number;
  exp?: number;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  const apiUrl = `${environment.apiUrl}/users`;
  
  // Mock JWT token for testing
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGVzIjpbImFkbWluIl0sImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTE2MjM5MDIyfQ.wS5IfBSHJ6vJ0NuRFU3NxOTYHs39JbCd5fNi8BD33Xx';

  // Helper function to set a valid token with expiration
  function setValidTokenData(): void {
    // Create a valid token that won't expire for a day
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
    const tokenData = {
      token: mockToken,
      expiresAt: expiresAt
    };
    localStorage.setItem('tokenData', JSON.stringify(tokenData));
    localStorage.setItem('token', mockToken); // For backward compatibility
  }

  // Helper to create a mock JWT token with valid payload
  function setValidJwtToken(): void {
    const payload = {
      username: 'testuser',
      sub: 'user123',
      roles: ['admin'],
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
    };
    
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = 'fake_signature';
    const token = `${header}.${encodedPayload}.${signature}`;
    
    const tokenData = {
      token: token,
      expiresAt: payload.exp * 1000
    };
    
    localStorage.setItem('tokenData', JSON.stringify(tokenData));
    localStorage.setItem('token', token);
  }

  beforeEach(() => {
    localStorage.clear(); // Ensure clean state before each test
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    expect(service).toBeTruthy();
  });

  describe('Constructor', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
    });

    it('should initialize as not authenticated when no token exists', () => {
      localStorage.clear();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, RouterTestingModule],
        providers: [AuthService]
      });
      const service = TestBed.inject(AuthService);
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should initialize as authenticated when token exists', (done) => {
      // Set a valid JWT token with proper structure and expiration
      setValidTokenData();
      
      // Mock the backend validation to return success
      const mockValidateResponse = { valid: true };
      
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, RouterTestingModule],
        providers: [AuthService]
      });
      
      const service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);
      
      // We need to wait for the auth state to be initialized
      // The service triggers isAuthenticated$ observable when auth state changes
      service.isAuthenticated$.pipe(take(1)).subscribe(isAuthenticated => {
        expect(isAuthenticated).toBeTrue();
        
        // Now handle the backend validation request that might have been made
        const requests = httpMock.match(`${apiUrl}/validate-token`);
        if (requests.length > 0) {
          // If a validation request was made, respond with success
          requests.forEach(req => {
            expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
            req.flush({ valid: true });
          });
        }
        
        // Verify the final authenticated state
        expect(service.isAuthenticated()).toBeTrue();
        done();
      });
    });
  });

  describe('login', () => {
    const mockLoginResponse = {
      token: mockToken
    };

    beforeEach(() => {
      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);
      router = TestBed.inject(Router);
    });

    it('should send POST request and store token', () => {
      service.login('testuser', 'password123').subscribe(response => {
        expect(response).toEqual(mockLoginResponse);
        
        // Check that token is stored with the new mechanism
        const storedDataStr = localStorage.getItem('tokenData');
        expect(storedDataStr).toBeTruthy();
        
        if (storedDataStr) {
          const storedData = JSON.parse(storedDataStr);
          expect(storedData.token).toBe(mockToken);
          expect(storedData.expiresAt).toBeGreaterThan(Date.now());
        }
        
        // Old token should also be stored for backward compatibility
        expect(localStorage.getItem('token')).toBe(mockToken);
        
        expect(service.isAuthenticated()).toBeTrue();
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'testuser', password: 'password123' });
      req.flush(mockLoginResponse);
    });

    it('should handle login error', () => {
      service.login('testuser', 'wrongpass').subscribe({
        error: (error) => {
          expect(error.error.message).toBe('Invalid credentials');
          expect(service.isAuthenticated()).toBeFalse();
          expect(localStorage.getItem('token')).toBeNull();
          expect(localStorage.getItem('tokenData')).toBeNull();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);
      router = TestBed.inject(Router);
      setValidTokenData();
      service['isAuthenticatedSubject'].next(true);
    });

    it('should send POST request and clear session when token exists', () => {
      spyOn(router, 'navigate');

      service.logout().subscribe(() => {
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('tokenData')).toBeNull();
        expect(service.isAuthenticated()).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
      });

      const req = httpMock.expectOne(`${apiUrl}/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should just clear session when no token exists', () => {
      localStorage.clear();
      service['isAuthenticatedSubject'].next(false);
      spyOn(router, 'navigate');

      service.logout().subscribe(() => {
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('tokenData')).toBeNull();
        expect(service.isAuthenticated()).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
      });

      // Add expectation to satisfy the warning
      expect(localStorage.getItem('tokenData')).toBeNull();

      // Verify no HTTP request was made
      httpMock.expectNone(`${apiUrl}/logout`);
    });

    it('should clear session even if logout request fails', () => {
      spyOn(router, 'navigate');

      service.logout().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          expect(localStorage.getItem('token')).toBeNull();
          expect(localStorage.getItem('tokenData')).toBeNull();
          expect(service.isAuthenticated()).toBeFalse();
          expect(router.navigate).toHaveBeenCalledWith(['/']);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/logout`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getToken', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('should return token when it exists in new format', () => {
      setValidTokenData();
      expect(service.getToken()).toBe(mockToken);
    });

    it('should return token when it exists in old format', () => {
      localStorage.setItem('token', mockToken);
      expect(service.getToken()).toBe(mockToken);
    });

    it('should return null when no token exists', () => {
      localStorage.clear();
      expect(service.getToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('should return true when authenticated', () => {
      // Setup proper token data
      setValidTokenData();
      service['isAuthenticatedSubject'].next(true);
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return false when not authenticated', () => {
      service['isAuthenticatedSubject'].next(false);
      expect(service.isAuthenticated()).toBeFalse();
    });
  });
});
