import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Anios, ArchivoRow, TablaArchivos } from '@proyectos-dti/shared-ui';

interface ResolucionRow extends ArchivoRow {
  anio: string;
}

@Component({
  imports: [RouterModule, Anios, TablaArchivos],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly apiBaseUrl = '';

  protected readonly bannerSources = [
    '/banner/banner-principal.jpg',
    '/banner/banner-principal.jpeg',
    '/banner/banner-principal.png',
  ];

  protected readonly years = signal<string[]>([]);
  protected readonly tipoOptions = ['TODOS', 'RCRD', 'DP', 'OTROS'];

  protected readonly selectedYear = signal<string | null>(null);
  protected readonly selectedYears = signal<string[]>([]);
  protected readonly selectedTipo = signal('TODOS');
  protected readonly tablePageSize = signal(50);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly rows = signal<ResolucionRow[]>([]);
  protected readonly documentViewerOpen = signal(false);
  protected readonly documentViewerBlobUrl = signal<string | null>(null);
  protected readonly documentViewerName = signal<string>('');
  protected readonly documentViewerLoading = signal(false);
  protected readonly documentViewerPreviewError = signal<string | null>(null);

  constructor() {
    this.loadAllArchivos();
  }

  protected readonly selectedYearLabel = computed(() => {
    const years = this.selectedYears();

    if (years.length === 0) {
      return 'todos los años';
    }

    if (years.length === 1) {
      return years[0];
    }

    return `${years.length} años`;
  });

  protected readonly yearFilterDescription = computed(() => {
    const years = this.selectedYears();

    if (years.length === 0) {
      return 'Mostrando resoluciones de todos los años.';
    }

    if (years.length === 1) {
      return `Mostrando únicamente archivos del año ${years[0]}.`;
    }

    return `Mostrando archivos de ${years.length} años seleccionados.`;
  });

  protected readonly filteredRows = computed(() => {
    const years = this.selectedYears();
    const tipo = this.selectedTipo();

    return this.rows().filter((row) => {
      if (years.length > 0 && (!row.anio || !years.includes(row.anio))) {
        return false;
      }

      if (tipo === 'TODOS') {
        return true;
      }

      if (tipo === 'RCRD') {
        return row.nombreArchivo.includes('RCRD');
      }

      if (tipo === 'DP') {
        return row.nombreArchivo.includes('-DP-');
      }

      return !row.nombreArchivo.includes('RCRD') && !row.nombreArchivo.includes('-DP-');
    });
  });

  protected onYearChange(year: string): void {
    this.selectedYear.set(year);
  }

  protected onYearSelectionChange(years: string[]): void {
    this.selectedYears.set(years);
    this.selectedYear.set(years.length === 1 ? years[0] : null);
  }

  protected onShowAllYears(): void {
    this.selectedYears.set([]);
    this.selectedYear.set(null);
    this.tablePageSize.set(50);
  }

  protected onTablePageChange(change: { page: number; pageSize: number }): void {
    this.tablePageSize.set(change.pageSize);
  }

  protected onTipoChange(value: string): void {
    this.selectedTipo.set(value);
  }

  protected onBannerError(event: Event): void {
    const image = event.target as HTMLImageElement | null;

    if (!image) {
      return;
    }

    const currentSource = image.getAttribute('src') || '';
    const currentIndex = this.bannerSources.indexOf(currentSource);

    if (currentIndex === -1 || currentIndex >= this.bannerSources.length - 1) {
      return;
    }

    image.src = this.bannerSources[currentIndex + 1];
  }

  protected onVerDocumento(row: ArchivoRow): void {
    if (!row.carpeta) {
      return;
    }

    const url = `${this.apiBaseUrl}/api/Files/carpeta/${encodeURIComponent(row.carpeta)}/documento/${encodeURIComponent(row.nombreArchivo)}`;
    this.clearDocumentPreview();
    this.documentViewerName.set(row.nombreArchivo);
    this.documentViewerLoading.set(true);
    this.documentViewerPreviewError.set(null);
    this.documentViewerOpen.set(true);

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        if (!blob || blob.size === 0) {
          this.documentViewerPreviewError.set('No fue posible previsualizar el documento.');
          this.documentViewerLoading.set(false);
          return;
        }

        const blobUrl = URL.createObjectURL(blob);
        this.documentViewerBlobUrl.set(blobUrl);
        this.documentViewerLoading.set(false);
      },
      error: () => {
        this.documentViewerPreviewError.set('No fue posible cargar la vista previa del documento.');
        this.documentViewerLoading.set(false);
      },
    });
  }

  protected readonly documentViewerSafeUrl = computed(() => {
    const url = this.documentViewerBlobUrl();

    if (!url) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  protected closeDocumentViewer(): void {
    this.documentViewerOpen.set(false);
    this.clearDocumentPreview();
  }

  protected downloadDocument(): void {
    const blobUrl = this.documentViewerBlobUrl();

    if (!blobUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = this.documentViewerName() || 'documento';
    link.click();
  }

  ngOnDestroy(): void {
    this.clearDocumentPreview();
  }

  private loadAllArchivos(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const endpoint = `${this.apiBaseUrl}/api/Files`;
    console.log('[IVAIhistorico] GET', endpoint);

    this.http
      .get<unknown>(endpoint)
      .pipe(
        map((response) => this.normalizeArchivos(response)),
        catchError((error) => {
          console.error('[IVAIhistorico] Error GET archivos', error);
          this.errorMessage.set('No fue posible cargar las resoluciones del servidor.');
          this.loading.set(false);
          return of<ResolucionRow[]>([]);
        }),
      )
      .subscribe((result) => {
        console.log('[IVAIhistorico] archivos recibidos:', result.length);
        this.rows.set(result);
        this.years.set(this.extractYearsFromRows(result));
        this.selectedYear.set(null);
        this.selectedYears.set([]);
        this.loading.set(false);
      });
  }

  private normalizeArchivos(response: unknown, year?: string): ResolucionRow[] {
    const source = this.extractArrayPayload(response);

    return source
      .map((item) => {
        if (typeof item === 'string') {
          const resolvedYear = year ?? '';

          return {
            nombreArchivo: item,
            anio: resolvedYear,
            carpeta: resolvedYear,
          } as ResolucionRow;
        }

        if (!item || typeof item !== 'object') {
          return null;
        }

        const archivo = item as Record<string, unknown>;
        const nombre =
          (typeof archivo['nombreArchivo'] === 'string' && archivo['nombreArchivo']) ||
          (typeof archivo['nombre'] === 'string' && archivo['nombre']) ||
          (typeof archivo['fileName'] === 'string' && archivo['fileName']) ||
          '';

        if (!nombre) {
          return null;
        }

        const fechaPublicacion =
          (typeof archivo['fechaPublicacion'] === 'string' && archivo['fechaPublicacion']) ||
          (typeof archivo['fecha'] === 'string' && archivo['fecha']) ||
          (typeof archivo['uploadDate'] === 'string' && archivo['uploadDate']) ||
          undefined;

        const carpeta =
          (typeof archivo['nombreCarpeta'] === 'string' && archivo['nombreCarpeta']) ||
          (typeof archivo['nombreCarperta'] === 'string' && archivo['nombreCarperta']) ||
          '';

        const anio =
          (typeof archivo['anio'] === 'string' && archivo['anio']) ||
          (typeof archivo['year'] === 'string' && archivo['year']) ||
          carpeta ||
          year ||
          '';

        return {
          nombreArchivo: nombre,
          fechaPublicacion,
          anio,
          carpeta: carpeta || anio,
        } as ResolucionRow;
      })
      .filter((item): item is ResolucionRow => item !== null);
  }

  private extractYearsFromRows(rows: ResolucionRow[]): string[] {
    const uniqueYears = new Set(
      rows
        .map((row) => row.anio)
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    );

    return Array.from(uniqueYears).sort((a, b) => Number(b) - Number(a));
  }

  private extractArrayPayload(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const payload = response as Record<string, unknown>;

    if (Array.isArray(payload['value'])) {
      return payload['value'];
    }

    if (Array.isArray(payload['items'])) {
      return payload['items'];
    }

    if (Array.isArray(payload['data'])) {
      return payload['data'];
    }

    return [];
  }

  private clearDocumentPreview(): void {
    const currentBlobUrl = this.documentViewerBlobUrl();

    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
    }

    this.documentViewerBlobUrl.set(null);
    this.documentViewerLoading.set(false);
    this.documentViewerPreviewError.set(null);
  }
}
