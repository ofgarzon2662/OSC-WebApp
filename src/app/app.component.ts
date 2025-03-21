import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { filter } from 'rxjs/operators';
import { ArtifactsPreviewComponent } from './components/artifacts-preview/artifacts-preview.component';
import { WorkflowsPreviewComponent } from './components/workflows-preview/workflows-preview.component';
import { AuthService } from './services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgbModule,
    ArtifactsPreviewComponent,
    WorkflowsPreviewComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // Por ahora, esta propiedad es falsa, pero en el futuro
  // se actualizará basándose en el estado real de autenticación
  isAuthenticated = false;

  // Bandera para mostrar/ocultar el botón de volver atrás
  showBackButton = false;

  // Lista de rutas donde quieres mostrar el botón de retroceso
  private readonly routesWithBackButton: string[] = [
    '/auth/sign-in',
    // Puedes añadir más rutas aquí según necesites
    // '/otra-ruta',
    // '/otra-ruta/sub-ruta',
  ];

  constructor(
    public router: Router,
    private readonly location: Location,
    private readonly authService: AuthService,
    private readonly toastr: ToastrService
  ) {
    this.authService.isAuthenticated$.subscribe(
      isAuth => this.isAuthenticated = isAuth
    );
  }

  ngOnInit() {
    // Suscribirse a los eventos de navegación
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateBackButtonVisibility();
    });

    // Verificar al inicio
    this.updateBackButtonVisibility();
  }

  // Método para actualizar la visibilidad del botón de volver atrás
  private updateBackButtonVisibility() {
    const currentUrl = this.router.url;
    console.log('Current URL:', currentUrl);

    // Verificar si la URL actual está en la lista de rutas con botón de retroceso
    this.showBackButton = this.routesWithBackButton.some(route =>
      currentUrl.startsWith(route)
    );

    console.log('Show back button:', this.showBackButton);
  }

  // Método para verificar si estamos en una ruta de autenticación
  isAuthRoute(): boolean {
    return this.router.url.startsWith('/auth');
  }

  // Método para volver atrás
  goBack(): void {
    if (this.router.url.includes('/auth/')) {
      this.router.navigate(['/']); // Volver a la página principal desde auth
    } else {
      this.location.back(); // Comportamiento predeterminado del navegador
    }
  }

  // Método para cerrar sesión (implementación futura)
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toastr.success('Successfully signed out', 'Goodbye!');
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Still show success message since we're cleaning up the session anyway
        this.toastr.success('Successfully signed out', 'Goodbye!');
      }
    });
  }

  title = 'OSC-WebApp';
  logoError = false;

  onContributeClick(): void {
    if (!this.isAuthenticated) {
      this.toastr.info("We'd love to have your contribution, but first Sign in to continue", 'Welcome!');
      this.router.navigate(['/auth/sign-in']);
    } else {
      this.router.navigate(['/contribute']);
    }
  }

  onLogoError() {
    this.logoError = true;
    console.error('Error loading logo image');
  }
}
