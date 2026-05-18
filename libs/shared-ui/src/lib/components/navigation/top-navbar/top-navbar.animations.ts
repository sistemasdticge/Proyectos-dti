import { animate, state, style, transition, trigger } from '@angular/animations';

// Entrada elegante del navbar al cargar la vista.
export const topNavbarEnterAnimation = trigger('topNavbarEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-14px)' }),
    animate('360ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

// Pulso sutil del badge al abrir notificaciones.
export const notificationBadgePulseAnimation = trigger('notificationBadgePulse', [
  state('idle', style({ transform: 'scale(1)' })),
  state('active', style({ transform: 'scale(1.08)' })),
  transition('idle => active', animate('180ms ease-out')),
  transition('active => idle', animate('180ms ease-in')),
]);
