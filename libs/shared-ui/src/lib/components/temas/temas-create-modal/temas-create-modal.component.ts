import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';
import { TemaService } from '../../../services/tema.service';
import { TemaDTO } from '../../../models/tema.model';

export interface AreaOption {
  id: string;
  label: string;
}

export interface TemaCatalogOption {
  id: string;
  label: string;
}

@Component({
  selector: 'lib-temas-create-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    MultiSelectModule,
    SelectModule,
    DatePickerModule,
    MessageModule,
  ],
  templateUrl: './temas-create-modal.component.html',
})
export class TemasCreateModalComponent implements OnChanges {
  /** Controla si el diálogo está abierto */
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Opciones de áreas a mostrar (el consumer las inyecta) */
  @Input() areaOptions: AreaOption[] = [];
  @Input() tipoTemaOptions: TemaCatalogOption[] = [];
  @Input() prioridadOptions: TemaCatalogOption[] = [];
  @Input() tipoDocumentoOptions: TemaCatalogOption[] = [];

  /** Emitido cuando el tema se creó con éxito */
  @Output() created = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly temaService = inject(TemaService);
  private readonly destroyRef = inject(DestroyRef);

  protected saving = false;
  protected feedbackMsg = '';
  protected feedbackError = false;
  protected selectedFiles: File[] = [];
  protected readonly minDate = new Date();

  protected form = this.fb.nonNullable.group({
    tipoTemaId:   ['', Validators.required],
    tipoPrioridadId: ['', Validators.required],
    titulo:      ['', [Validators.required, Validators.maxLength(180)]],
    descripcion: ['', [Validators.required, Validators.maxLength(800)]],
    areaIds:     [[] as string[], Validators.required],
    fechaLimite: [null as Date | null],        // opcional
    numControl:  [''],                          // opcional
    tipoDocumentoId: [''],                       // requerido solo con archivo
  });

  ngOnChanges(): void {
    if (this.visible) {
      this.minDate.setHours(0, 0, 0, 0);
      this.form.reset({
        tipoTemaId: this.tipoTemaOptions[0]?.id ?? '',
        tipoPrioridadId: this.prioridadOptions[0]?.id ?? '',
        titulo: '',
        descripcion: '',
        areaIds: [],
        fechaLimite: null,
        numControl: '',
        tipoDocumentoId: '',
      });
      this.selectedFiles = [];
      this.feedbackMsg   = '';
      this.feedbackError = false;
    }
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFiles = file ? [file] : [];
    if (!file) {
      this.form.controls.tipoDocumentoId.setValue('');
    }
    this.form.controls.tipoDocumentoId.updateValueAndValidity();
  }

  protected close(): void {
    this.visibleChange.emit(false);
  }

  protected submit(): void {
    this.feedbackMsg = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.feedbackMsg   = 'Completa los campos obligatorios.';
      this.feedbackError = true;
      return;
    }

    const {
      tipoTemaId,
      tipoPrioridadId,
      titulo,
      descripcion,
      areaIds,
      fechaLimite,
      numControl,
      tipoDocumentoId,
    } = this.form.getRawValue();

    if (!areaIds.length) {
      this.feedbackMsg   = 'Selecciona al menos un área responsable.';
      this.feedbackError = true;
      return;
    }

    if (this.selectedFiles.length > 0 && !tipoDocumentoId.trim()) {
      this.form.controls.tipoDocumentoId.markAsTouched();
      this.feedbackMsg = 'Selecciona el tipo de documento para adjuntar archivo.';
      this.feedbackError = true;
      return;
    }

    const turnos = areaIds.map((areaId) => {
      const opt = this.areaOptions.find((a) => a.id === areaId);
      return {
        areaId,
        area: opt?.label ?? areaId,
      };
    });

    const temaPayload: Partial<TemaDTO> = {
      tipoTemaId,
      tipoPrioridadId,
      descripcion:      `${titulo}\n${descripcion}`,
      turnos,
      fechaVencimiento: fechaLimite ? fechaLimite.toISOString() : '',
      numControl: numControl?.trim() ?? '',
    };

    if (this.selectedFiles.length > 0 && tipoDocumentoId.trim()) {
      temaPayload.tipoDocumentoId = tipoDocumentoId.trim();
    }

    console.log('[Temas] Create payload (POST /Tema)', {
      temaR: temaPayload,
      hasFile: this.selectedFiles.length > 0,
      fileName: this.selectedFiles[0]?.name ?? '(sin archivo)',
      formDataFileKey: this.selectedFiles.length > 0 ? 'formFiles' : '(sin archivo)',
      tipoDocumentoId: this.selectedFiles.length > 0 ? tipoDocumentoId.trim() : '(sin archivo)',
      areaIds,
    });

    this.saving = true;

    this.temaService.createTema(temaPayload, this.selectedFiles.length ? this.selectedFiles : undefined)
      .pipe(
        finalize(() => {
          this.saving = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (createdTema) => {
          console.log('[Temas] Tema creado (POST /Tema)', {
            id: createdTema?.id,
            archivos: Array.isArray(createdTema?.archivos) ? createdTema.archivos.length : 0,
            turnosEnviados: turnos.length,
            response: createdTema,
          });
          this.created.emit();
          this.close();
        },
        error: () => {
          this.feedbackMsg   = 'No fue posible registrar el tema. Verifica los datos e intenta de nuevo.';
          this.feedbackError = true;
        },
      });
  }
}
