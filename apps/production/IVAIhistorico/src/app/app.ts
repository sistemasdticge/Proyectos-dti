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

  protected readonly years = signal<string[]>([]);
  protected readonly tipoOptions = ['TODOS', 'RCRD', 'DP', 'OTROS'];

  protected readonly selectedYear = signal<string | null>(null);
  protected readonly selectedTipo = signal('TODOS');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly rows = signal<ResolucionRow[]>([]);
  protected readonly documentViewerOpen = signal(false);
  protected readonly documentViewerBlobUrl = signal<string | null>(null);
  protected readonly documentViewerName = signal<string>('');
  protected readonly documentViewerLoading = signal(false);
  protected readonly documentViewerPreviewError = signal<string | null>(null);

  constructor() {
    this.loadCarpetas();
  }

  protected readonly selectedYearLabel = computed(() => {
    const year = this.selectedYear();

    if (!year) {
      return 'sin selección';
    }

    return year;
  });

  protected readonly filteredRows = computed(() => {
    const tipo = this.selectedTipo();

    return this.rows().filter((row) => {
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
    this.loadArchivosByYear(year);
  }

  protected onTipoChange(value: string): void {
    this.selectedTipo.set(value);
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

  private loadCarpetas(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const endpoint = `${this.apiBaseUrl}/api/Files/carpetas`;
    console.log('[IVAIhistorico] GET', endpoint);

    this.http
      .get<unknown>(endpoint)
      .pipe(
        map((response) => this.normalizeCarpetas(response)),
        catchError((error) => {
          console.error('[IVAIhistorico] Error GET carpetas', error);
          this.errorMessage.set('No fue posible cargar las carpetas del servidor.');
          this.loading.set(false);
          return of<string[]>([]);
        }),
      )
      .subscribe((folders) => {
        console.log('[IVAIhistorico] carpetas recibidas:', folders.length, folders);
        this.years.set(folders);

        if (folders.length === 0) {
          this.selectedYear.set(null);
          this.rows.set([]);
          this.loading.set(false);
          return;
        }

        const initialYear = folders[0];
        this.selectedYear.set(initialYear);
        this.loadArchivosByYear(initialYear);
      });
  }

  private loadArchivosByYear(year: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const endpoint = `${this.apiBaseUrl}/api/Files/${encodeURIComponent(year)}/Archivos`;
    console.log('[IVAIhistorico] GET', endpoint);

    this.http
      .get<unknown>(endpoint)
      .pipe(
        map((response) => this.normalizeArchivos(response, year)),
        catchError((error) => {
          console.error(`[IVAIhistorico] Error GET archivos ${year}`, error);
          this.errorMessage.set(`No fue posible cargar los archivos del año ${year}.`);
          return of<ResolucionRow[]>([]);
        }),
      )
      .subscribe((result) => {
        console.log('[IVAIhistorico] archivos recibidos:', result.length);
        this.rows.set(result);
        this.loading.set(false);
      });
  }

  private normalizeCarpetas(response: unknown): string[] {
    const source = this.extractArrayPayload(response);

    return source
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item === 'object' && 'nombreCarpeta' in item) {
          const value = item['nombreCarpeta'];
          return typeof value === 'string' ? value : '';
        }

        return '';
      })
      .filter((item) => item.length > 0)
      .sort((a, b) => Number(b) - Number(a));
  }

  private normalizeArchivos(response: unknown, year: string): ResolucionRow[] {
    const source = this.extractArrayPayload(response);

    return source
      .map((item) => {
        if (typeof item === 'string') {
          return {
            nombreArchivo: item,
            anio: year,
            carpeta: year,
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
          year;

        return {
          nombreArchivo: nombre,
          fechaPublicacion,
          anio: year,
          carpeta,
        } as ResolucionRow;
      })
      .filter((item): item is ResolucionRow => item !== null);
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
