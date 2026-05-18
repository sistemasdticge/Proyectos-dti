import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import type { TemaResumenRow } from '../temas-resumen-table/temas-resumen-table.component';
import { formatFechaVencimiento, formatNumControl } from '../../../utils/tema-display.util';

@Component({
  selector: 'lib-temas-summary-list',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule],
  templateUrl: './temas-summary-list.component.html',
  styleUrl: './temas-summary-list.component.scss',
})
export class TemasSummaryListComponent {
  @Input() title = 'Temas';
  @Input() rows: TemaResumenRow[] = [];
  @Input() loading = false;

  @Output() detailClick = new EventEmitter<TemaResumenRow>();

  protected formatNumControl(value?: string | null): string {
    return formatNumControl(value);
  }

  protected formatFecha(value?: string | Date | null): string {
    return formatFechaVencimiento(value, (date) =>
      new Date(date).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
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

  protected onDetailClick(row: TemaResumenRow): void {
    this.detailClick.emit(row);
  }
}
