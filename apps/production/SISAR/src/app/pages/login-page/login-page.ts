import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginCard } from '@proyectos-dti/shared-ui';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginCard],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly router = inject(Router);

  protected navigateToDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }
}
