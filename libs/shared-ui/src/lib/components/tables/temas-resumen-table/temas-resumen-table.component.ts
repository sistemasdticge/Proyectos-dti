import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { formatFechaVencimiento, formatNumControl } from '../../../utils/tema-display.util';

const temasTableEnterAnimation = trigger('temasTableEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('400ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

const temasRowEnterAnimation = trigger('temasRowEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-8px)' }),
    animate('280ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
]);

export interface TemaResumenRow {
  id?: string;
  numeroControl: string;
  descripcion: string;
  area: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  vencimiento: string;
  estado: 'Urgente' | 'Abierto' | 'En Proceso' | 'Pendiente' | 'Cerrado' | 'Concluido' | 'Completado' | 'En progreso';
}

@Component({
  selector: 'lib-temas-resumen-table',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, TableModule],
  templateUrl: './temas-resumen-table.component.html',
  styleUrl: './temas-resumen-table.component.scss',
  animations: [temasTableEnterAnimation, temasRowEnterAnimation],
})
export class TemasResumenTableComponent {
  // Titulo del bloque principal.
  @Input() title = 'Listado de Temas Asignados';

  // Filas a renderizar en la tabla.
  @Input() rows: TemaResumenRow[] = [];
  @Input() loading = false;

  // Evento del boton de filtros (para abrir modal/panel externo).
  @Output() filterClick = new EventEmitter<void>();

  // Evento del boton de exportacion (CSV/PDF, segun app consumidora).
  @Output() exportClick = new EventEmitter<void>();

  // Evento para abrir detalle de una fila concreta.
  @Output() detailClick = new EventEmitter<TemaResumenRow>();

  protected formatNumControl(value?: string | null): string {
    return formatNumControl(value);
  }

  protected formatFecha(value?: string | Date | null): string {
    return formatFechaVencimiento(value, (date) =>
      new Date(date).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    );
  }

  protected prioritySeverity(value: TemaResumenRow['prioridad']): 'danger' | 'warn' | 'success' {
    if (value === 'ALTA') {
      return 'danger';
    }

    if (value === 'MEDIA') {
      return 'warn';
    }

    return 'success';
  }

  protected statusSeverity(value: TemaResumenRow['estado']): 'danger' | 'warn' | 'secondary' | 'success' | 'info' {
    if (value === 'Urgente') {
      return 'danger';
    }

    if (value === 'Pendiente') {
      return 'warn';
    }

    if (value === 'Cerrado' || value === 'Concluido' || value === 'Completado') {
      return 'success';
    }

    if (value === 'En Proceso' || value === 'En progreso') {
      return 'secondary';
    }

    return 'info';
  }

  protected onFilterClick(): void {
    this.filterClick.emit();
  }

  protected onExportClick(): void {
    this.exportClick.emit();
  }

  protected onDetailClick(row: TemaResumenRow): void {
    this.detailClick.emit(row);
  }
}
