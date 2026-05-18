import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TemaRow } from '../temas.models';
import { formatFechaVencimiento, formatNumControl } from '../../../utils/tema-display.util';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
  selector: 'lib-temas-table',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, ButtonModule],
  templateUrl: './temas-table.component.html',
})
export class TemasTableComponent {
  @Input() rows: TemaRow[] = [];
  @Input() loading = false;
  @Output() detail = new EventEmitter<TemaRow>();

  protected formatNumControl(value?: string | null): string {
    return formatNumControl(value);
  }

  protected formatFecha(value?: string | null): string {
    return formatFechaVencimiento(value);
  }

  protected prioridadSeverity(p: TemaRow['prioridad']): TagSeverity {
    const map: Record<string, TagSeverity> = {
      'ALTA': 'danger',      // rojo
      'MEDIA': 'warn',       // naranja/amarillo
      'BAJA': 'success',     // verde
    };
    return map[p] || 'secondary';  // degradado (gris) para otros
  }

  protected estadoSeverity(e: TemaRow['estado']): TagSeverity {
    const map: Record<TemaRow['estado'], TagSeverity> = {
      Urgente: 'danger',
      Abierto: 'info',
      'En Proceso': 'secondary',
      Pendiente: 'warn',
      Cerrado: 'success',
    };
    return map[e];
  }

  protected progressValue(row: TemaRow): number {
    return Math.max(0, Math.min(100, Math.round(row.progresoPorcentaje ?? 0)));
  }

  protected progressLabel(row: TemaRow): string {
    return row.progresoLabel ?? '0 de 0 areas completadas';
  }

  protected progressBarClass(row: TemaRow): string {
    const value = this.progressValue(row);
    if (value >= 100) {
      return 'bg-emerald-500';
    }
    if (value > 0) {
      return 'bg-amber-500';
    }
    return 'bg-slate-300';
  }
}
