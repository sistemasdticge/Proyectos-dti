import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'lib-catalogos-header',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './catalogos-header.component.html',
})
export class CatalogosHeaderComponent {
  @Input() title = 'Catálogos';
  @Input() subtitle = 'Administra catálogos estratégicos del sistema.';
  @Input() activeLabel = 'Área';
  @Input() totalCount = 0;
  @Input() createLabel = 'Nuevo registro';

  @Output() create = new EventEmitter<void>();
}
