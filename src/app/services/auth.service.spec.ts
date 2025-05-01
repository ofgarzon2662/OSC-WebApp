import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  const apiUrl = `${environment.apiUrl}/users`;

  beforeEach(() => {
    localStorage.clear(); // Ensure clean state before each test
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
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

    it('should initialize as authenticated when token exists', () => {
      localStorage.setItem('token', 'test-token');
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, RouterTestingModule],
        providers: [AuthService]
      });
      const service = TestBed.inject(AuthService);
      expect(service.isAuthenticated()).toBeTrue();
    });
  });

  describe('login', () => {
    const mockLoginResponse = {
      access_token: 'test-token',
      user: { username: 'testuser', role: 'user' }
    };

    it('should send POST request and store token', () => {
      service.login('testuser', 'password123').subscribe(response => {
        expect(response).toEqual(mockLoginResponse);
        expect(localStorage.getItem('token')).toBe('test-token');
        expect(localStorage.getItem('user')).toBe(JSON.stringify(mockLoginResponse.user));
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
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ username: 'testuser', role: 'user' }));
      service['isAuthenticatedSubject'].next(true);
    });

    it('should send POST request and clear session when token exists', () => {
      spyOn(router, 'navigate');

      service.logout().subscribe(() => {
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(service.isAuthenticated()).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
      });

      const req = httpMock.expectOne(`${apiUrl}/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('should just clear session when no token exists', () => {
      localStorage.clear();
      spyOn(router, 'navigate');

      service.logout().subscribe(() => {
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(service.isAuthenticated()).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
      });

      // Verify no HTTP request was made
      httpMock.expectNone(`${apiUrl}/logout`);
    });

    it('should clear session even if logout request fails', () => {
      spyOn(router, 'navigate');

      service.logout().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          expect(localStorage.getItem('token')).toBeNull();
          expect(localStorage.getItem('user')).toBeNull();
          expect(service.isAuthenticated()).toBeFalse();
          expect(router.navigate).toHaveBeenCalledWith(['/']);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/logout`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getToken', () => {
    it('should return token when it exists', () => {
      localStorage.setItem('token', 'test-token');
      expect(service.getToken()).toBe('test-token');
    });

    it('should return null when no token exists', () => {
      localStorage.clear();
      expect(service.getToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when authenticated', () => {
      service['isAuthenticatedSubject'].next(true);
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return false when not authenticated', () => {
      service['isAuthenticatedSubject'].next(false);
      expect(service.isAuthenticated()).toBeFalse();
    });
  });
});
