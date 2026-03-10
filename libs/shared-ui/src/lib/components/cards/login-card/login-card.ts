import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'lib-login-card',
  standalone: true,
  imports: [],
  templateUrl: './login-card.html',
  styleUrl: './login-card.css',
})
export class LoginCard {
  readonly loginRequested = output<void>();

  protected readonly showPassword = signal(false);

  protected togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  protected requestLogin(): void {
    this.loginRequested.emit();
  }
}
