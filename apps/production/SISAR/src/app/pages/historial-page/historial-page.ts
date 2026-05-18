import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import {
  DashboardSummaryHeaderComponent,
  TemaDTO,
  TemaSeguimientoDTO,
  TemaService,
  TemaTurnoDTO,
  formatNumControl,
} from '@proyectos-dti/shared-ui';
import { catchError, forkJoin, map, of } from 'rxjs';
import { SessionService } from '../../services/session.service';

interface HistorialTemaRow {
  id: string;
  numeroControl: string;
  descripcion: string;
  areas: string;
  fechaSolventado: string;
  estado: string;
}

interface HistorialSeguimientoRow {
  id: string;
  turnoId: string;
  fecha: string;
  descripcion: string;
  situacion: string;
  tema: string;
  numeroControl: string;
  archivoLabel: string;
}

interface TurnoTemaItem {
  turno: TemaTurnoDTO;
  tema: TemaDTO;
}

@Component({
  selector: 'app-historial-page',
  standalone: true,
  imports: [CommonModule, DatePipe, ButtonModule, TagModule, DashboardSummaryHeaderComponent],
  templateUrl: './historial-page.html',
  styleUrl: './historial-page.scss',
})
export class HistorialPage {
  private readonly temaService = inject(TemaService);
  private readonly sessionService = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly isAdmin = signal(false);
  protected readonly title = signal('Historial');
  protected readonly subtitle = signal('Consulta registros cerrados y seguimientos históricos de SISAR.');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly temasRows = signal<HistorialTemaRow[]>([]);
  protected readonly seguimientoRows = signal<HistorialSeguimientoRow[]>([]);

  constructor() {
    this.loadHistorial();
  }

  protected onTemaDetail(row: HistorialTemaRow): void {
    void this.router.navigate(['/app/temas'], { queryParams: { temaId: row.id } });
  }

  protected onSeguimientoDetail(row: HistorialSeguimientoRow): void {
    void this.router.navigate(['/app/seguimientos', row.turnoId]);
  }

  protected seguimientoSeverity(situacion: string): 'success' | 'info' {
    return situacion.trim().toUpperCase() === 'ATENDIDO' ? 'success' : 'info';
  }

  private loadHistorial(): void {
    const currentUser = this.sessionService.getCurrentUser();
    const claims = this.getSessionClaims();
    const role = (currentUser?.role ?? currentUser?.tipoUsuario ?? '').trim() || this.resolveRole(claims);
    const isAdmin = this.isAdminRole(role);
    const claimArea = this.readClaim(claims, ['area', 'Area', 'departamento', 'department']);
    const areaId =
      (currentUser?.areaId ?? '').trim() ||
      this.readClaim(claims, ['areaId', 'area_id', 'AreaId']) ||
      (this.isUuid(claimArea) ? claimArea : '');

    this.isAdmin.set(isAdmin);
    this.title.set(isAdmin ? 'Historial de temas concluidos' : 'Historial de seguimientos');
    this.subtitle.set(
      isAdmin
        ? 'Temas globales que ya fueron concluidos por las areas asignadas.'
        : 'Seguimientos registrados en los temas asignados a tu area.'
    );

    if (isAdmin) {
      this.loadAdminHistorial();
    } else {
      this.loadAnalystHistorial(areaId);
    }
  }

  private loadAdminHistorial(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.temaService
      .getAllTemas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const temas = this.normalizeTemasResponse(data);
          if (!temas.length) {
            this.temasRows.set([]);
            this.loading.set(false);
            return;
          }

          forkJoin(
            temas.map((tema) =>
              this.temaService.getTemaTurnoByTemaId(tema.id).pipe(
                map((turnos) => ({ tema, turnos: this.normalizeTurnosResponse(turnos), error: false })),
                catchError(() => of({ tema, turnos: [] as TemaTurnoDTO[], error: true }))
              )
            )
          )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (results) => {
                const rows = results
                  .filter((result) => this.isTemaConcluido(result.tema, result.turnos))
                  .map((result) => this.toTemaRow(result.tema, result.turnos))
                  .sort(
                    (left, right) =>
                      this.parseDate(right.fechaSolventado).getTime() - this.parseDate(left.fechaSolventado).getTime()
                  );

                this.temasRows.set(rows);
                this.loading.set(false);
                this.errorMessage.set(
                  results.some((result) => result.error)
                    ? 'No fue posible validar algunos turnos del historial.'
                    : null
                );
              },
              error: () => this.handleError('No fue posible cargar el historial de temas concluidos.'),
            });
        },
        error: () => this.handleError('No fue posible cargar el historial de temas concluidos.'),
      });
  }

  private loadAnalystHistorial(areaId: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    if (!areaId) {
      this.seguimientoRows.set([]);
      this.loading.set(false);
      this.errorMessage.set('Tu cuenta no tiene un area asignada para consultar el historial.');
      return;
    }

    this.temaService
      .getTemaTurnoByAreaId(areaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const turnos = this.normalizeTurnosResponse(data);
          if (!turnos.length) {
            this.seguimientoRows.set([]);
            this.loading.set(false);
            return;
          }

          forkJoin(
            turnos.map((turno) =>
              this.temaService.getTemaById(turno.temaId).pipe(
                map((tema) => ({ turno, tema })),
                catchError(() => of(null))
              )
            )
          )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (items) => {
                const validItems = items.filter((item): item is TurnoTemaItem => item !== null);
                this.loadSeguimientosForItems(validItems);
              },
              error: () => this.handleError('No fue posible cargar el historial de seguimientos.'),
            });
        },
        error: () => this.handleError('No fue posible cargar el historial de seguimientos.'),
      });
  }

  private loadSeguimientosForItems(items: TurnoTemaItem[]): void {
    forkJoin(
      items.map((item) =>
        this.temaService.getTemaSeguimientosByTurnoId(item.turno.id).pipe(
          map((seguimientos) => ({
            ...item,
            seguimientos: this.normalizeSeguimientosResponse(seguimientos),
            error: false,
          })),
          catchError(() => of({ ...item, seguimientos: [] as TemaSeguimientoDTO[], error: true }))
        )
      )
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          const rows = results
            .flatMap((result) =>
              result.seguimientos.map((seguimiento) => this.toSeguimientoRow(result.tema, result.turno, seguimiento))
            )
            .sort((left, right) => this.parseDate(right.fecha).getTime() - this.parseDate(left.fecha).getTime());

          this.seguimientoRows.set(rows);
          this.loading.set(false);
          this.errorMessage.set(
            results.some((result) => result.error)
              ? 'No fue posible cargar algunos seguimientos del historial.'
              : null
          );
        },
        error: () => this.handleError('No fue posible cargar el historial de seguimientos.'),
      });
  }

  private toTemaRow(tema: TemaDTO, turnos: TemaTurnoDTO[]): HistorialTemaRow {
    return {
      id: tema.id,
      numeroControl: formatNumControl(tema.numControl),
      descripcion: tema.descripcion || 'Sin descripcion',
      areas: turnos.map((turno) => turno.area || turno.areaCatalogo).filter(Boolean).join(', ') || 'Sin areas',
      fechaSolventado: tema.fechaSolventado || this.resolveLastFechaSolventado(turnos),
      estado: 'Concluido',
    };
  }

  private toSeguimientoRow(
    tema: TemaDTO,
    turno: TemaTurnoDTO,
    seguimiento: TemaSeguimientoDTO
  ): HistorialSeguimientoRow {
    const archivos = Array.isArray(seguimiento.archivos) ? seguimiento.archivos : [];

    return {
      id: seguimiento.id,
      turnoId: turno.id,
      fecha: seguimiento.fecha || '',
      descripcion: seguimiento.descripcion || 'Sin descripcion',
      situacion: seguimiento.situacion || 'Sin situacion',
      tema: tema.descripcion || 'Sin descripcion',
      numeroControl: formatNumControl(tema.numControl),
      archivoLabel: archivos.length ? `${archivos.length} archivo(s)` : 'Sin archivo',
    };
  }

  private isTemaConcluido(tema: TemaDTO, turnos: TemaTurnoDTO[]): boolean {
    if (this.isTruthyFlag(tema.solventado)) {
      return true;
    }

    return turnos.length > 0 && turnos.every((turno) => this.isTruthyFlag(turno.solventado));
  }

  private resolveLastFechaSolventado(turnos: TemaTurnoDTO[]): string {
    return [...turnos]
      .map((turno) => turno.fechaSolventado)
      .filter(Boolean)
      .sort((left, right) => this.parseDate(right).getTime() - this.parseDate(left).getTime())[0] ?? '';
  }

  private normalizeTemasResponse(data: TemaDTO[] | unknown): TemaDTO[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray((data as { data?: unknown[] })?.data)) {
      return (data as { data: TemaDTO[] }).data;
    }
    if (Array.isArray((data as { items?: unknown[] })?.items)) {
      return (data as { items: TemaDTO[] }).items;
    }
    return [];
  }

  private normalizeTurnosResponse(data: TemaTurnoDTO[] | unknown): TemaTurnoDTO[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray((data as { data?: unknown[] })?.data)) {
      return (data as { data: TemaTurnoDTO[] }).data;
    }
    if (Array.isArray((data as { items?: unknown[] })?.items)) {
      return (data as { items: TemaTurnoDTO[] }).items;
    }
    return [];
  }

  private normalizeSeguimientosResponse(data: TemaSeguimientoDTO[] | unknown): TemaSeguimientoDTO[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray((data as { data?: unknown[] })?.data)) {
      return (data as { data: TemaSeguimientoDTO[] }).data;
    }
    if (Array.isArray((data as { items?: unknown[] })?.items)) {
      return (data as { items: TemaSeguimientoDTO[] }).items;
    }
    return [];
  }

  private handleError(message: string): void {
    this.errorMessage.set(message);
    this.temasRows.set([]);
    this.seguimientoRows.set([]);
    this.loading.set(false);
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
      return JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private resolveRole(claims: Record<string, unknown>): string {
    return this.readClaim(claims, [
      'role',
      'roles',
      'Rol',
      'tipoUsuario',
      'TipoUsuario',
      'tipo_usuario',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    ]);
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

  private isAdminRole(role: string): boolean {
    const normalized = role.toLowerCase();
    return normalized.includes('admin') || normalized.includes('superusuario') || normalized.includes('super-user');
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

  private parseDate(value: string): Date {
    const date = value ? new Date(value) : new Date(0);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
  }
}
