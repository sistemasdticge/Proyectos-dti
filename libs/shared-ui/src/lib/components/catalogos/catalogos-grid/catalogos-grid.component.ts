import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CatalogoSummaryCard, CatalogoType } from '../catalogos.models';

@Component({
  selector: 'lib-catalogos-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogos-grid.component.html',
})
export class CatalogosGridComponent {
  @Input() cards: CatalogoSummaryCard[] = [];
  @Input() selectedType: CatalogoType = 'AREA';

  @Output() selectedTypeChange = new EventEmitter<CatalogoType>();
}
