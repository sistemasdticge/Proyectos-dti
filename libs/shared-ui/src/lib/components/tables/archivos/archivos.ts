import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { VerDocumento } from '../../buttons/ver-documento/ver-documento';

export interface ArchivoRow {
  nombreArchivo: string;
  fechaPublicacion?: string;
  carpeta?: string;
  anio?: string;
}

@Component({
  selector: 'lib-tabla-archivos',
  imports: [CommonModule, VerDocumento],
  templateUrl: './archivos.html',
  styleUrl: './archivos.css',
})
export class TablaArchivos {
  rows = input<ArchivoRow[]>([]);
  loading = input(false);
  pageSize = input(50);
  pageSizeOptions = input<number[]>([10, 20, 50, 100]);

  verDocumento = output<ArchivoRow>();
  busquedaChange = output<string>();
  pageChange = output<{ page: number; pageSize: number }>();

  busqueda = signal('');
  currentPage = signal(1);
  selectedPageSize = signal(50);
  yearSortOrder = signal<'desc' | 'asc'>('desc');
  private appliedInputPageSize = signal<number | null>(null);

  filteredRows = computed(() => {
    const term = this.busqueda().trim().toLowerCase();
    const normalizedTerm = this.normalizeForSearch(term);

    if (!term) {
      return this.rows();
    }

    return this.rows().filter(
      (row) => {
        const nombreArchivo = (row.nombreArchivo || '').toLowerCase();
        const fechaPublicacion = (row.fechaPublicacion || '').toLowerCase();

        const normalizedNombreArchivo = this.normalizeForSearch(nombreArchivo);
        const normalizedFechaPublicacion = this.normalizeForSearch(fechaPublicacion);

        return (
          nombreArchivo.includes(term) ||
          fechaPublicacion.includes(term) ||
          normalizedNombreArchivo.includes(normalizedTerm) ||
          normalizedFechaPublicacion.includes(normalizedTerm)
        );
      },
    );
  });

  sortedRows = computed(() => {
    const order = this.yearSortOrder();

    return [...this.filteredRows()].sort((left, right) => {
      const leftYear = this.parseYearValue(left.anio);
      const rightYear = this.parseYearValue(right.anio);

      if (leftYear !== rightYear) {
        return order === 'desc' ? rightYear - leftYear : leftYear - rightYear;
      }

      return left.nombreArchivo.localeCompare(right.nombreArchivo, 'es', { sensitivity: 'base' });
    });
  });

  totalRegistros = computed(() => this.sortedRows().length);

  totalPages = computed(() => {
    const pages = Math.ceil(this.totalRegistros() / this.selectedPageSize());
    return pages > 0 ? pages : 1;
  });

  pageWindow = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);

    if (current <= 4) {
      start = 2;
      end = 5;
    }

    if (current >= total - 3) {
      start = total - 4;
      end = total - 1;
    }

    const pages: Array<number | string> = [1];

    if (start > 2) {
      pages.push('...');
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (end < total - 1) {
      pages.push('...');
    }

    pages.push(total);
    return pages;
  });

  visibleRows = computed(() => {
    const start = (this.currentPage() - 1) * this.selectedPageSize();
    const end = start + this.selectedPageSize();
    return this.sortedRows().slice(start, end);
  });

  displayStart = computed(() => {
    if (this.totalRegistros() === 0) {
      return 0;
    }

    return (this.currentPage() - 1) * this.selectedPageSize() + 1;
  });

  displayEnd = computed(() => {
    const end = this.currentPage() * this.selectedPageSize();
    return end > this.totalRegistros() ? this.totalRegistros() : end;
  });

  constructor() {
    effect(() => {
      const inputPageSize = this.pageSize();
      const appliedPageSize = this.appliedInputPageSize();

      if (!inputPageSize || Number.isNaN(inputPageSize)) {
        return;
      }

      if (appliedPageSize === inputPageSize) {
        return;
      }

      this.selectedPageSize.set(inputPageSize);
      this.appliedInputPageSize.set(inputPageSize);
      this.currentPage.set(1);
      this.emitPageChange();
    });

    effect(() => {
      const maxPage = this.totalPages();
      const current = this.currentPage();

      if (current <= maxPage) {
        return;
      }

      this.currentPage.set(maxPage);
      this.emitPageChange();
    });
  }

  onBusqueda(value: string): void {
    this.busqueda.set(value);
    this.currentPage.set(1);
    this.busquedaChange.emit(value);
    this.emitPageChange();
  }

  onPageSizeChange(value: string): void {
    const parsedValue = Number(value);

    if (!parsedValue || Number.isNaN(parsedValue)) {
      return;
    }

    this.selectedPageSize.set(parsedValue);
    this.currentPage.set(1);
    this.emitPageChange();
  }

  goToPage(page: number): void {
    const maxPage = this.totalPages();
    const target = Math.max(1, Math.min(page, maxPage));

    this.currentPage.set(target);
    this.emitPageChange();
  }

  onVerDocumento(row: ArchivoRow): void {
    this.verDocumento.emit(row);
  }

  toggleYearSort(): void {
    const currentOrder = this.yearSortOrder();
    this.yearSortOrder.set(currentOrder === 'desc' ? 'asc' : 'desc');
    this.currentPage.set(1);
    this.emitPageChange();
  }

  yearSortLabel(): string {
    return this.yearSortOrder() === 'desc' ? 'Año ↓' : 'Año ↑';
  }

  private parseYearValue(value?: string): number {
    if (!value) {
      return Number.MIN_SAFE_INTEGER;
    }

    const parsedYear = Number(value);
    return Number.isNaN(parsedYear) ? Number.MIN_SAFE_INTEGER : parsedYear;
  }

  private normalizeForSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private emitPageChange(): void {
    this.pageChange.emit({
      page: this.currentPage(),
      pageSize: this.selectedPageSize(),
    });
  }
}
