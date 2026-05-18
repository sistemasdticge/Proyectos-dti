import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  CatalogoFormValue,
  CatalogoRecord,
  CatalogosFormModalComponent,
  CatalogosGridComponent,
  CatalogosHeaderComponent,
  CatalogosTableComponent,
  CatalogoSummaryCard,
  CatalogoType,
  pageSectionEnterAnimation,
} from '@proyectos-dti/shared-ui';
import { CatalogosService } from '@proyectos-dti/shared-ui';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

const CATALOGO_META: Record<CatalogoType, { title: string; subtitle: string; icon: string; accentClass: string }> = {
  AREA: {
    title: 'Área',
    subtitle: 'Áreas responsables y operativas del sistema.',
    icon: 'pi pi-sitemap',
    accentClass: 'bg-gradient-to-br from-[#8B1A2E] to-[#c83b58]',
  },
  SITUACION: {
    title: 'Situación',
    subtitle: 'Estados funcionales para seguimiento institucional.',
    icon: 'pi pi-flag',
    accentClass: 'bg-gradient-to-br from-[#1f6aa5] to-[#3ea0d6]',
  },
  TIPO_DOCUMENTO: {
    title: 'Tipo de Documento',
    subtitle: 'Clasificaciones documentales y soporte digital.',
    icon: 'pi pi-file',
    accentClass: 'bg-gradient-to-br from-[#7d5c14] to-[#d3a032]',
  },
  TIPO_TEMA: {
    title: 'Tipo de Tema',
    subtitle: 'Taxonomía de asuntos y temas institucionales.',
    icon: 'pi pi-folder-open',
    accentClass: 'bg-gradient-to-br from-[#245c43] to-[#39a576]',
  },
  PRIORIDAD: {
    title: 'Prioridad',
    subtitle: 'Niveles de urgencia para clasificar asuntos.',
    icon: 'pi pi-arrow-up-right',
    accentClass: 'bg-gradient-to-br from-[#5b3090] to-[#8e5fcf]',
  },
  TIPO_USUARIO: {
    title: 'Tipo de Usuario',
    subtitle: 'Perfiles disponibles para alta de usuarios.',
    icon: 'pi pi-user',
    accentClass: 'bg-gradient-to-br from-[#334155] to-[#64748b]',
  },
};

const EMPTY_RECORDS: Record<CatalogoType, CatalogoRecord[]> = {
  AREA: [],
  SITUACION: [],
  TIPO_DOCUMENTO: [],
  TIPO_TEMA: [],
  PRIORIDAD: [],
  TIPO_USUARIO: [],
};

@Component({
  selector: 'app-catalogos-page',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    CatalogosHeaderComponent,
    CatalogosGridComponent,
    CatalogosTableComponent,
    CatalogosFormModalComponent,
  ],
  templateUrl: './catalogos-page.html',
  styleUrl: './catalogos-page.scss',
  animations: [pageSectionEnterAnimation],
})
export class CatalogosPage implements OnInit {
  private readonly catalogosService = inject(CatalogosService);
  private readonly messageService = inject(MessageService);

  protected readonly selectedType = signal<CatalogoType>('AREA');
  protected readonly records = signal<Record<CatalogoType, CatalogoRecord[]>>(EMPTY_RECORDS);
  protected readonly loadingType = signal<CatalogoType | null>(null);
  protected readonly showModal = signal(false);
  protected readonly modalMode = signal<'create' | 'edit'>('create');
  protected readonly selectedRecord = signal<CatalogoRecord | null>(null);

  protected readonly cards = computed<CatalogoSummaryCard[]>(() => {
    const source = this.records();
    return (Object.keys(CATALOGO_META) as CatalogoType[]).map((type) => ({
      type,
      title: CATALOGO_META[type].title,
      subtitle: CATALOGO_META[type].subtitle,
      icon: CATALOGO_META[type].icon,
      accentClass: CATALOGO_META[type].accentClass,
      count: source[type].length,
    }));
  });

  protected readonly activeRows = computed(() => this.records()[this.selectedType()]);
  protected readonly activeMeta = computed(() => CATALOGO_META[this.selectedType()]);
  protected readonly isLoading = computed(() => this.loadingType() === this.selectedType());

  ngOnInit(): void {
    this.loadType(this.selectedType());
  }

  protected selectType(type: CatalogoType): void {
    this.selectedType.set(type);
    // Solo carga si no tiene datos aún
    if (this.records()[type].length === 0) {
      this.loadType(type);
    }
  }

  protected openCreate(): void {
    this.modalMode.set('create');
    this.selectedRecord.set(null);
    this.showModal.set(true);
  }

  protected openEdit(record: CatalogoRecord): void {
    this.modalMode.set('edit');
    this.selectedRecord.set(record);
    this.showModal.set(true);
  }

  protected handleSave(payload: CatalogoFormValue): void {
    const type = this.selectedType();

    if (this.modalMode() === 'edit' && this.selectedRecord()) {
      const record = this.selectedRecord() as CatalogoRecord;
      console.log('[CatalogosPage] Edit descripcion submit', {
        type,
        id: record.id,
        oldDescripcion: record.descripcion,
        newDescripcion: payload.descripcion,
      });
      this.catalogosService.updateDescription(type, record, payload.descripcion).subscribe({
        next: (updated) => {
          this.records.update((curr) => ({
            ...curr,
            [type]: this.visibleRecordsForType(type, curr[type].map((r) => (r.id === updated.id ? updated : r))),
          }));
          this.selectedRecord.set(null);
          this.showModal.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Guardado',
            detail: `Descripción de ${CATALOGO_META[type].title} actualizada correctamente.`,
            life: 3500,
          });
        },
        error: (err) => {
          console.error('Error al editar descripcion:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo guardar el cambio. Intenta de nuevo.',
            life: 4000,
          });
        },
      });
      return;
    }

    this.catalogosService.create(type, payload.descripcion).subscribe({
      next: (newRecord) => {
        this.records.update((curr) => ({
          ...curr,
          [type]: this.visibleRecordsForType(type, [newRecord, ...curr[type]]),
        }));
        this.showModal.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Creado',
          detail: `Nuevo registro de ${CATALOGO_META[type].title} creado correctamente.`,
          life: 3500,
        });
      },
      error: (err) => {
        console.error('Error al crear registro:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el registro. Intenta de nuevo.',
          life: 4000,
        });
      },
    });
  }

  protected handleToggle(payload: { record: CatalogoRecord; active: boolean }): void {
    const type = this.selectedType();
    console.log('[CatalogosPage] Toggle submit', {
      type,
      id: payload.record.id,
      previousActive: payload.record.activo,
      desiredActive: payload.active,
      estatusEnviado: payload.active ? 1 : 0,
    });
    this.catalogosService.toggleActive(type, payload.record, payload.active).subscribe({
      next: (updated) => {
        this.records.update((curr) => ({
          ...curr,
          [type]: this.visibleRecordsForType(type, curr[type].map((r) => (r.id === updated.id ? updated : r))),
        }));
        const estadoLabel = updated.activo ? 'activado' : 'desactivado';
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `Registro "${updated.descripcion}" ${estadoLabel} correctamente.`,
          life: 3000,
        });
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado. Intenta de nuevo.',
          life: 4000,
        });
      },
    });
  }

  private loadType(type: CatalogoType): void {
    this.loadingType.set(type);
    this.catalogosService.getAll(type).subscribe({
      next: (rows) => {
        this.records.update((curr) => ({ ...curr, [type]: this.visibleRecordsForType(type, rows) }));
        this.loadingType.set(null);
      },
      error: (err) => {
        console.error(`Error al cargar ${type}:`, err);
        this.loadingType.set(null);
      },
    });
  }

  private visibleRecordsForType(type: CatalogoType, rows: CatalogoRecord[]): CatalogoRecord[] {
    if (type !== 'TIPO_USUARIO') {
      return rows;
    }

    return rows.filter((row) => row.descripcion?.trim().toUpperCase() !== 'SUPERUSUARIO');
  }
}
