import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

import {
  notificationBadgePulseAnimation,
  topNavbarEnterAnimation,
} from './top-navbar.animations';
import { TopNavbarConfig, TopNavbarSearchEvent } from './top-navbar.models';

@Component({
  selector: 'lib-top-navbar',
  standalone: true,
  imports: [CommonModule, InputTextModule, ButtonModule, AvatarModule],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
  animations: [topNavbarEnterAnimation, notificationBadgePulseAnimation],
})
export class TopNavbarComponent {
  // -------------------------------------------------------------------------
  // GUIA DE CONSUMO
  // -------------------------------------------------------------------------
  // Este componente se usa como:
  // <lib-top-navbar
  //   [config]="topNavbarConfig"
  //   (searchChange)="onTopNavbarSearch($event)"
  //   (notificationClick)="onTopNavbarNotifications()"
  //   (userMenuClick)="onTopNavbarUserMenu()"
  // ></lib-top-navbar>
  //
  // Donde topNavbarConfig debe cumplir la interfaz TopNavbarConfig:
  // {
  //   searchPlaceholder: 'Buscar folios o temas...',
  //   notificationCount: 2,
  //   userName: 'Admin User',
  //   userRole: 'Coordinacion',
  //   avatarUrl: 'images/login/avatar-admin.png'
  // }

  // Configuracion visual y de datos enviada por la app consumidora.
  @Input({ required: true }) config!: TopNavbarConfig;

  // Eventos para que el contenedor controle la logica de negocio.
  // - searchChange: se dispara al escribir en el input.
  // - notificationClick: se dispara al pulsar campana.
  // - userMenuClick: se dispara al pulsar bloque de usuario.
  @Output() searchChange = new EventEmitter<TopNavbarSearchEvent>();
  @Output() notificationClick = new EventEmitter<void>();
  @Output() userMenuClick = new EventEmitter<void>();

  // Estado local reactivo del termino escrito.
  protected readonly searchTerm = signal('');
  // Estado de animacion del badge (idle/active) para feedback visual.
  protected readonly badgeAnimationState = signal<'idle' | 'active'>('idle');

  // Se invoca en cada input; actualiza signal y notifica al contenedor.
  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.searchChange.emit({ term });
  }

  // Emite evento y hace una animacion corta del badge para dar respuesta visual.
  protected onNotificationClick(): void {
    this.notificationClick.emit();
    this.badgeAnimationState.set('active');

    window.setTimeout(() => {
      this.badgeAnimationState.set('idle');
    }, 220);
  }

  // Delega al contenedor la logica del menu/perfil.
  protected onUserMenuClick(): void {
    this.userMenuClick.emit();
  }
}
