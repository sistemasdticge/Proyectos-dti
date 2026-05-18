import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import {
  AreaOption,
  TemaCatalogOption,
  TemasCreateModalComponent,
} from '../../../../../../../libs/shared-ui/src/lib/components/temas/temas-create-modal/temas-create-modal.component';
import { TemasFiltersComponent } from '../../../../../../../libs/shared-ui/src/lib/components/temas/temas-filters/temas-filters.component';
import { TemaRow, TemaTabFilter } from '../../../../../../../libs/shared-ui/src/lib/components/temas/temas.models';
import { TemasPaginationComponent } from '../../../../../../../libs/shared-ui/src/lib/components/temas/temas-pagination/temas-pagination.component';
import { TemasTableComponent } from '../../../../../../../libs/shared-ui/src/lib/components/temas/temas-table/temas-table.component';
import { TemasToolbarComponent } from '../../../../../../../libs/shared-ui/src/lib/components/temas/temas-toolbar/temas-toolbar.component';
import { pageSectionEnterAnimation } from '../../../../../../../libs/shared-ui/src/lib/animations/shared-animations';
import { DocumentViewerComponent } from '../../../../../../../libs/shared-ui/src/lib/components/modals/document-viewer/document-viewer.component';
import {
  CatSituacionDTO,
  CatalogoDTO,
  TemaArchivoDTO,
  TemaDTO,
  TemaSeguimientoDTO,
  TemaTurnoDTO,
} from '../../../../../../../libs/shared-ui/src/lib/models/tema.model';
import { TemaService } from '../../../../../../../libs/shared-ui/src/lib/services/tema.service';
import { downloadBlob } from '../../../../../../../libs/shared-ui/src/lib/utils/blob-file.util';
import { formatFechaVencimiento, formatNumControl } from '../../../../../../../libs/shared-ui/src/lib/utils/tema-display.util';

type AreaOptionWithStatus = AreaOption & { activo: boolean };
type TemaCatalogOptionWithStatus = TemaCatalogOption & { activo: boolean };

@Component({
  selector: 'app-temas-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    SelectModule,
    TagModule,
    ToastModule,
    DocumentViewerComponent,
    TemasToolbarComponent,
    TemasFiltersComponent,
    TemasTableComponent,
    TemasPaginationComponent,
    TemasCreateModalComponent,
  ],
  templateUrl: './temas-page.html',
  styleUrl: './temas-page.scss',
  animations: [pageSectionEnterAnimation],
  providers: [ConfirmationService],
})
export class TemasPage {
  private readonly temaService = inject(TemaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly todayMinDate = new Date();
  protected readonly formatNumControl = formatNumControl;

  protected readonly loading = signal(false);
  protected readonly allTemas = signal<TemaDTO[]>([]);
  protected readonly activeFilter = signal<TemaTabFilter>('todos');
  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly showModal = signal(false);

  protected readonly showDetailModal = signal(false);
  protected readonly loadingDetail = signal(false);
  protected readonly detailError = signal<string | null>(null);
  protected readonly detailEditMode = signal(false);
  protected readonly detailSaving = signal(false);
  protected readonly turnosSaving = signal(false);
  protected readonly selectedTema = signal<TemaDTO | null>(null);
  protected readonly detailTurnos = signal<TemaTurnoDTO[]>([]);
  protected readonly detailSeguimientosByTurnoId = signal<Record<string, TemaSeguimientoDTO[]>>({});
  protected readonly detailSeguimientosLoadingByTurnoId = signal<Record<string, boolean>>({});
  protected readonly detailSeguimientosErrorByTurnoId = signal<Record<string, string | null>>({});
  protected readonly expandedSeguimientosByTurnoId = signal<Record<string, boolean>>({});
  protected readonly situacionSolventadaById = signal<Record<string, boolean>>({});
  protected readonly downloadingArchivoKey = signal<string | null>(null);
  protected readonly archivoDownloadError = signal<string | null>(null);
  protected readonly filePreviewOpen = signal(false);
  protected readonly filePreviewLoading = signal(false);
  protected readonly filePreviewError = signal<string | null>(null);
  protected readonly filePreviewBlobUrl = signal<string | null>(null);
  protected readonly filePreviewBlob = signal<Blob | null>(null);
  protected readonly filePreviewName = signal('');
  protected readonly filePreviewMimeType = signal('');
  protected readonly selectedAddAreaId = signal('');
  protected readonly detailSelectedFiles = signal<File[]>([]);
  protected readonly detailUploadTipoDocumentoId = signal('');

  protected readonly areaOptions = signal<AreaOption[]>([]);
  protected readonly allAreaOptions = signal<AreaOptionWithStatus[]>([]);
  protected readonly tipoTemaOptions = signal<TemaCatalogOption[]>([]);
  protected readonly allTipoTemaOptions = signal<TemaCatalogOptionWithStatus[]>([]);
  protected readonly prioridadOptions = signal<TemaCatalogOption[]>([]);
  protected readonly allPrioridadOptions = signal<TemaCatalogOptionWithStatus[]>([]);
  protected readonly tipoDocumentoOptions = signal<TemaCatalogOption[]>([]);
  protected readonly areaCatalogError = signal<string | null>(null);

  protected readonly detailForm = this.fb.nonNullable.group({
    tipoTemaId: ['', Validators.required],
    tipoPrioridadId: ['', Validators.required],
    descripcion: ['', [Validators.required, Validators.maxLength(1200)]],
    fechaVencimiento: [null as Date | null],
    numControl: [''],
  });

  protected readonly filteredRows = computed(() => {
    const filter = this.activeFilter();
    return this.allTemas()
      .map((t) => this.toRow(t))
      .filter((r) => {
        if (filter === 'todos') return true;
        if (filter === 'urgentes') return r.estado === 'Urgente';
        if (filter === 'en-proceso') return r.estado === 'En Proceso';
        if (filter === 'pendientes') return r.estado === 'Pendiente';
        return r.estado === 'Cerrado';
      })
      .sort((left, right) => this.compareRowsByOperationalStatus(left, right));
  });

  protected readonly visibleRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredRows().slice(start, start + this.pageSize);
  });

  protected readonly total = computed(() => this.filteredRows().length);

  protected readonly turnosTotal = computed(() => this.detailTurnos().length);
  protected readonly turnosEntregados = computed(
    () => this.detailTurnos().filter((t) => Number(t.solventado) === 1).length
  );
  protected readonly turnosPendientes = computed(
    () => this.turnosTotal() - this.turnosEntregados()
  );
  protected readonly progresoPct = computed(() => {
    const total = this.turnosTotal();
    if (!total) return 0;
    return Math.round((this.turnosEntregados() / total) * 100);
  });

  protected readonly availableAreaOptions = computed(() => {
    const usedIds = new Set(this.detailTurnos().map((t) => t.areaId));
    return this.areaOptions().filter((a) => !usedIds.has(a.id));
  });
  protected readonly detailTipoTemaOptions = computed(() =>
    this.optionsWithCurrentInactive(
      this.tipoTemaOptions(),
      this.allTipoTemaOptions(),
      this.detailForm.controls.tipoTemaId.value
    )
  );
  protected readonly detailPrioridadOptions = computed(() =>
    this.optionsWithCurrentInactive(
      this.prioridadOptions(),
      this.allPrioridadOptions(),
      this.detailForm.controls.tipoPrioridadId.value
    )
  );

  constructor() {
    this.todayMinDate.setHours(0, 0, 0, 0);
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const temaId = params.get('temaId')?.trim() ?? '';
      if (temaId) {
        this.showDetailModal.set(true);
        this.detailEditMode.set(false);
        this.loadTemaDetail(temaId);
      }
    });
    this.loadAreaOptions();
    this.loadTipoTemaOptions();
    this.loadPrioridadOptions();
    this.loadTipoDocumentoOptions();
    this.loadSituaciones();
    this.loadTemas();
  }

  protected onFilterChange(f: TemaTabFilter): void {
    this.activeFilter.set(f);
    this.page.set(1);
  }

  protected onPageChange(p: number): void {
    this.page.set(p);
  }

  protected onDetail(row: TemaRow): void {
    this.showDetailModal.set(true);
    this.detailEditMode.set(false);
    this.loadTemaDetail(row.id);
  }

  protected closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedTema.set(null);
    this.detailTurnos.set([]);
    this.detailSeguimientosByTurnoId.set({});
    this.detailSeguimientosLoadingByTurnoId.set({});
    this.detailSeguimientosErrorByTurnoId.set({});
    this.expandedSeguimientosByTurnoId.set({});
    this.downloadingArchivoKey.set(null);
    this.archivoDownloadError.set(null);
    this.detailEditMode.set(false);
    this.detailError.set(null);
    this.selectedAddAreaId.set('');
    this.clearDetailUploadState();
  }

  protected onCreated(): void {
    this.loadTemas();
  }

  protected enableEdit(): void {
    this.detailEditMode.set(true);
    this.clearDetailUploadState();
    const tema = this.selectedTema();
    if (tema) {
      this.patchDetailForm(tema);
    }
  }

  protected cancelEdit(): void {
    this.detailEditMode.set(false);
    this.clearDetailUploadState();
    const tema = this.selectedTema();
    if (tema) {
      this.patchDetailForm(tema);
    }
  }

  protected saveTemaEdit(): void {
    const tema = this.selectedTema();
    if (!tema) {
      return;
    }

    if (this.detailForm.invalid) {
      this.detailForm.markAllAsTouched();
      return;
    }

    const value = this.detailForm.getRawValue();
    const uploadFile = this.detailSelectedFiles()[0] ?? null;
    const uploadTipoDocumentoId = this.detailUploadTipoDocumentoId().trim();
    if (uploadFile && !uploadTipoDocumentoId) {
      this.detailError.set('Selecciona el tipo de documento para adjuntar el archivo.');
      return;
    }

    const payload = {
      id: tema.id,
      tipoTemaId: value.tipoTemaId,
      tipoPrioridadId: value.tipoPrioridadId,
      descripcion: value.descripcion.trim(),
      fechaVencimiento: value.fechaVencimiento
        ? value.fechaVencimiento.toISOString()
        : null,
      numControl: value.numControl?.trim() ?? '',
    };

    this.detailSaving.set(true);
    this.detailError.set(null);
    this.temaService
      .updateTema(tema.id, payload)
      .pipe(
        switchMap(() => {
          if (!uploadFile) {
            return of(null);
          }

          return this.temaService.uploadTemaFile(tema.id, uploadTipoDocumentoId, uploadFile);
        }),
        finalize(() => this.detailSaving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Tema actualizado',
            detail: uploadFile ? 'El tema y el archivo se guardaron correctamente.' : 'El tema se actualizó correctamente.',
            life: 3500,
          });
          this.detailEditMode.set(false);
          this.clearDetailUploadState();
          this.loadTemaDetail(tema.id);
          this.loadTemas();
        },
        error: (error) => {
          console.error('[Temas] error al actualizar tema:', error);
          this.detailError.set('No fue posible actualizar el tema.');
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No fue posible actualizar el tema.',
            life: 4500,
          });
        },
      });
  }

  protected addTurno(): void {
    const tema = this.selectedTema();
    const areaId = this.selectedAddAreaId();

    if (!tema || !areaId) {
      return;
    }

    const area = this.areaOptions().find((a) => a.id === areaId);
    this.turnosSaving.set(true);
    this.temaService
      .createTemaTurno({
        temaId: tema.id,
        areaId,
        area: area?.label ?? areaId,
      })
      .pipe(
        finalize(() => this.turnosSaving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.selectedAddAreaId.set('');
          this.loadTemaDetail(tema.id);
        },
        error: () => {
          this.detailError.set('No fue posible agregar el turno/área.');
        },
      });
  }

  protected removeTurno(turnoId: string): void {
    const tema = this.selectedTema();
    if (!tema) {
      return;
    }

    if (this.seguimientosForTurno(turnoId).length > 0) {
      this.detailError.set('No se puede eliminar el área porque ya tiene seguimientos registrados');
      return;
    }

    this.confirmationService.confirm({
      header: 'Quitar área del tema',
      message: '¿Estás seguro de quitar esta área del tema?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
      accept: () => this.performRemoveTurno(turnoId, tema.id),
    });
  }

  private performRemoveTurno(turnoId: string, temaId: string): void {
    this.turnosSaving.set(true);
    this.temaService
      .deleteTemaTurno(turnoId)
      .pipe(
        finalize(() => this.turnosSaving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.loadTemaDetail(temaId);
        },
        error: () => {
          this.detailError.set('No fue posible eliminar el turno/área.');
        },
      });
  }

  protected isTurnoDelivered(turno: TemaTurnoDTO): boolean {
    return Number(turno.solventado) === 1;
  }

  protected isAreaAtendida(turno: TemaTurnoDTO): boolean {
    return this.isTurnoDelivered(turno) || this.seguimientosForTurno(turno.id).some((s) => this.isSeguimientoSolventado(s));
  }

  protected areaStatusLabel(turno: TemaTurnoDTO): string {
    return this.isAreaAtendida(turno) ? 'Atendido' : 'Pendiente';
  }

  protected areaStatusSeverity(turno: TemaTurnoDTO): 'success' | 'warn' {
    return this.isAreaAtendida(turno) ? 'success' : 'warn';
  }

  protected seguimientosForTurno(turnoId: string): TemaSeguimientoDTO[] {
    return this.detailSeguimientosByTurnoId()[turnoId] ?? [];
  }

  protected sortedSeguimientosForTurno(turnoId: string): TemaSeguimientoDTO[] {
    return [...this.seguimientosForTurno(turnoId)].sort((left, right) => {
      const leftTime = Date.parse(left.fecha || '');
      const rightTime = Date.parse(right.fecha || '');
      return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
    });
  }

  protected ultimoSeguimientoForTurno(turnoId: string): TemaSeguimientoDTO | null {
    return this.sortedSeguimientosForTurno(turnoId)[0] ?? null;
  }

  protected isSeguimientosExpanded(turnoId: string): boolean {
    return this.expandedSeguimientosByTurnoId()[turnoId] === true;
  }

  protected toggleSeguimientosArea(turnoId: string): void {
    this.expandedSeguimientosByTurnoId.update((current) => ({
      ...current,
      [turnoId]: !current[turnoId],
    }));
  }

  protected isSeguimientosLoading(turnoId: string): boolean {
    return this.detailSeguimientosLoadingByTurnoId()[turnoId] === true;
  }

  protected seguimientosError(turnoId: string): string | null {
    return this.detailSeguimientosErrorByTurnoId()[turnoId] ?? null;
  }

  protected seguimientoSituacionSeverity(seguimiento: TemaSeguimientoDTO): 'success' | 'info' {
    return this.isSeguimientoSolventado(seguimiento) ? 'success' : 'info';
  }

  protected archivosForSeguimiento(seguimiento: TemaSeguimientoDTO) {
    return Array.isArray(seguimiento.archivos) ? seguimiento.archivos : [];
  }

  protected archivosTema(tema: TemaDTO): TemaArchivoDTO[] {
    return Array.isArray(tema.archivos) ? tema.archivos : [];
  }

  protected areaDisplayLabel(turno: TemaTurnoDTO): string {
    const area = this.allAreaOptions().find((option) => option.id === turno.areaId);
    const label = area?.label || turno.area || 'Área sin nombre';
    return area && !area.activo ? `${label} (inactivo)` : label;
  }

  protected archivoKey(scope: 'tema' | 'seguimiento', archivo: TemaArchivoDTO): string {
    return `${scope}:${this.resolveArchivoId(archivo) || archivo.nombreArchivo || 'sin-id'}`;
  }

  protected isArchivoDownloading(scope: 'tema' | 'seguimiento', archivo: TemaArchivoDTO): boolean {
    return this.downloadingArchivoKey() === this.archivoKey(scope, archivo);
  }

  protected hasArchivoDownloadId(archivo: TemaArchivoDTO): boolean {
    return this.resolveArchivoId(archivo).length > 0;
  }

  protected viewTemaArchivo(archivo: TemaArchivoDTO): void {
    const archivoId = this.resolveArchivoId(archivo);

    if (!archivoId) {
      this.archivoDownloadError.set('No fue posible abrir el archivo porque no tiene identificador.');
      return;
    }

    this.openArchivoBlob(
      this.archivoKey('tema', archivo),
      archivo.nombreArchivo,
      () => this.temaService.downloadTemaArchivo(archivoId),
      '[ArchivoTema]'
    );
  }

  protected viewSeguimientoArchivo(archivo: TemaArchivoDTO, seguimiento: TemaSeguimientoDTO): void {
    const archivoId = this.resolveArchivoId(archivo);
    const selectedTema = this.selectedTema();
    const temaId = selectedTema?.id ?? '';
    const url = `/api/TemaSeguimiento/download/archivoId/${encodeURIComponent(archivoId || '')}/temaId/${encodeURIComponent(temaId)}`;

    console.log('[PreviewSeguimientoArchivo] archivo:', archivo);
    console.log('[PreviewSeguimientoArchivo] archivoId:', archivoId);
    console.log('[PreviewSeguimientoArchivo] temaId usado:', temaId);
    console.log('[PreviewSeguimientoArchivo] selectedTema:', selectedTema);
    console.log('[PreviewSeguimientoArchivo] url final:', url);
    console.log('[PreviewSeguimientoArchivo] seguimiento:', seguimiento);

    if (!archivoId) {
      this.archivoDownloadError.set('No fue posible abrir el archivo porque no tiene identificador.');
      return;
    }

    if (!temaId) {
      this.archivoDownloadError.set('No fue posible abrir el archivo porque no se encontro el tema relacionado.');
      return;
    }

    this.openArchivoBlob(
      this.archivoKey('seguimiento', archivo),
      archivo.nombreArchivo,
      () => this.temaService.downloadTemaSeguimientoArchivo(archivoId, temaId),
      '[ArchivoSeguimiento]'
    );
  }

  protected temaDisplayName(tema: TemaDTO): string {
    const firstLine = (tema.descripcion ?? '').split('\n')[0]?.trim();
    if (firstLine) {
      return firstLine;
    }
    if (tema.numControl?.trim()) {
      return `Tema ${tema.numControl.trim()}`;
    }
    return 'Tema sin nombre';
  }

  private loadTemaDetail(id: string): void {
    this.loadingDetail.set(true);
    this.detailError.set(null);

    forkJoin({
      tema: this.temaService.getTemaById(id),
      turnos: this.temaService
        .getTemaTurnoByTemaId(id)
        .pipe(catchError(() => of([] as TemaTurnoDTO[]))),
    })
      .pipe(
        finalize(() => this.loadingDetail.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ tema, turnos }) => {
          const normalizedTurnos = Array.isArray(turnos) ? turnos : [];
          this.selectedTema.set(tema);
          this.detailTurnos.set(normalizedTurnos);
          this.patchDetailForm(tema);
          this.loadSeguimientosForTurnos(normalizedTurnos);
        },
        error: () => {
          this.selectedTema.set(null);
          this.detailTurnos.set([]);
          this.detailSeguimientosByTurnoId.set({});
          this.detailSeguimientosLoadingByTurnoId.set({});
          this.detailSeguimientosErrorByTurnoId.set({});
          this.detailError.set('No fue posible cargar el detalle del tema.');
        },
      });
  }

  private loadSeguimientosForTurnos(turnos: TemaTurnoDTO[]): void {
    this.detailSeguimientosByTurnoId.set({});
    this.detailSeguimientosErrorByTurnoId.set({});
    this.expandedSeguimientosByTurnoId.set({});

    if (!turnos.length) {
      this.detailSeguimientosLoadingByTurnoId.set({});
      return;
    }

    this.detailSeguimientosLoadingByTurnoId.set(
      turnos.reduce<Record<string, boolean>>((acc, turno) => {
        acc[turno.id] = true;
        return acc;
      }, {})
    );

    forkJoin(
      turnos.map((turno) =>
        this.temaService.getTemaSeguimientosByTurnoId(turno.id).pipe(
          map((rows) => ({
            turnoId: turno.id,
            seguimientos: this.normalizeSeguimientosResponse(rows),
            error: null as string | null,
          })),
          catchError(() =>
            of({
              turnoId: turno.id,
              seguimientos: [] as TemaSeguimientoDTO[],
              error: 'No fue posible cargar los seguimientos de esta área.',
            })
          )
        )
      )
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results) => {
        this.detailSeguimientosByTurnoId.set(
          results.reduce<Record<string, TemaSeguimientoDTO[]>>((acc, result) => {
            acc[result.turnoId] = result.seguimientos;
            return acc;
          }, {})
        );
        this.detailSeguimientosErrorByTurnoId.set(
          results.reduce<Record<string, string | null>>((acc, result) => {
            acc[result.turnoId] = result.error;
            return acc;
          }, {})
        );
        this.detailSeguimientosLoadingByTurnoId.set(
          results.reduce<Record<string, boolean>>((acc, result) => {
            acc[result.turnoId] = false;
            return acc;
          }, {})
        );
      });
  }

  private openArchivoBlob(
    key: string,
    fileName: string,
    request: () => Observable<Blob>,
    logPrefix = '[Archivo]'
  ): void {
    this.downloadingArchivoKey.set(key);
    this.archivoDownloadError.set(null);
    this.openLoadingFilePreview(fileName || 'documento');

    request()
      .pipe(
        finalize(() => this.downloadingArchivoKey.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (blob) => {
          if (!blob || blob.size === 0) {
            this.archivoDownloadError.set('El archivo está vacío o no pudo recuperarse.');
            this.filePreviewLoading.set(false);
            this.filePreviewError.set('El archivo esta vacio o no pudo recuperarse.');
            return;
          }
          this.setFilePreviewBlob(blob, fileName || 'documento');
        },
        error: (err) => {
          console.error(`${logPrefix} error descarga:`, err);
          this.filePreviewLoading.set(false);
          this.filePreviewError.set('No fue posible cargar la vista previa del archivo. Intenta nuevamente.');
          this.archivoDownloadError.set('No fue posible abrir o descargar el archivo. Intenta nuevamente.');
        },
      });
  }

  protected closeFilePreview(): void {
    const url = this.filePreviewBlobUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.filePreviewOpen.set(false);
    this.filePreviewLoading.set(false);
    this.filePreviewError.set(null);
    this.filePreviewBlobUrl.set(null);
    this.filePreviewBlob.set(null);
    this.filePreviewName.set('');
    this.filePreviewMimeType.set('');
  }

  protected downloadPreviewFile(): void {
    const blob = this.filePreviewBlob();
    if (!blob) {
      return;
    }
    downloadBlob(blob, this.filePreviewName() || 'documento');
  }

  private openLoadingFilePreview(fileName: string): void {
    this.closeFilePreview();
    this.filePreviewName.set(fileName);
    this.filePreviewOpen.set(true);
    this.filePreviewLoading.set(true);
  }

  private setFilePreviewBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    this.filePreviewBlobUrl.set(url);
    this.filePreviewBlob.set(blob);
    this.filePreviewName.set(fileName);
    this.filePreviewMimeType.set(blob.type || this.resolveMimeTypeFromName(fileName));
    this.filePreviewError.set(null);
    this.filePreviewLoading.set(false);
  }

  private resolveMimeTypeFromName(fileName: string): string {
    const normalized = fileName.toLowerCase();
    if (normalized.endsWith('.pdf')) return 'application/pdf';
    if (normalized.endsWith('.png')) return 'image/png';
    if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) return 'image/jpeg';
    if (normalized.endsWith('.webp')) return 'image/webp';
    return '';
  }

  private resolveArchivoId(archivo: TemaArchivoDTO): string {
    const raw = archivo as unknown as Record<string, unknown>;
    const candidates = [
      raw['id'],
      raw['documentoId'],
      raw['archivoId'],
      raw['temaArchivoId'],
      raw['temaSeguimientoArchivoId'],
    ];

    for (const value of candidates) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private patchDetailForm(tema: TemaDTO): void {
    this.detailForm.reset(
      {
        tipoTemaId: tema.tipoTemaId ?? '',
        tipoPrioridadId: tema.tipoPrioridadId ?? '',
        descripcion: tema.descripcion ?? '',
        fechaVencimiento: tema.fechaVencimiento
          ? new Date(tema.fechaVencimiento)
          : null,
        numControl: tema.numControl ?? '',
      },
      { emitEvent: false }
    );
  }

  private loadAreaOptions(): void {
    this.temaService
      .getCatalogo('AREAS')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows: CatalogoDTO[] | unknown) => {
          const source = Array.isArray(rows)
            ? rows
            : Array.isArray((rows as { data?: unknown[] })?.data)
              ? (rows as { data: unknown[] }).data
              : Array.isArray((rows as { items?: unknown[] })?.items)
                ? (rows as { items: unknown[] }).items
                : [];

          const mapped = source
            .map((item) => {
              const row = item as {
                id?: unknown;
                descripcion?: unknown;
                description?: unknown;
                nombre?: unknown;
                activo?: unknown;
              };
              const id = typeof row.id === 'string' ? row.id : '';
              const activo = Number(row.activo ?? 1) === 1;
              const label =
                typeof row.descripcion === 'string'
                  ? row.descripcion
                  : typeof row.description === 'string'
                    ? row.description
                    : typeof row.nombre === 'string'
                      ? row.nombre
                      : '';

              return id && label ? ({ id, label, activo } as AreaOptionWithStatus) : null;
            })
            .filter((x): x is AreaOptionWithStatus => x !== null);

          this.allAreaOptions.set(mapped);
          this.areaOptions.set(mapped.filter((option) => option.activo));
          this.areaCatalogError.set(
            mapped.length ? null : 'No se recibieron áreas del catálogo AREAS.'
          );
        },
        error: () => {
          this.allAreaOptions.set([]);
          this.areaOptions.set([]);
          this.areaCatalogError.set('No fue posible cargar el catálogo AREAS.');
        },
      });
  }

  private loadTipoTemaOptions(): void {
    this.temaService
      .getCatalogo('TIPO_TEMA')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows: CatalogoDTO[] | unknown) => {
          const mapped = this.mapCatalogOptions(rows);
          this.allTipoTemaOptions.set(mapped);
          this.tipoTemaOptions.set(mapped.filter((option) => option.activo));
        },
        error: () => {
          this.allTipoTemaOptions.set([]);
          this.tipoTemaOptions.set([]);
        },
      });
  }

  private loadPrioridadOptions(): void {
    this.temaService
      .getCatalogo('TIPO_PRIORIDAD')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows: CatalogoDTO[] | unknown) => {
          const mapped = this.mapCatalogOptions(rows);
          this.allPrioridadOptions.set(mapped);
          this.prioridadOptions.set(mapped.filter((option) => option.activo));
        },
        error: () => {
          this.allPrioridadOptions.set([]);
          this.prioridadOptions.set([]);
        },
      });
  }

  private loadTipoDocumentoOptions(): void {
    this.temaService
      .getCatalogo('TIPO_DOCUMENTO')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows: CatalogoDTO[] | unknown) => {
          this.tipoDocumentoOptions.set(this.mapCatalogOptions(rows).filter((option) => option.activo));
        },
        error: () => {
          this.tipoDocumentoOptions.set([]);
        },
      });
  }

  private loadSituaciones(): void {
    this.temaService
      .getCatSituaciones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows: CatSituacionDTO[] | unknown) => {
          const source = Array.isArray(rows)
            ? rows
            : Array.isArray((rows as { data?: unknown[] })?.data)
              ? (rows as { data: unknown[] }).data
              : Array.isArray((rows as { items?: unknown[] })?.items)
                ? (rows as { items: unknown[] }).items
                : [];

          this.situacionSolventadaById.set(
            source.reduce<Record<string, boolean>>((acc, item) => {
              const row = item as { id?: unknown; esSolventado?: unknown };
              if (typeof row.id === 'string' && row.id) {
                acc[row.id] = Number(row.esSolventado ?? 0) === 1;
              }
              return acc;
            }, {})
          );
        },
        error: () => {
          this.situacionSolventadaById.set({});
        },
      });
  }

  private normalizeSeguimientosResponse(rows: TemaSeguimientoDTO[] | unknown): TemaSeguimientoDTO[] {
    if (Array.isArray(rows)) {
      return rows;
    }
    if (Array.isArray((rows as { data?: unknown[] })?.data)) {
      return (rows as { data: TemaSeguimientoDTO[] }).data;
    }
    if (Array.isArray((rows as { items?: unknown[] })?.items)) {
      return (rows as { items: TemaSeguimientoDTO[] }).items;
    }
    return [];
  }

  private isSeguimientoSolventado(seguimiento: TemaSeguimientoDTO): boolean {
    return this.situacionSolventadaById()[seguimiento.situacionId] === true || this.isAtendidoLabel(seguimiento.situacion);
  }

  private isAtendidoLabel(label: string): boolean {
    return label.trim().toUpperCase() === 'ATENDIDO';
  }

  private mapCatalogOptions(rows: CatalogoDTO[] | unknown): TemaCatalogOptionWithStatus[] {
    const source = Array.isArray(rows)
      ? rows
      : Array.isArray((rows as { data?: unknown[] })?.data)
        ? (rows as { data: unknown[] }).data
        : Array.isArray((rows as { items?: unknown[] })?.items)
          ? (rows as { items: unknown[] }).items
          : [];

    return source
      .map((item) => {
        const row = item as {
          id?: unknown;
          descripcion?: unknown;
          description?: unknown;
          nombre?: unknown;
          activo?: unknown;
        };
        const id = typeof row.id === 'string' ? row.id : '';
        const activo = Number(row.activo ?? 1) === 1;
        const label =
          typeof row.descripcion === 'string'
            ? row.descripcion
            : typeof row.description === 'string'
              ? row.description
              : typeof row.nombre === 'string'
                ? row.nombre
                : '';

        return id && label ? ({ id, label, activo } as TemaCatalogOptionWithStatus) : null;
      })
      .filter((x): x is TemaCatalogOptionWithStatus => x !== null);
  }

  private optionsWithCurrentInactive(
    activeOptions: TemaCatalogOption[],
    allOptions: TemaCatalogOptionWithStatus[],
    currentId: string
  ): TemaCatalogOption[] {
    if (!currentId || activeOptions.some((option) => option.id === currentId)) {
      return activeOptions;
    }

    const current = allOptions.find((option) => option.id === currentId);
    if (!current) {
      return activeOptions;
    }

    return [
      {
        id: current.id,
        label: `${current.label} (inactivo)`,
      },
      ...activeOptions,
    ];
  }

  private loadTemas(): void {
    this.loading.set(true);
    this.temaService
      .getAllTemas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const normalized = Array.isArray(data)
            ? data
            : Array.isArray((data as unknown as { data?: TemaDTO[] })?.data)
              ? (data as unknown as { data: TemaDTO[] }).data
              : Array.isArray((data as unknown as { items?: TemaDTO[] })?.items)
                ? (data as unknown as { items: TemaDTO[] }).items
                : [];
          this.allTemas.set(normalized);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  protected formatFechaDetalle(value?: string | Date | null): string {
    return formatFechaVencimiento(value, (date) =>
      new Date(date).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }

  private toRow(t: TemaDTO): TemaRow {
    const prioLabel = (t.tipoPrioridad ?? '').toUpperCase();
    const prioridad: TemaRow['prioridad'] =
      prioLabel.includes('ALTA') || prioLabel.includes('URGENT')
        ? 'ALTA'
        : prioLabel.includes('MEDIA')
          ? 'MEDIA'
          : 'BAJA';

    let estado: TemaRow['estado'] = 'Pendiente';
    const progress = this.resolveTemaProgress(t);
    if (t.solventado || (progress.totalAreas > 0 && progress.areasSolventadas === progress.totalAreas)) estado = 'Cerrado';
    else if (prioridad === 'ALTA') estado = 'Urgente';
    else if (prioridad === 'MEDIA' || progress.areasSolventadas > 0) estado = 'En Proceso';

    const parts = (t.descripcion ?? '').split('\n');
    const titulo = parts[0] ?? 'Sin título';
    const subtitulo = parts.slice(1).join(' ').slice(0, 60);

    const vencimientoLabel = formatFechaVencimiento(t.fechaVencimiento, (value) =>
      new Date(value).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    );
    return {
      id: t.id,
      numControl: formatNumControl(t.numControl),
      descripcion: titulo,
      subtitulo,
      area: '—',
      prioridad,
      vencimientoLabel,
      estado,
      totalAreas: progress.totalAreas,
      areasSolventadas: progress.areasSolventadas,
      progresoPorcentaje: progress.porcentaje,
      progresoLabel: `${progress.areasSolventadas} de ${progress.totalAreas} areas completadas`,
      vencimientoRank: this.resolveVencimientoRank(t),
    };
  }

  protected trackByDetailSelectedFile(_: number, file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  protected onDetailFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    if (file) {
      this.detailSelectedFiles.set([file]);
      this.detailError.set(null);
    }
    if (input) {
      input.value = '';
    }
  }

  protected removeDetailSelectedFile(fileToRemove: File): void {
    this.detailSelectedFiles.set(
      this.detailSelectedFiles().filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          )
      )
    );
    if (!this.detailSelectedFiles().length) {
      this.detailUploadTipoDocumentoId.set('');
    }
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private clearDetailUploadState(): void {
    this.detailSelectedFiles.set([]);
    this.detailUploadTipoDocumentoId.set('');
  }

  private resolveTemaProgress(t: TemaDTO): { totalAreas: number; areasSolventadas: number; porcentaje: number } {
    const turnos = Array.isArray((t as TemaDTO & { turnos?: Array<{ solventado?: unknown }> }).turnos)
      ? ((t as TemaDTO & { turnos?: Array<{ solventado?: unknown }> }).turnos ?? [])
      : [];
    const totalAreas = turnos.length;
    const areasSolventadas = turnos.filter((turno) => this.isTruthyFlag((turno as { solventado?: unknown }).solventado)).length;
    const porcentaje = totalAreas > 0 ? (areasSolventadas / totalAreas) * 100 : 0;

    return { totalAreas, areasSolventadas, porcentaje };
  }

  private compareRowsByOperationalStatus(left: TemaRow, right: TemaRow): number {
    const leftClosed = left.estado === 'Cerrado';
    const rightClosed = right.estado === 'Cerrado';
    if (leftClosed !== rightClosed) {
      return leftClosed ? 1 : -1;
    }

    if (!leftClosed && !rightClosed) {
      const vencimientoDiff = (left.vencimientoRank ?? 3) - (right.vencimientoRank ?? 3);
      if (vencimientoDiff !== 0) {
        return vencimientoDiff;
      }
    }

    const order: Record<TemaRow['estado'], number> = {
      Urgente: 0,
      'En Proceso': 1,
      Pendiente: 2,
      Abierto: 3,
      Cerrado: 4,
    };
    const orderDiff = order[left.estado] - order[right.estado];
    if (orderDiff !== 0) {
      return orderDiff;
    }

    return this.resolveControlOrder(right.numControl) - this.resolveControlOrder(left.numControl);
  }

  private resolveControlOrder(numControl: string): number {
    const parsed = Number((numControl || '').replace(/\D/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private resolveVencimientoRank(t: TemaDTO): number {
    if (!t.fechaVencimiento) {
      return 3;
    }
    const date = new Date(t.fechaVencimiento);
    if (Number.isNaN(date.getTime())) {
      return 3;
    }
    const days = this.daysUntil(date);
    if (days < 0) {
      return 0;
    }
    if (days <= 7) {
      return 1;
    }
    return 3;
  }

  private daysUntil(date: Date): number {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.ceil((startOfTarget.getTime() - startOfToday.getTime()) / 86400000);
  }

  private isTruthyFlag(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === '1' || normalized === 'true' || normalized === 'si' || normalized === 'sí';
    }
    return false;
  }
}
