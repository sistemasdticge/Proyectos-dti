import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CatalogoRecord } from '../catalogos.models';

type TagSeverity = 'success' | 'secondary' | undefined;

@Component({
  selector: 'lib-catalogos-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, TagModule, ToggleSwitchModule],
  templateUrl: './catalogos-table.component.html',
})
export class CatalogosTableComponent {
  @Input() title = 'Registros';
  @Input() rows: CatalogoRecord[] = [];
  @Input() loading = false;

  /** Emite registro + estado destino del toggle */
  @Output() toggleActive = new EventEmitter<{ record: CatalogoRecord; active: boolean }>();
  @Output() edit = new EventEmitter<CatalogoRecord>();

  protected tagSeverity(activo: boolean): TagSeverity {
    return activo ? 'success' : 'secondary';
  }
}
