import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { CatalogoFormValue } from '../catalogos.models';

@Component({
  selector: 'lib-catalogos-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, TextareaModule],
  templateUrl: './catalogos-form-modal.component.html',
})
export class CatalogosFormModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() typeLabel = 'Catálogo';
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() initialDescripcion = '';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<CatalogoFormValue>();

  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    descripcion: ['', [Validators.required, Validators.maxLength(400)]],
  });

  protected get dialogTitle(): string {
    return this.mode === 'edit' ? `Editar ${this.typeLabel}` : `Nuevo ${this.typeLabel}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] || changes['initialDescripcion'] || changes['mode']) && this.visible) {
      this.form.reset({ descripcion: this.initialDescripcion ?? '' }, { emitEvent: false });
    }
  }

  protected close(): void {
    this.visibleChange.emit(false);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit({ descripcion: this.form.value.descripcion ?? '' });
    this.close();
  }
}
