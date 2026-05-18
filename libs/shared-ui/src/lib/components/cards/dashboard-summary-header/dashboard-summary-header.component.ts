import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

const summaryHeaderEnterAnimation = trigger('summaryHeaderEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('380ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

@Component({
  selector: 'lib-dashboard-summary-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-summary-header.component.html',
  styleUrl: './dashboard-summary-header.component.scss',
  animations: [summaryHeaderEnterAnimation],
})
export class DashboardSummaryHeaderComponent {
  // Titulo principal del resumen.
  @Input() title = 'Resumen Institucional';

  // Subtitulo descriptivo que explica el estado actual.
  @Input() subtitle = 'Bienvenido de nuevo. Aqui tienes el estado actual de tus temas.';
}
