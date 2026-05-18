import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import {
  CatSituacionDTO,
  CatalogoDTO,
  DocumentViewerComponent,
  pageSectionEnterAnimation,
  TemaArchivoDTO,
  TemaDTO,
  TemaSeguimientoDTO,
  TemaService,
  TemaTurnoDTO,
} from '@proyectos-dti/shared-ui';
import { downloadBlob } from '@proyectos-dti/shared-ui';
import { Observable, finalize, forkJoin } from 'rxjs';

interface SituacionOption {
  id: string;
  label: string;
  esSolventado: number;
  activo: boolean;
}

interface TipoDocumentoOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-detalle-tarea-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DocumentViewerComponent,
    TagModule,
    SelectModule,
    Textarea,
    DatePipe,
  ],
  providers: [ConfirmationService],
  templateUrl: './detalle-tarea-page.html',
  styleUrl: './detalle-tarea-page.scss',
  animations: [pageSectionEnterAnimation],
})
export class DetalleTareaPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly temaService = inject(TemaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly turno = signal<TemaTurnoDTO | null>(null);
  protected readonly tema = signal<TemaDTO | null>(null);
  protected readonly seguimientos = signal<TemaSeguimientoDTO[]>([]);
  protected readonly situacionOptions = signal<SituacionOption[]>([]);
  private readonly situacionSolventadaById = signal<Record<string, boolean>>({});
  protected readonly tipoDocumentoOptions = signal<TipoDocumentoOption[]>([]);
  protected readonly loadingSituaciones = signal(false);
  protected readonly loadingTipoDocumentoOptions = signal(false);
  protected readonly savingSeguimiento = signal(false);
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly submitMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  protected readonly canSubmitSeguimiento = signal(false);
  protected readonly downloadingArchivoKey = signal<string | null>(null);
  protected readonly archivoDownloadError = signal<string | null>(null);
  protected readonly filePreviewOpen = signal(false);
  protected readonly filePreviewLoading = signal(false);
  protected readonly filePreviewError = signal<string | null>(null);
  protected readonly filePreviewBlobUrl = signal<string | null>(null);
  protected readonly filePreviewBlob = signal<Blob | null>(null);
  protected readonly filePreviewName = signal('');
  protected readonly filePreviewMimeType = signal('');

  protected readonly hasSeguimientos = computed(() => this.seguimientos().length > 0);
  protected readonly temaAtendido = computed(() => this.seguimientos().some((seguimiento) => this.isSeguimientoSolventado(seguimiento)));
  protected readonly selectedSituacionSolventada = computed(() => {
    const situacionId = this.seguimientoForm.controls.situacionId.value.trim();
    if (!situacionId) {
      return false;
    }
    const situacionLabel = this.situacionOptions().find((option) => option.id === situacionId)?.label ?? '';
    return this.isSituacionSolventada(situacionId) || this.isAtendidoLabel(situacionLabel);
  });

  protected readonly seguimientoForm = this.formBuilder.nonNullable.group({
    descripcion: ['', [Validators.required, Validators.maxLength(1500), this.nonWhitespaceValidator]],
    situacionId: ['', Validators.required],
    tipoDocumentoId: [''],
  });

  constructor() {
    this.loadDetail();
    this.loadSituaciones();
    this.loadTipoDocumentoOptions();
    this.seguimientoForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateSubmitState());
    this.seguimientoForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateSubmitState());
    this.updateSubmitState();
  }

  protected goBack(): void {
    void this.router.navigate(['/app/seguimientos']);
  }

  protected turnoStatusLabel(): string {
    const turno = this.turno();
    return turno && Number(turno.solventado) === 1 ? 'Solventado' : 'Pendiente';
  }

  protected turnoStatusSeverity(): 'success' | 'warn' {
    const turno = this.turno();
    return turno && Number(turno.solventado) === 1 ? 'success' : 'warn';
  }

  protected prioridadSeverity(): 'danger' | 'warn' | 'success' | 'secondary' {
    const tema = this.tema();
    const prioLabel = (tema?.tipoPrioridad ?? '').toUpperCase();

    if (prioLabel.includes('ALTA') || prioLabel.includes('URGENT')) {
      return 'danger';
    }
    if (prioLabel.includes('MEDIA')) {
      return 'warn';
    }
    if (prioLabel.includes('BAJA')) {
      return 'success';
    }
    return 'secondary';
  }

  protected trackBySeguimientoId(_: number, seguimiento: TemaSeguimientoDTO): string {
    return seguimiento.id;
  }

  protected trackBySelectedFile(_: number, file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  protected seguimientoSituacionSeverity(seguimiento: TemaSeguimientoDTO): 'success' | 'info' {
    return this.isSeguimientoSolventado(seguimiento) ? 'success' : 'info';
  }

  protected archivoKey(archivo: TemaArchivoDTO): string {
    return `seguimiento:${archivo.id || archivo.nombreArchivo || 'sin-id'}`;
  }

  protected isArchivoDownloading(archivo: TemaArchivoDTO): boolean {
    return this.downloadingArchivoKey() === this.archivoKey(archivo);
  }

  protected viewSeguimientoArchivo(archivo: TemaArchivoDTO): void {
    const tema = this.tema();

    if (!archivo.id || !tema?.id) {
      this.archivoDownloadError.set('No fue posible abrir el archivo porque falta información del documento.');
      return;
    }

    this.openArchivoBlob(
      this.archivoKey(archivo),
      archivo.nombreArchivo,
      () => this.temaService.downloadTemaSeguimientoArchivo(archivo.id, tema.id)
    );
  }

  protected showControlInvalid(controlName: 'descripcion' | 'situacionId'): boolean {
    const control = this.seguimientoForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected requiresTipoDocumento(): boolean {
    return this.selectedFiles().length > 0;
  }

  protected hasFilesWithoutTipoDocumento(): boolean {
    return this.requiresTipoDocumento() && !this.seguimientoForm.controls.tipoDocumentoId.value.trim();
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const files = Array.from(input?.files ?? []);

    if (!files.length) {
      return;
    }

    this.selectedFiles.set([files[0]]);
    this.updateSubmitState();
    input!.value = '';
  }

  protected removeSelectedFile(fileToRemove: File): void {
    this.selectedFiles.set(
      this.selectedFiles().filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          )
      )
    );
    this.updateSubmitState();
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

  protected submitSeguimiento(): void {
    console.log('[Seguimiento] submit triggered');
    console.log('[Seguimiento] form valid:', this.seguimientoForm.valid);

    if (this.temaAtendido()) {
      console.warn('[Seguimiento] tema atendido, no se permiten nuevos seguimientos');
      this.submitMessage.set({
        type: 'error',
        text: 'Este tema ya fue atendido. No es posible registrar nuevos seguimientos.',
      });
      this.updateSubmitState();
      return;
    }

    if (!this.turno()) {
      console.warn('[Seguimiento] turno no disponible, no se envia el seguimiento');
      return;
    }

    if (this.seguimientoForm.invalid) {
      console.warn('[Seguimiento] formulario invalido', {
        descripcion: this.seguimientoForm.controls.descripcion.value,
        situacionId: this.seguimientoForm.controls.situacionId.value,
        tipoDocumentoId: this.seguimientoForm.controls.tipoDocumentoId.value,
        errors: {
          descripcion: this.seguimientoForm.controls.descripcion.errors,
          situacionId: this.seguimientoForm.controls.situacionId.errors,
        },
      });
      this.seguimientoForm.markAllAsTouched();
      return;
    }

    const turno = this.turno();
    if (!turno) {
      console.warn('[Seguimiento] turno nulo despues de validacion, se cancela el submit');
      return;
    }

    const descripcion = this.seguimientoForm.controls.descripcion.value.trim();
    const situacionId = this.seguimientoForm.controls.situacionId.value.trim();
    const tipoDocumentoId = this.seguimientoForm.controls.tipoDocumentoId.value.trim();
    const situacionLabel =
      this.situacionOptions().find((option) => option.id === situacionId)?.label ?? 'Situacion seleccionada';
    const files = this.selectedFiles();
    const isCatalogSolventado = this.isSituacionSolventada(situacionId);
    const isSolventado = isCatalogSolventado || this.isAtendidoLabel(situacionLabel);

    if (files.length > 0 && !tipoDocumentoId) {
      console.warn('[Seguimiento] tipoDocumentoId requerido cuando hay archivos adjuntos');
      this.submitMessage.set({
        type: 'error',
        text: 'Selecciona el tipo de documento para adjuntar archivos.',
      });
      this.updateSubmitState();
      return;
    }

    if (isCatalogSolventado) {
      this.confirmationService.confirm({
        header: 'Cerrar tema para tu área',
        message:
          'Este seguimiento marcará el tema como atendido para tu área. Después de guardar, ya no podrás registrar más seguimientos. ¿Deseas continuar?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Confirmar',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-danger',
        rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
        accept: () => this.persistSeguimiento(turno, descripcion, situacionId, tipoDocumentoId, situacionLabel, files, isSolventado),
        reject: () => console.log('[Seguimiento] guardado cancelado por confirmacion de situacion solventada'),
      });
      return;
    }

    this.persistSeguimiento(turno, descripcion, situacionId, tipoDocumentoId, situacionLabel, files, isSolventado);
  }

  private persistSeguimiento(
    turno: TemaTurnoDTO,
    descripcion: string,
    situacionId: string,
    tipoDocumentoId: string,
    situacionLabel: string,
    files: File[],
    isSolventado: boolean
  ): void {
    const payload: Record<string, string> = {
      TemaTurnoId: turno.id,
      SituacionId: situacionId,
      descripcion,
      fecha: new Date().toISOString(),
    };

    if (files.length > 0 && tipoDocumentoId) {
      payload['tipoDocumentoId'] = tipoDocumentoId;
    }
    const temaRString = JSON.stringify(payload);

    console.log('[Seguimiento] TemaTurnoId:', turno.id);
    console.log('[Seguimiento] SituacionId:', situacionId);
    console.log('[Seguimiento] tipoDocumentoId:', tipoDocumentoId || '(sin tipoDocumentoId)');
    console.log('[Seguimiento] temaR objeto:', payload);
    console.log('[Seguimiento] temaR string:', temaRString);
    console.log('[Seguimiento] cantidad de archivos:', files.length);
    files.forEach((file, index) => {
      console.log(`[Seguimiento] archivo ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
      });
    });

    this.savingSeguimiento.set(true);
    this.submitMessage.set(null);

    this.temaService
      .createTemaSeguimiento(payload, files)
      .pipe(
        finalize(() => this.savingSeguimiento.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (created) => {
          const normalized: TemaSeguimientoDTO = {
            ...created,
            temaTurnoId: created.temaTurnoId || turno.id,
            descripcion: created.descripcion || descripcion,
            situacionId: created.situacionId || situacionId,
            situacion: created.situacion || situacionLabel,
            fecha: created.fecha || new Date().toISOString(),
            archivos: Array.isArray(created.archivos) ? created.archivos : [],
          };

          this.seguimientos.update((current) => [normalized, ...current]);
          this.seguimientoForm.reset({
            descripcion: '',
            situacionId: '',
            tipoDocumentoId: '',
          });
          this.selectedFiles.set([]);
          if (isSolventado) {
            this.turno.update((current) =>
              current
                ? {
                    ...current,
                    solventado: 1,
                    fechaSolventado: normalized.fecha,
                  }
                : current
            );
          }
          this.updateSubmitState();
          this.seguimientoForm.markAsPristine();
          this.seguimientoForm.markAsUntouched();
          this.submitMessage.set({
            type: 'success',
            text: isSolventado
              ? 'Seguimiento guardado correctamente. El tema quedó atendido para tu área.'
              : 'Seguimiento guardado correctamente.',
          });
        },
        error: (err) => {
          const backendErrorString =
            typeof err?.error === 'string'
              ? err.error
              : err?.error && typeof err.error === 'object'
                ? JSON.stringify(err.error, null, 2)
                : null;

          console.error('[Seguimiento] error al guardar:', {
            turnoId: turno.id,
            temaR: payload,
            temaRString,
            files: files.map((file) => ({
              name: file.name,
              size: file.size,
              type: file.type,
            })),
            status: err?.status,
            statusText: err?.statusText,
            message: err?.message,
            url: err?.url,
            error: err?.error,
            backendError: err,
          });
          if (backendErrorString) {
            console.error('[Seguimiento] backend error payload:', backendErrorString);
          }
          console.warn('[Seguimiento] Revisar Network > Response para ver detalle real del 400');
          this.submitMessage.set({
            type: 'error',
            text: 'No fue posible guardar el seguimiento. Intenta nuevamente.',
          });
        },
      });
  }

  protected isSubmitDisabled(): boolean {
    return !this.canSubmitSeguimiento() || this.savingSeguimiento();
  }

  private loadDetail(): void {
    const turnoId = this.route.snapshot.paramMap.get('turnoId')?.trim() ?? '';

    if (!turnoId) {
      this.loading.set(false);
      this.errorMessage.set('No se encontró el identificador del tema.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.temaService
      .getTemaTurnoById(turnoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (turno) => {
          this.turno.set(turno);
          this.updateSubmitState();
          this.loadTemaAndSeguimientos(turnoId, turno.temaId);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('No fue posible cargar el detalle del tema.');
          this.updateSubmitState();
        },
      });
  }

  private openArchivoBlob(key: string, fileName: string, request: () => Observable<Blob>): void {
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
        error: () => {
          this.archivoDownloadError.set('No fue posible abrir o descargar el archivo. Intenta nuevamente.');
          this.filePreviewLoading.set(false);
          this.filePreviewError.set('No fue posible cargar la vista previa del archivo. Intenta nuevamente.');
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

  private loadTemaAndSeguimientos(turnoId: string, temaId: string): void {
    forkJoin({
      tema: this.temaService.getTemaById(temaId),
      seguimientos: this.temaService.getTemaSeguimientosByTurnoId(turnoId),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ tema, seguimientos }) => {
          const normalizedSeguimientos = Array.isArray(seguimientos)
            ? seguimientos
            : Array.isArray((seguimientos as unknown as { data?: TemaSeguimientoDTO[] })?.data)
              ? (seguimientos as unknown as { data: TemaSeguimientoDTO[] }).data
              : Array.isArray((seguimientos as unknown as { items?: TemaSeguimientoDTO[] })?.items)
                ? (seguimientos as unknown as { items: TemaSeguimientoDTO[] }).items
                : [];

          this.tema.set(tema);
          this.seguimientos.set(normalizedSeguimientos);
          this.updateSubmitState();
        },
        error: () => {
          this.tema.set(null);
          this.seguimientos.set([]);
          this.errorMessage.set('No fue posible cargar la información completa del tema.');
        },
      });
  }

  private loadSituaciones(): void {
    this.loadingSituaciones.set(true);

    this.temaService
      .getCatSituaciones()
      .pipe(
        finalize(() => this.loadingSituaciones.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (rows: CatSituacionDTO[] | unknown) => {
          const source = Array.isArray(rows)
            ? rows
            : Array.isArray((rows as { data?: unknown[] })?.data)
              ? (rows as { data: unknown[] }).data
              : Array.isArray((rows as { items?: unknown[] })?.items)
                ? (rows as { items: unknown[] }).items
                : [];

          const mapped = source
            .map((item) => {
              const row = item as { id?: unknown; descripcion?: unknown; esSolventado?: unknown; activo?: unknown };
              const id = typeof row.id === 'string' ? row.id : '';
              const label = typeof row.descripcion === 'string' ? row.descripcion : '';
              const esSolventado = Number(row.esSolventado ?? 0);
              const activo = Number(row.activo ?? 1) === 1;
              return id && label ? ({ id, label, esSolventado, activo } as SituacionOption) : null;
            })
            .filter((option): option is SituacionOption => option !== null);

          this.situacionSolventadaById.set(
            mapped.reduce<Record<string, boolean>>((acc, option) => {
              acc[option.id] = Number(option.esSolventado) === 1;
              return acc;
            }, {})
          );
          this.situacionOptions.set(mapped.filter((option) => option.activo));
          this.updateSubmitState();
        },
        error: () => {
          this.situacionOptions.set([]);
          this.situacionSolventadaById.set({});
          this.updateSubmitState();
        },
      });
  }

  private loadTipoDocumentoOptions(): void {
    this.loadingTipoDocumentoOptions.set(true);

    this.temaService
      .getCatalogo('TIPO_DOCUMENTO')
      .pipe(
        finalize(() => this.loadingTipoDocumentoOptions.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
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
              const row = item as { id?: unknown; descripcion?: unknown; activo?: unknown };
              const id = typeof row.id === 'string' ? row.id : '';
              const label = typeof row.descripcion === 'string' ? row.descripcion : '';
              const activo = Number(row.activo ?? 1) === 1;
              return id && label && activo ? ({ id, label } as TipoDocumentoOption) : null;
            })
            .filter((option): option is TipoDocumentoOption => option !== null);

          this.tipoDocumentoOptions.set(mapped);
        },
        error: () => {
          this.tipoDocumentoOptions.set([]);
        },
      });
  }

  private updateSubmitState(): void {
    const situacionId = this.seguimientoForm.controls.situacionId.value;
    const descripcion = this.seguimientoForm.controls.descripcion.value;
    const tipoDocumentoId = this.seguimientoForm.controls.tipoDocumentoId.value;
    const hasValidDescription = descripcion.trim().length > 0;
    const hasSituacion = typeof situacionId === 'string' && situacionId.trim().length > 0;
    const hasRequiredTipoDocumento =
      this.selectedFiles().length === 0 || (typeof tipoDocumentoId === 'string' && tipoDocumentoId.trim().length > 0);
    const finalState =
      hasSituacion &&
      hasValidDescription &&
      hasRequiredTipoDocumento &&
      this.seguimientoForm.valid &&
      !!this.turno() &&
      !this.temaAtendido();

    this.canSubmitSeguimiento.set(finalState);

    console.log('[Seguimiento] submit state:', {
      formValid: this.seguimientoForm.valid,
      situacionId,
      descripcion,
      hasRequiredTipoDocumento,
      selectedFilesCount: this.selectedFiles().length,
      temaAtendido: this.temaAtendido(),
      canSubmit: finalState,
    });
  }

  private isSeguimientoSolventado(seguimiento: TemaSeguimientoDTO): boolean {
    return this.isSituacionSolventada(seguimiento.situacionId) || this.isAtendidoLabel(seguimiento.situacion);
  }

  private isSituacionSolventada(situacionId: string): boolean {
    return (
      this.situacionSolventadaById()[situacionId] === true ||
      Number(this.situacionOptions().find((option) => option.id === situacionId)?.esSolventado ?? 0) === 1
    );
  }

  private isAtendidoLabel(label: string): boolean {
    return label.trim().toUpperCase() === 'ATENDIDO';
  }

  private nonWhitespaceValidator(control: AbstractControl<string>): ValidationErrors | null {
    const value = typeof control.value === 'string' ? control.value : '';
    return value.trim().length > 0 ? null : { whitespace: true };
  }
}
