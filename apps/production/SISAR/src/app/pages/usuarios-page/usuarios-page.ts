import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { finalize } from 'rxjs';
import {
  CatalogosService,
  pageSectionEnterAnimation,
  UsuarioCreateDTO,
  UsuarioDTO,
  UsuariosService,
} from '@proyectos-dti/shared-ui';

interface UsuarioSelectOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
  ],
  templateUrl: './usuarios-page.html',
  styleUrl: './usuarios-page.scss',
  animations: [pageSectionEnterAnimation],
  providers: [ConfirmationService],
})
export class UsuariosPage {
  private readonly usuariosService = inject(UsuariosService);
  private readonly catalogosService = inject(CatalogosService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly loadingAreas = signal(false);
  protected readonly loadingTipoUsuarios = signal(false);
  protected readonly creatingUsuario = signal(false);
  protected readonly deletingUserId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly areaErrorMessage = signal<string | null>(null);
  protected readonly showCreateModal = signal(false);
  protected readonly usuarios = signal<UsuarioDTO[]>([]);
  protected readonly areaOptions = signal<UsuarioSelectOption[]>([]);
  protected readonly tipoUsuarioOptions = signal<UsuarioSelectOption[]>([]);

  protected readonly hasUsuarios = computed(() => this.usuarios().length > 0);
  protected readonly tipoUsuarioCatalogPending = computed(() => this.tipoUsuarioOptions().length === 0);

  protected readonly createForm = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(180)]],
    userName: ['', [Validators.required, Validators.maxLength(80)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(120)]],
    areaId: ['', Validators.required],
    tipoUsuarioId: ['', Validators.required],
  });

  constructor() {
    this.loadUsuarios();
    this.loadAreaOptions();
    this.loadTipoUsuarioOptions();
  }

  protected trackByUsuario(index: number, usuario: UsuarioDTO): string {
    return usuario.id || usuario.userName || usuario.nombre || `${index}`;
  }

  protected displayValue(value: string | undefined, fallback = 'Sin registrar'): string {
    const normalized = value?.trim();
    return normalized ? normalized : fallback;
  }

  protected estadoLabel(usuario: UsuarioDTO): string {
    if (usuario.activo === undefined || usuario.activo === null) {
      return 'Sin estado';
    }
    return this.isActive(usuario) ? 'Activo' : 'Inactivo';
  }

  protected estadoSeverity(usuario: UsuarioDTO): 'success' | 'secondary' {
    return this.isActive(usuario) ? 'success' : 'secondary';
  }

  protected tipoUsuarioLabel(usuario: UsuarioDTO): string {
    return this.displayValue(usuario.tipoUsuario, 'Sin tipo');
  }

  protected tipoUsuarioSeverity(usuario: UsuarioDTO): 'info' | 'warn' | 'secondary' {
    const tipo = this.tipoUsuarioLabel(usuario).toLowerCase();
    if (tipo.includes('admin')) {
      return 'warn';
    }
    if (tipo.includes('usuario') || tipo.includes('estandar') || tipo.includes('standard')) {
      return 'info';
    }
    return 'secondary';
  }

  protected userInitials(usuario: UsuarioDTO): string {
    const source = this.displayValue(usuario.nombre || usuario.userName, 'U');
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  protected canDelete(usuario: UsuarioDTO): boolean {
    return !!usuario.id && this.deletingUserId() === null && !this.isSuperUsuario(usuario);
  }

  protected isDeleting(usuario: UsuarioDTO): boolean {
    return !!usuario.id && this.deletingUserId() === usuario.id;
  }

  protected openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  protected closeCreateModal(): void {
    if (this.creatingUsuario()) {
      return;
    }
    this.showCreateModal.set(false);
    this.resetCreateForm();
  }

  protected showCreateControlInvalid(controlName: keyof typeof this.createForm.controls): boolean {
    const control = this.createForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected isCreateDisabled(): boolean {
    return this.creatingUsuario() || this.createForm.invalid || this.tipoUsuarioCatalogPending();
  }

  protected submitCreateUsuario(): void {
    if (this.tipoUsuarioCatalogPending()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Catalogo pendiente',
        detail: 'No se puede crear usuario hasta contar con catalogo de tipos de usuario.',
        life: 4500,
      });
      return;
    }

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const value = this.createForm.getRawValue();
    const payload: UsuarioCreateDTO = {
      nombre: value.nombre.trim(),
      userName: value.userName.trim(),
      password: value.password,
      areaId: value.areaId,
      tipoUsuarioId: value.tipoUsuarioId,
    };

    console.log('[Usuarios] POST /Usuarios payload:', payload);

    this.creatingUsuario.set(true);
    this.usuariosService
      .create(payload)
      .pipe(
        finalize(() => this.creatingUsuario.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Usuario creado',
            detail: 'El usuario se registro correctamente.',
            life: 3500,
          });
          this.showCreateModal.set(false);
          this.resetCreateForm();
          this.loadUsuarios();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No fue posible crear el usuario. Intenta nuevamente.',
            life: 4500,
          });
        },
      });
  }

  protected deleteUsuario(usuario: UsuarioDTO): void {
    if (!usuario.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin identificador',
        detail: 'No fue posible eliminar este usuario porque falta informacion del registro.',
        life: 3500,
      });
      return;
    }

    this.confirmationService.confirm({
      header: 'Eliminar usuario',
      message: '\u00bfSeguro que deseas eliminar este usuario? Esta acci\u00f3n no se puede deshacer.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
      accept: () => this.performDeleteUsuario(usuario),
    });
  }

  protected retry(): void {
    this.loadUsuarios();
  }

  private performDeleteUsuario(usuario: UsuarioDTO): void {
    if (!usuario.id) {
      return;
    }

    this.deletingUserId.set(usuario.id);
    this.usuariosService
      .delete(usuario.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.usuarios.update((current) => current.filter((item) => item.id !== usuario.id));
          this.messageService.add({
            severity: 'success',
            summary: 'Usuario eliminado',
            detail: `Se elimino el usuario ${this.displayValue(usuario.userName || usuario.nombre, 'seleccionado')}.`,
            life: 3500,
          });
          this.deletingUserId.set(null);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No fue posible eliminar el usuario. Intenta nuevamente.',
            life: 4500,
          });
          this.deletingUserId.set(null);
        },
      });
  }

  private loadUsuarios(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.usuariosService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.usuarios.set(this.normalizeUsuarios(rows).filter((usuario) => !this.isSuperUsuario(usuario)));
          this.loading.set(false);
        },
        error: () => {
          this.usuarios.set([]);
          this.errorMessage.set('No fue posible cargar los usuarios.');
          this.loading.set(false);
        },
      });
  }

  private loadAreaOptions(): void {
    this.loadingAreas.set(true);
    this.areaErrorMessage.set(null);

    this.catalogosService
      .getAll('AREA')
      .pipe(
        finalize(() => this.loadingAreas.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (rows) => {
          this.areaOptions.set(
            rows
              .filter((area) => area.activo)
              .map((area) => ({
                id: area.id,
                label: area.descripcion,
              }))
          );
        },
        error: () => {
          this.areaOptions.set([]);
          this.areaErrorMessage.set('No fue posible cargar las areas activas.');
        },
      });
  }

  private loadTipoUsuarioOptions(): void {
    this.loadingTipoUsuarios.set(true);

    this.catalogosService
      .getAll('TIPO_USUARIO')
      .pipe(
        finalize(() => this.loadingTipoUsuarios.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (rows) => {
          this.tipoUsuarioOptions.set(
            rows
              .filter((tipo) => tipo.activo && tipo.descripcion?.trim().toUpperCase() !== 'SUPERUSUARIO')
              .map((tipo) => ({
                id: tipo.id,
                label: tipo.descripcion,
              }))
          );
        },
        error: () => {
          this.tipoUsuarioOptions.set([]);
          this.messageService.add({
            severity: 'warn',
            summary: 'Tipos de usuario',
            detail: 'No fue posible cargar el catalogo de tipos de usuario.',
            life: 4500,
          });
        },
      });
  }

  private resetCreateForm(): void {
    this.createForm.reset({
      nombre: '',
      userName: '',
      password: '',
      areaId: '',
      tipoUsuarioId: '',
    });
    this.createForm.markAsPristine();
    this.createForm.markAsUntouched();
  }

  private normalizeUsuarios(rows: UsuarioDTO[] | unknown): UsuarioDTO[] {
    if (Array.isArray(rows)) {
      return rows;
    }
    if (Array.isArray((rows as { data?: unknown[] })?.data)) {
      return (rows as { data: UsuarioDTO[] }).data;
    }
    if (Array.isArray((rows as { items?: unknown[] })?.items)) {
      return (rows as { items: UsuarioDTO[] }).items;
    }
    return [];
  }

  private isActive(usuario: UsuarioDTO): boolean {
    if (typeof usuario.activo === 'boolean') {
      return usuario.activo;
    }
    if (typeof usuario.activo === 'number') {
      return usuario.activo === 1;
    }
    return false;
  }

  private isSuperUsuario(usuario: UsuarioDTO): boolean {
    const tipo = (usuario.tipoUsuario ?? '').trim().toUpperCase();
    return tipo === 'SUPERUSUARIO' || tipo.includes('SUPERUSUARIO') || tipo.includes('SUPER USUARIO');
  }
}
