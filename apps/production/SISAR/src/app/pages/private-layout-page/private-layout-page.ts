import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {
  SidebarComponent,
  SidebarItem,
  TopNavbarComponent,
  TopNavbarConfig,
  TopNavbarSearchEvent,
} from '@proyectos-dti/shared-ui';
import { NotificationService } from '../../services/notification.service';
import { SessionService } from '../../services/session.service';

const JUST_LOGGED_IN_KEY = 'sisar.justLoggedIn';

@Component({
  selector: 'app-private-layout-page',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopNavbarComponent],
  templateUrl: './private-layout-page.html',
  styleUrl: './private-layout-page.scss',
})
export class PrivateLayoutPage implements OnInit {
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);
  private readonly notificationService = inject(NotificationService);

  protected readonly userDisplayName = signal('Usuario');
  protected readonly userRole = signal('Usuario');
  protected readonly isSuperUser = signal(false);
  protected readonly isAdmin = signal(false);
  protected readonly isStandardUser = signal(true);

  protected readonly topNavbarConfig = computed((): TopNavbarConfig => ({
    searchPlaceholder: 'Buscar usuarios, temas o catalogos...',
    notificationCount: this.notificationService.unreadCount(),
    userName: this.userDisplayName(),
    userRole: this.userRole(),
    avatarUrl: 'images/login/avatar-admin.png',
  }));

  // Fase 0 de permisos: la visibilidad del menu vive temporalmente en el layout.
  // Queda pendiente centralizar esta logica cuando exista una capa formal de permisos.
  protected readonly sidebarItems = computed<SidebarItem[]>(() => {
    const standardItems: SidebarItem[] = [
      { label: 'Dashboard', route: '/app/dashboard', icon: 'pi pi-home' },
      { label: 'Seguimientos', route: '/app/seguimientos', icon: 'pi pi-history' },
      { label: 'Historial', route: '/app/historial', icon: 'pi pi-list-check' },
      { label: 'Configuracion', route: '/app/configuracion', icon: 'pi pi-cog' },
    ];

    const adminItems: SidebarItem[] = [
      { label: 'Dashboard', route: '/app/dashboard', icon: 'pi pi-home' },
      { label: 'Usuarios', route: '/app/usuarios', icon: 'pi pi-users' },
      { label: 'Temas', route: '/app/temas', icon: 'pi pi-folder' },
      { label: 'Catalogos', route: '/app/catalogos', icon: 'pi pi-book' },
      { label: 'Historial', route: '/app/historial', icon: 'pi pi-list-check' },
      { label: 'Configuracion', route: '/app/configuracion', icon: 'pi pi-cog' },
    ];

    if (this.isSuperUser()) {
      return adminItems;
    }

    if (this.isAdmin()) {
      return adminItems;
    }

    return standardItems;
  });

  protected readonly showSystemStatus = true;
  protected readonly systemStatusTitle = 'Estado del Sistema';
  protected readonly systemStatusMessage = 'Capacidad utilizada al 55%';
  protected readonly systemStatusPercentage = 55;
  protected readonly systemStatusIcon = 'pi pi-exclamation-circle';

  protected readonly sidebarTitle = 'SISAR';
  protected readonly sidebarLogoText = 'SI';
  protected readonly sidebarLogoSrc: string | null = 'images/login/logo-sisar.png';
  protected readonly sidebarLogoAlt = 'Logo SISAR';

  protected isSidebarCollapsed = false;

  ngOnInit(): void {
    this.loadUserInfo();
    const navigationEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const isReload = navigationEntry?.type === 'reload';
    const justLoggedIn = sessionStorage.getItem(JUST_LOGGED_IN_KEY) === '1';

    if (justLoggedIn) {
      sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
    }

    if (isReload && !justLoggedIn) {
      this.sessionService.clearSession();
      void this.router.navigate([''], { replaceUrl: true });
      return;
    }

    if (!this.sessionService.hasSession()) {
      void this.router.navigate([''], { replaceUrl: true });
    }
  }

  protected onSidebarItemSelected(item: SidebarItem): void {
    console.log('Item seleccionado en layout SISAR:', item);
  }

  protected onSidebarLogout(): void {
    sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
    this.sessionService.clearSession();
    void this.router.navigate(['']);
  }

  protected onTopNavbarSearch(event: TopNavbarSearchEvent): void {
    const term = event.term?.trim().toLowerCase() || '';
    if (!term || term.length < 2) {
      return;
    }

    if (term.startsWith('user:') || term.startsWith('u:')) {
      void this.router.navigate(['/app/usuarios'], { queryParams: { search: term.substring(2) } });
    } else if (term.startsWith('tema:') || term.startsWith('t:')) {
      void this.router.navigate(['/app/temas'], { queryParams: { search: term.substring(2) } });
    } else if (term.startsWith('cat:') || term.startsWith('c:')) {
      void this.router.navigate(['/app/catalogos'], { queryParams: { search: term.substring(2) } });
    } else {
      void this.router.navigate(['/app/temas'], { queryParams: { search: term } });
    }
  }

  protected onTopNavbarNotifications(): void {
    console.log('Click en notificaciones navbar SISAR');
  }

  protected onTopNavbarUserMenu(): void {
    console.log('Click en menu de usuario navbar SISAR');
  }

  private loadUserInfo(): void {
    const currentUser = this.sessionService.getCurrentUser();
    const claims = this.getSessionClaims();
    const displayName =
      (currentUser?.userName ?? '').trim() || this.readClaim(claims, ['name', 'unique_name', 'preferred_username', 'sub']);
    const roleCandidates = [
      (currentUser?.role ?? '').trim(),
      (currentUser?.tipoUsuario ?? '').trim(),
      ...this.getRoleCandidates(claims),
    ].filter(Boolean);
    const normalizedRoles = roleCandidates.map((value) => value.toLowerCase());
    const isSuperUser = normalizedRoles.some(
      (role) => role.includes('superusuario') || role.includes('super-user') || role.includes('super user')
    );
    const isAdmin = isSuperUser || normalizedRoles.some((role) => role.includes('admin'));
    const role = this.resolveUserRole(roleCandidates, isSuperUser, isAdmin);

    this.userDisplayName.set(displayName || 'Usuario');
    this.userRole.set(role || 'Usuario');
    this.isSuperUser.set(isSuperUser);
    this.isAdmin.set(isAdmin);
    this.isStandardUser.set(!isAdmin && !isSuperUser);
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
      return JSON.parse(atob(normalized)) as Record<string, unknown>;
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

  private getRoleCandidates(claims: Record<string, unknown>): string[] {
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

    return roleCandidates;
  }

  private resolveUserRole(roleCandidates: string[], isSuperUser: boolean, isAdmin: boolean): string {
    if (isSuperUser) {
      return 'Superusuario';
    }

    if (isAdmin) {
      return 'Administrador';
    }

    return roleCandidates[0] || 'Usuario';
  }
}
