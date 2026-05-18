import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ApiBaseService,
  ApiConfigService,
  ConfigSectionCardComponent,
  TemasToolbarComponent,
  pageSectionEnterAnimation,
} from '@proyectos-dti/shared-ui';
import { catchError, finalize, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SessionService } from '../../services/session.service';

interface UiPreferences {
  theme: string;
  fontScale: number;
  compactMode: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
}

interface NotificationPreferences {
  desktopEnabled: boolean;
  dueDateAlerts: boolean;
  remindersMinutes: number;
  soundEnabled: boolean;
}

interface WorkspacePreferences {
  defaultStartModule: string;
  temasPageSize: number;
  autoRefreshMinutes: number;
  showCompletedByDefault: boolean;
}

const UI_STORAGE_KEY = 'sisar.user.ui';
const NOTIFICATION_STORAGE_KEY = 'sisar.user.notifications';
const WORKSPACE_STORAGE_KEY = 'sisar.user.workspace';

const DEFAULT_UI_PREFS: UiPreferences = {
  theme: 'claro',
  fontScale: 100,
  compactMode: false,
  reduceMotion: false,
  highContrast: false,
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  desktopEnabled: true,
  dueDateAlerts: true,
  remindersMinutes: 30,
  soundEnabled: false,
};

const DEFAULT_WORKSPACE_PREFS: WorkspacePreferences = {
  defaultStartModule: 'temas',
  temasPageSize: 10,
  autoRefreshMinutes: 10,
  showCompletedByDefault: true,
};

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ToastModule,
    TemasToolbarComponent,
    ConfigSectionCardComponent,
  ],
  templateUrl: './configuracion-page.html',
  styleUrl: './configuracion-page.scss',
  animations: [pageSectionEnterAnimation],
})
export class ConfiguracionPage {
  private readonly apiConfig = inject(ApiConfigService);
  private readonly apiBase = inject(ApiBaseService);
  private readonly sessionService = inject(SessionService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly apiOptions = this.apiConfig.urlOptions;
  protected readonly loadingApiTest = signal(false);
  protected readonly testResult = signal<'idle' | 'ok' | 'error'>('idle');
  protected readonly tokenExpirationLabel = signal('Sin sesión');
  protected readonly advancedOptionsOpen = signal(false);
  protected readonly userDisplayName = signal('');
  protected readonly userRole = signal('');

  protected readonly endpointForm = this.fb.nonNullable.group({
    apiUrl: [this.apiConfig.getApiBaseUrl(), Validators.required],
    customApiUrl: [''],
  });

  protected readonly uiForm = this.fb.nonNullable.group({
    theme: [DEFAULT_UI_PREFS.theme, Validators.required],
    fontScale: [DEFAULT_UI_PREFS.fontScale, [Validators.required, Validators.min(90), Validators.max(130)]],
    compactMode: [DEFAULT_UI_PREFS.compactMode],
    reduceMotion: [DEFAULT_UI_PREFS.reduceMotion],
    highContrast: [DEFAULT_UI_PREFS.highContrast],
  });

  protected readonly notificationsForm = this.fb.nonNullable.group({
    desktopEnabled: [DEFAULT_NOTIFICATION_PREFS.desktopEnabled],
    dueDateAlerts: [DEFAULT_NOTIFICATION_PREFS.dueDateAlerts],
    remindersMinutes: [DEFAULT_NOTIFICATION_PREFS.remindersMinutes, [Validators.required, Validators.min(5), Validators.max(240)]],
    soundEnabled: [DEFAULT_NOTIFICATION_PREFS.soundEnabled],
  });

  protected readonly workspaceForm = this.fb.nonNullable.group({
    defaultStartModule: [DEFAULT_WORKSPACE_PREFS.defaultStartModule, Validators.required],
    temasPageSize: [DEFAULT_WORKSPACE_PREFS.temasPageSize, [Validators.required, Validators.min(5), Validators.max(100)]],
    autoRefreshMinutes: [DEFAULT_WORKSPACE_PREFS.autoRefreshMinutes, [Validators.required, Validators.min(0), Validators.max(120)]],
    showCompletedByDefault: [DEFAULT_WORKSPACE_PREFS.showCompletedByDefault],
  });

  protected readonly hasSession = computed(() => this.sessionService.hasSession());

  protected readonly themeOptions = [
    { label: 'Claro', value: 'claro' },
    { label: 'Suave', value: 'suave' },
    { label: 'Alto contraste', value: 'alto-contraste' },
  ];

  protected readonly startModuleOptions = [
    { label: 'Temas', value: 'temas' },
    { label: 'Tablero', value: 'dashboard' },
    { label: 'Catálogos', value: 'catalogos' },
  ];

  protected readonly pageSizeOptions = [
    { label: '10 registros', value: 10 },
    { label: '20 registros', value: 20 },
    { label: '50 registros', value: 50 },
  ];

  constructor() {
    this.loadPreferences();
    this.updateTokenExpirationLabel();
  }

  protected applySelectedEndpoint(): void {
    const selected = this.endpointForm.getRawValue().apiUrl;
    this.apiConfig.setApiBaseUrl(selected);
    this.messageService.add({
      severity: 'success',
      summary: 'Configuración actualizada',
      detail: 'Se aplicó el endpoint seleccionado.',
      life: 3000,
    });
  }

  protected applyCustomEndpoint(): void {
    const raw = this.endpointForm.getRawValue().customApiUrl.trim();
    if (!raw) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Endpoint vacío',
        detail: 'Escribe una URL antes de aplicar.',
        life: 3000,
      });
      return;
    }

    if (!/^https?:\/\//i.test(raw)) {
      this.messageService.add({
        severity: 'error',
        summary: 'URL inválida',
        detail: 'La URL debe iniciar con http:// o https://',
        life: 3500,
      });
      return;
    }

    this.apiConfig.setApiBaseUrl(raw);
    this.endpointForm.patchValue({ apiUrl: raw, customApiUrl: '' }, { emitEvent: false });
    this.messageService.add({
      severity: 'success',
      summary: 'Endpoint actualizado',
      detail: 'Se aplicó correctamente la URL personalizada.',
      life: 3000,
    });
  }

  protected testApiConnection(): void {
    this.loadingApiTest.set(true);
    this.testResult.set('idle');

    this.apiBase
      .get<unknown[]>('Catalogos/TIPO_PRIORIDAD')
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.loadingApiTest.set(false))
      )
      .subscribe((result) => {
        const ok = Array.isArray(result);
        this.testResult.set(ok ? 'ok' : 'error');
        this.messageService.add({
          severity: ok ? 'success' : 'error',
          summary: ok ? 'Conexión exitosa' : 'Conexión fallida',
          detail: ok
            ? 'El endpoint respondió correctamente.'
            : 'No se pudo validar conexión con el endpoint actual.',
          life: 3500,
        });
      });
  }

  protected saveUserConfiguration(): void {
    if (this.uiForm.invalid || this.notificationsForm.invalid || this.workspaceForm.invalid) {
      this.uiForm.markAllAsTouched();
      this.notificationsForm.markAllAsTouched();
      this.workspaceForm.markAllAsTouched();
      return;
    }

    this.persistPreferences(UI_STORAGE_KEY, this.uiForm.getRawValue());
    this.persistPreferences(NOTIFICATION_STORAGE_KEY, this.notificationsForm.getRawValue());
    this.persistPreferences(WORKSPACE_STORAGE_KEY, this.workspaceForm.getRawValue());

    this.messageService.add({
      severity: 'success',
      summary: 'Preferencias guardadas',
      detail: 'Tu configuración de usuario se actualizó correctamente.',
      life: 3000,
    });
  }

  protected restoreDefaults(): void {
    this.uiForm.reset(DEFAULT_UI_PREFS);
    this.notificationsForm.reset(DEFAULT_NOTIFICATION_PREFS);
    this.workspaceForm.reset(DEFAULT_WORKSPACE_PREFS);

    this.persistPreferences(UI_STORAGE_KEY, DEFAULT_UI_PREFS);
    this.persistPreferences(NOTIFICATION_STORAGE_KEY, DEFAULT_NOTIFICATION_PREFS);
    this.persistPreferences(WORKSPACE_STORAGE_KEY, DEFAULT_WORKSPACE_PREFS);

    this.messageService.add({
      severity: 'info',
      summary: 'Valores restaurados',
      detail: 'Se aplicaron los valores de usuario por defecto.',
      life: 3000,
    });
  }

  protected toggleAdvancedOptions(): void {
    this.advancedOptionsOpen.update((open) => !open);
  }

  protected clearSession(): void {
    this.sessionService.clearSession();
    this.updateTokenExpirationLabel();
    this.messageService.add({
      severity: 'warn',
      summary: 'Sesión cerrada',
      detail: 'Se eliminaron los tokens locales.',
      life: 2800,
    });
    void this.router.navigate(['']);
  }

  private loadPreferences(): void {
    const ui = this.readPreferences<UiPreferences>(UI_STORAGE_KEY, DEFAULT_UI_PREFS);
    const notifications = this.readPreferences<NotificationPreferences>(
      NOTIFICATION_STORAGE_KEY,
      DEFAULT_NOTIFICATION_PREFS
    );
    const workspace = this.readPreferences<WorkspacePreferences>(WORKSPACE_STORAGE_KEY, DEFAULT_WORKSPACE_PREFS);

    this.uiForm.reset(ui, { emitEvent: false });
    this.notificationsForm.reset(notifications, { emitEvent: false });
    this.workspaceForm.reset(workspace, { emitEvent: false });

    this.loadUserInfoFromToken();
  }

  private loadUserInfoFromToken(): void {
    const claims = this.getSessionClaims();
    const displayName = this.readClaim(claims, ['name', 'unique_name', 'preferred_username', 'sub']);
    const role = this.resolveUserRole(claims);
    this.userDisplayName.set(displayName || 'Usuario');
    this.userRole.set(role || 'Usuario');
  }

  private persistPreferences(key: string, prefs: unknown): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(prefs));
    } catch {
      // Ignorar storage bloqueado.
    }
  }

  private readPreferences<T extends object>(key: string, defaults: T): T {
    if (typeof window === 'undefined') {
      return defaults;
    }

    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        return defaults;
      }
      const parsed = JSON.parse(stored) as Partial<T>;
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  }

  private getSessionClaims(): Record<string, unknown> {
    const token = this.sessionService.getAccessToken();
    if (!token) {
      return {};
    }

    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      return {};
    }

    try {
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalized)) as Record<string, unknown>;
      return decoded;
    } catch {
      return {};
    }
  }

  private readClaim(claims: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = claims[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  }

  private resolveUserRole(claims: Record<string, unknown>): string {
    const roleCandidates: string[] = [];
    const rawCandidates = [
      claims['role'],
      claims['roles'],
      claims['Rol'],
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
    ];

    for (const raw of rawCandidates) {
      if (typeof raw === 'string') {
        roleCandidates.push(raw);
      }
      if (Array.isArray(raw)) {
        raw.forEach((item) => {
          if (typeof item === 'string') {
            roleCandidates.push(item);
          }
        });
      }
    }

    const allRoles = roleCandidates.map((value) => value.toLowerCase());
    if (allRoles.some((role) => role.includes('admin') || role.includes('superusuario'))) {
      return 'Superusuario';
    }
    return roleCandidates[0] || 'Usuario';
  }

  private updateTokenExpirationLabel(): void {
    const token = this.sessionService.getAccessToken();
    if (!token) {
      this.tokenExpirationLabel.set('Sin sesión');
      return;
    }

    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      this.tokenExpirationLabel.set('Token no legible');
      return;
    }

    try {
      const decoded = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
      const exp = Number(decoded?.exp ?? 0);
      if (!exp) {
        this.tokenExpirationLabel.set('Sin expiración informada');
        return;
      }
      const date = new Date(exp * 1000);
      this.tokenExpirationLabel.set(
        `Expira: ${date.toLocaleDateString('es-MX')} ${date.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      );
    } catch {
      this.tokenExpirationLabel.set('No se pudo leer la expiración');
    }
  }
}
