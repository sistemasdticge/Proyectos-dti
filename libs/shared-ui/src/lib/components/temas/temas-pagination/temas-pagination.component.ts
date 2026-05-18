import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';

@Component({
  selector: 'lib-temas-pagination',
  standalone: true,
  imports: [CommonModule, PaginatorModule],
  templateUrl: './temas-pagination.component.html',
})
export class TemasPaginationComponent {
  @Input() page = 1;
  @Input() pageSize = 5;
  @Input() total = 0;
  @Output() pageChange = new EventEmitter<number>();

  get first(): number {
    return (this.page - 1) * this.pageSize;
  }

  get start(): number {
    return this.total === 0 ? 0 : this.first + 1;
  }

  get end(): number {
    return Math.min(this.page * this.pageSize, this.total);
  }

  protected onPageChange(e: PaginatorState): void {
    this.pageChange.emit((e.page ?? 0) + 1);
  }
}
