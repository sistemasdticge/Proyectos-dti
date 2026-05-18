import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoginCard, LoginCredentials } from '@proyectos-dti/shared-ui';
import { SessionService } from '../../services/session.service';

const JUST_LOGGED_IN_KEY = 'sisar.justLoggedIn';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginCard],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected onLoginRequested(credentials: LoginCredentials): void {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.sessionService
      .login({ login: credentials.login, password: credentials.password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          sessionStorage.setItem(JUST_LOGGED_IN_KEY, '1');
          void this.router.navigate(['/app/dashboard']);
        },
        error: (error: { status?: number; message?: string; detail?: string }) => {
          this.loading.set(false);
          if (error?.status === 401) {
            this.errorMessage.set('Credenciales invalidas. Verifica usuario y contrasena.');
            return;
          }

          this.errorMessage.set(error?.detail || error?.message || 'No fue posible iniciar sesion.');
        },
      });
  }
}
