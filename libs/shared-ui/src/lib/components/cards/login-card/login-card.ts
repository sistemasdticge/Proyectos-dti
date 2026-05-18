import { Component, input, output, signal } from '@angular/core';

export interface LoginCredentials {
  login: string;
  password: string;
}

@Component({
  selector: 'lib-login-card',
  standalone: true,
  imports: [],
  templateUrl: './login-card.html',
  styleUrl: './login-card.css',
})
export class LoginCard {
  readonly loginRequested = output<LoginCredentials>();
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);

  protected readonly showPassword = signal(false);
  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly validationMessage = signal<string | null>(null);

  protected togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  protected onUsernameInput(value: string): void {
    this.username.set(value);
    this.validationMessage.set(null);
  }

  protected onPasswordInput(value: string): void {
    this.password.set(value);
    this.validationMessage.set(null);
  }

  protected requestLogin(event?: Event): void {
    event?.preventDefault();

    const login = this.username().trim();
    const password = this.password();

    if (!login || !password) {
      this.validationMessage.set('Ingresa usuario y contrasena para continuar.');
      return;
    }

    this.validationMessage.set(null);
    this.loginRequested.emit({ login, password });
  }
}
