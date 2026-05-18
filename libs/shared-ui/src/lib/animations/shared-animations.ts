import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';

/**
 * Animación: entrada suave de página con fade + slide
 */
export const pageEnterAnimation = trigger('pageEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate('380ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

/**
 * Animacion: misma entrada escalonada del dashboard para secciones
 */
export const pageSectionEnterAnimation = trigger('pageSectionEnter', [
  transition(':enter', [
    query(
      '.page-animate-block',
      [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        stagger(120, [
          animate('420ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
        ]),
      ],
      { optional: true }
    ),
  ]),
]);

/**
 * Animación: lista de elementos con entrada escalonada
 */
export const listStaggerAnimation = trigger('listStagger', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateX(-12px)' }),
        stagger(60, [animate('300ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateX(0)' }))]),
      ],
      { optional: true }
    ),
  ]),
]);

/**
 * Animación: badge de contador con pulso y escala
 */
export const badgePulseAnimation = trigger('badgePulse', [
  state('idle', style({ transform: 'scale(1)', opacity: 1 })),
  state('active', style({ transform: 'scale(1.1)', opacity: 1 })),
  transition('idle <=> active', [animate('200ms cubic-bezier(0.4, 0, 0.6, 1)')]),
]);

/**
 * Animación: modal de diálogo con backdrop fade
 */
export const modalEnterAnimation = trigger('modalEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95) translateY(-20px)' }),
    animate('280ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
  ]),
  transition(':leave', [animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))]),
]);

/**
 * Animación: carga con spinner rotativo smooth
 */
export const spinnerAnimation = trigger('spinner', [
  state('loading', style({ transform: 'rotate(0deg)' })),
  transition('loading', [animate('1s linear infinite', style({ transform: 'rotate(360deg)' }))]),
]);

/**
 * Animación: cards en grid con entrada escalonada
 */
export const cardGridAnimation = trigger('cardGrid', [
  transition('* => *', [
    query(
      '.card-item',
      [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        stagger(80, [animate('350ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))]),
      ],
      { optional: true }
    ),
  ]),
]);

/**
 * Animación: collapse/expand suave
 */
export const expandCollapseAnimation = trigger('expandCollapse', [
  state('expanded', style({ height: '*', opacity: 1, visibility: 'visible', overflow: 'hidden' })),
  state('collapsed', style({ height: '0', opacity: 0, visibility: 'hidden', overflow: 'hidden' })),
  transition('expanded <=> collapsed', [animate('280ms cubic-bezier(0.4, 0, 0.6, 1)')]),
]);

/**
 * Animación: entrada de notificación desde arriba
 */
export const notificationSlideInAnimation = trigger('notificationSlideIn', [
  transition(':enter', [
    style({ transform: 'translateY(-100%)', opacity: 0 }),
    animate('300ms cubic-bezier(0.22, 1, 0.36, 1)', style({ transform: 'translateY(0)', opacity: 1 })),
  ]),
  transition(':leave', [animate('250ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))]),
]);

/**
 * Animación: cambio de color suave (para cambios de estado)
 */
export const colorTransitionAnimation = trigger('colorTransition', [
  transition('* => *', [animate('240ms ease-in-out')]),
]);

/**
 * Animación: hover effect sutilsuave para botones
 */
export const buttonHoverAnimation = trigger('buttonHover', [
  state('default', style({ transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' })),
  state('hover', style({ transform: 'translateY(-2px)', boxShadow: '0 8px 16px rgba(0,0,0,0.15)' })),
  transition('default <=> hover', [animate('200ms cubic-bezier(0.4, 0, 0.6, 1)')]),
]);
