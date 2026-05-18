import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import {
  AreaOption,
  CatalogoDTO,
  pageSectionEnterAnimation,
  TemaDTO,
  TemaService,
  TemaTurnoDTO,
} from '@proyectos-dti/shared-ui';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-seguimientos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, TagModule, DatePipe],
  templateUrl: './seguimientos-page.html',
  styleUrl: './seguimientos-page.scss',
  animations: [pageSectionEnterAnimation],
})
export class SeguimientosPage {
  private readonly temaService = inject(TemaService);
  private readonly sessionService = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly infoMessage = signal<string | null>(null);
  protected readonly areaId = signal('');
  protected readonly areaLabel = signal('');
  protected readonly selectedAreaId = signal('');
  protected readonly areaOptions = signal<AreaOption[]>([]);
  protected readonly loadingAreaOptions = signal(false);
  protected readonly turnos = signal<TemaTurnoDTO[]>([]);
  protected readonly temasByTurnoId = signal<Record<string, TemaDTO | null>>({});
  protected readonly isSuperUser = signal(false);

  protected readonly hasTasks = computed(() => this.turnos().length > 0);
  protected readonly showAreaSelector = computed(
    () => this.isSuperUser() && !this.areaId() && this.areaOptions().length > 0
  );
  protected readonly selectedAreaLabel = computed(() => {
    const areaId = this.selectedAreaId();
    if (!areaId) {
      return '';
    }
    return this.areaOptions().find((option) => option.id === areaId)?.label ?? this.areaLabel();
  });
  protected readonly isEmpty = computed(
    () => !this.loading() && !this.errorMessage() && !this.infoMessage() && this.turnos().length === 0
  );
  protected readonly emptyMessage = computed(() =>
    this.selectedAreaId() && !this.areaId()
      ? 'No hay temas asignados para esta área.'
      : 'Cuando existan temas asignados a tu área, aparecerán aquí para que puedas revisar su estado y continuar con el seguimiento.'
  );
  protected readonly pendingCount = computed(
    () => this.turnos().filter((turno) => Number(turno.solventado) !== 1).length
  );
  protected readonly deliveredCount = computed(
    () => this.turnos().filter((turno) => Number(turno.solventado) === 1).length
  );

  constructor() {
    this.loadMyTasks();
  }

  protected trackByTurnoId(_: number, turno: TemaTurnoDTO): string {
    return turno.id;
  }

  protected temaForTurno(turno: TemaTurnoDTO): TemaDTO | null {
    return this.temasByTurnoId()[turno.id] ?? null;
  }

  protected shortDescriptionForTurno(turno: TemaTurnoDTO): string {
    const description = this.temaForTurno(turno)?.descripcion?.trim() ?? '';
    if (!description) {
      return 'La información detallada del tema estará disponible al abrir este tema.';
    }

    return description.length > 180 ? `${description.slice(0, 177)}...` : description;
  }

  protected prioridadSeverityForTurno(turno: TemaTurnoDTO): 'danger' | 'warn' | 'success' | 'secondary' {
    const priorityLabel = (this.temaForTurno(turno)?.tipoPrioridad ?? '').toUpperCase();

    if (priorityLabel.includes('ALTA') || priorityLabel.includes('URGENT')) {
      return 'danger';
    }
    if (priorityLabel.includes('MEDIA')) {
      return 'warn';
    }
    if (priorityLabel.includes('BAJA')) {
      return 'success';
    }
    return 'secondary';
  }

  protected turnoStatusLabel(turno: TemaTurnoDTO): string {
    return Number(turno.solventado) === 1 ? 'Solventado' : 'Pendiente';
  }

  protected turnoStatusSeverity(turno: TemaTurnoDTO): 'success' | 'warn' {
    return Number(turno.solventado) === 1 ? 'success' : 'warn';
  }

  protected onViewDetail(turno: TemaTurnoDTO): void {
    void this.router.navigate(['/app/seguimientos', turno.id]);
  }

  protected onSelectedAreaChange(areaId: string | null | undefined): void {
    const selectedAreaId = (areaId ?? '').trim();
    console.log('[Seguimientos] areaId seleccionada:', selectedAreaId);

    this.selectedAreaId.set(selectedAreaId);
    this.turnos.set([]);
    this.temasByTurnoId.set({});
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    if (!selectedAreaId) {
      if (this.isSuperUser() && !this.areaId()) {
        this.infoMessage.set('Selecciona un área para consultar Mis temas durante desarrollo.');
      }
      console.log('[Seguimientos] estado final de pantalla:', 'waiting-area-selection');
      return;
    }

    this.loadTasksByAreaId(selectedAreaId);
  }

  private loadMyTasks(): void {
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    const currentUser = this.sessionService.getCurrentUser();
    const claims = this.getSessionClaims();
    const jwtAreaId = this.readClaim(claims, ['areaId', 'area_id', 'AreaId', 'AreaID', 'areaID', 'idArea', 'IdArea']).trim();
    const jwtArea = this.readClaim(claims, ['area', 'Area', 'departamento', 'department']).trim();
    const jwtAreaIsUuid = this.isUuid(jwtArea);
    const areaId = (currentUser?.areaId ?? '').trim() || jwtAreaId || (jwtAreaIsUuid ? jwtArea : '');
    const areaLabel = (currentUser?.area ?? '').trim() || (!jwtAreaIsUuid ? jwtArea : '');
    const role = (currentUser?.role ?? currentUser?.tipoUsuario ?? '').trim() || this.resolveRole(claims);
    const isSuperUser = this.isSuperUserRole(role) || this.resolveIsSuperUser(claims);
    console.log('[Seguimientos] currentUser:', currentUser);
    console.log('[Seguimientos] usuario payload:', claims);
    console.log('[Seguimientos] areaId usada:', areaId);
    console.log('[Seguimientos] rol detectado:', role);
    this.isSuperUser.set(isSuperUser);

    this.areaId.set(areaId);
    this.areaLabel.set(areaLabel);
    this.selectedAreaId.set(areaId);

    if (!areaId) {
      this.turnos.set([]);
      this.temasByTurnoId.set({});
      if (isSuperUser) {
        this.infoMessage.set('Selecciona un área para consultar Mis temas durante desarrollo.');
        this.loadAreaOptions();
      } else {
        this.infoMessage.set(
          'Tu cuenta no tiene un área asignada. Solicita la configuración del área para poder consultar Mis temas.'
        );
      }
      return;
    }

    this.loadTasksByAreaId(areaId);
  }

  private loadTasksByAreaId(areaId: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    console.log('[Seguimientos] areaId seleccionada:', areaId);
    console.log('[Seguimientos] endpoint areaId:', areaId);
    console.log('[Seguimientos] areaId final:', areaId);
    console.log('[Seguimientos] llamando endpoint:', `/api/TemaTurno/areaId/${areaId}`);
    console.log('[Seguimientos] llamando:', `/api/TemaTurno/areaId/${areaId}`);

    this.temaService
      .getTemaTurnoByAreaId(areaId)
      .pipe(
        map((data: TemaTurnoDTO[] | unknown) => {
          console.log('[Seguimientos] respuesta turnos:', data);
          console.log('[Seguimientos] turnos recibidos:', data);
          const normalized = this.normalizeTurnosResponse(data);
          console.log('[Seguimientos] cantidad de turnos recibidos:', normalized.length);
          console.log('[Seguimientos] turnos normalizados:', normalized);
          return normalized;
        }),
        switchMap((normalized) => {
          if (!normalized.length) {
            return of({ normalized, temas: [] as Array<TemaDTO | null> });
          }

          return forkJoin(
            normalized.map((turno) =>
              this.temaService.getTemaById(turno.temaId).pipe(
                catchError((error) => {
                  console.log('[Seguimientos] error al cargar tema para turno:', turno.id, error);
                  return of(null);
                })
              )
            )
          ).pipe(map((temas) => ({ normalized, temas })));
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ normalized, temas }) => {
          this.turnos.set(normalized);
          this.temasByTurnoId.set(
            normalized.reduce<Record<string, TemaDTO | null>>((acc, turno, index) => {
              acc[turno.id] = temas[index] ?? null;
              return acc;
            }, {})
          );
          console.log(
            '[Seguimientos] estado final de pantalla:',
            normalized.length > 0 ? 'showing-tasks' : 'empty-area-tasks'
          );
        },
        error: (error) => {
          console.log('[Seguimientos] error al cargar turnos:', error);
          this.turnos.set([]);
          this.temasByTurnoId.set({});
          this.errorMessage.set('No fue posible cargar tus temas asignados en este momento.');
          console.log('[Seguimientos] estado final de pantalla:', 'error');
        },
      });
  }

  private loadAreaOptions(): void {
    this.loadingAreaOptions.set(true);

    this.temaService
      .getCatalogo('AREAS')
      .pipe(
        finalize(() => this.loadingAreaOptions.set(false)),
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

              return id && label && activo ? ({ id, label } as AreaOption) : null;
            })
            .filter((x): x is AreaOption => x !== null);

          this.areaOptions.set(mapped);
        },
        error: () => {
          this.areaOptions.set([]);
          this.errorMessage.set('No fue posible cargar el catalogo de areas.');
        },
      });
  }

  private normalizeTurnosResponse(data: TemaTurnoDTO[] | unknown): TemaTurnoDTO[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray((data as { data?: unknown[] })?.data)) {
      return (data as { data: unknown[] }).data as TemaTurnoDTO[];
    }
    if (Array.isArray((data as { items?: unknown[] })?.items)) {
      return (data as { items: unknown[] }).items as TemaTurnoDTO[];
    }
    return [];
  }

  private getSessionClaims(): Record<string, unknown> {
    const token = this.sessionService.getAccessToken();
    if (!token) {
      return {};
    }

    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      return {};
    }

    try {
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(normalized)) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private readClaim(claims: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = claims[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      if (Array.isArray(value)) {
        const first = value.find((item) => typeof item === 'string' && item.trim());
        if (typeof first === 'string') {
          return first.trim();
        }
      }
    }
    return '';
  }

  private resolveRole(claims: Record<string, unknown>): string {
    const candidates = this.getRoleCandidates(claims);
    return candidates[0] || '';
  }

  private resolveIsSuperUser(claims: Record<string, unknown>): boolean {
    const roleCandidates = this.getRoleCandidates(claims);
    const allRoles = roleCandidates.map((value) => value.toLowerCase());
    return allRoles.some(
      (role) => role.includes('superusuario') || role.includes('super-user') || role.includes('super user')
    );
  }

  private isSuperUserRole(role: string): boolean {
    const normalized = role.toLowerCase();
    return normalized.includes('superusuario') || normalized.includes('super-user') || normalized.includes('super user');
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private getRoleCandidates(claims: Record<string, unknown>): string[] {
    const roleCandidates: string[] = [];
    const rawCandidates = [
      claims['role'],
      claims['roles'],
      claims['Rol'],
      claims['tipoUsuario'],
      claims['TipoUsuario'],
      claims['tipo_usuario'],
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
    ];

    for (const raw of rawCandidates) {
      if (typeof raw === 'string') {
        roleCandidates.push(raw);
      }
      if (Array.isArray(raw)) {
        raw.forEach((item) => {
          if (typeof item === 'string') {
            roleCandidates.push(item);
          }
        });
      }
    }

    return roleCandidates;
  }
}
