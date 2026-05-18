import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TemaTabFilter } from '../temas.models';

interface FilterItem {
  key: TemaTabFilter;
  label: string;
  dotClass: string;
}

@Component({
  selector: 'lib-temas-filters',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './temas-filters.component.html',
})
export class TemasFiltersComponent {
  @Input() active: TemaTabFilter = 'todos';
  @Input() total = 0;
  @Output() activeChange = new EventEmitter<TemaTabFilter>();

  protected readonly filters: FilterItem[] = [
    { key: 'todos',       label: 'Todos',      dotClass: '' },
    { key: 'urgentes',    label: 'Urgentes',   dotClass: 'bg-red-500' },
    { key: 'en-proceso',  label: 'En Proceso', dotClass: 'bg-blue-500' },
    { key: 'pendientes',  label: 'Pendientes', dotClass: 'bg-amber-400' },
    { key: 'completados', label: 'Completados',dotClass: 'bg-emerald-500' },
  ];

  protected select(key: TemaTabFilter): void {
    this.activeChange.emit(key);
  }
}
