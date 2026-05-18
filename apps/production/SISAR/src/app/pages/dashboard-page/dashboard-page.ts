import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  DashboardKpiCardComponent,
  DashboardKpiCardData,
  DashboardSummaryHeaderComponent,
  TemaDTO,
  TemaResumenRow,
  TemaSeguimientoDTO,
  TemaService,
  TemaTurnoDTO,
  formatNumControl,
} from '@proyectos-dti/shared-ui';
import { TemasSummaryListComponent } from '../../../../../../../libs/shared-ui/src/lib/components/tables/temas-summary-list/temas-summary-list.component';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { catchError, forkJoin, map, of } from 'rxjs';
import { SessionService } from '../../services/session.service';

interface DashboardTemaRow extends TemaResumenRow {
  id: string;
  turnoId?: string;
}

interface DashboardActivityRow {
  id: string;
  temaId: string;
  turnoId: string;
  numeroControl: string;
  temaDescripcion: string;
  area: string;
  situacion: string;
  descripcion: string;
  fecha: string;
}

interface DashboardTurnoTemaItem {
  turno: TemaTurnoDTO;
  tema: TemaDTO;
}

const dashboardPageEnterAnimation = trigger('dashboardPageEnter', [
  transition(':enter', [
    query(
      '.dashboard-animate-block',
      [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        stagger(120, [
          animate('420ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
        ]),
      ],
      { optional: true }
    ),
  ]),
]);

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  imports: [
    DatePipe,
    ButtonModule,
    TagModule,
    DashboardSummaryHeaderComponent,
    DashboardKpiCardComponent,
    TemasSummaryListComponent,
  ],
  animations: [dashboardPageEnterAnimation],
})
export class DashboardPage {
  private readonly temaService = inject(TemaService);
  private readonly sessionService = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly summaryTitle = signal('Resumen de Temas');
  protected readonly summarySubtitle = signal('Aqui tienes el estado actual de tus temas.');
  protected readonly urgentTableTitle = signal('Temas urgentes');
  protected readonly recentTableTitle = signal('Temas recientes');
  protected readonly activityTitle = signal('Actividad reciente');
  protected readonly activitySubtitle = signal('Ultimos seguimientos encontrados en los temas urgentes y recientes.');

  protected readonly kpiCards = signal<DashboardKpiCardData[]>([]);
  protected readonly urgentRows = signal<DashboardTemaRow[]>([]);
  protected readonly recentRows = signal<DashboardTemaRow[]>([]);
  protected readonly recentActivityRows = signal<DashboardActivityRow[]>([]);
  protected readonly loadingTemas = signal(false);
  protected readonly loadingActivity = signal(false);
  protected readonly activityError = signal<string | null>(null);
  protected readonly isAdmin = signal(false);
  protected readonly showRecentTemas = signal(true);

  constructor() {
    this.loadTemasResumen();
  }

  protected onTemasFilter(): void {
    console.log('Abrir filtros de temas');
  }

  protected onTemasExport(): void {
    console.log('Exportar resumen de temas');
  }

  protected onTemasDetail(row: TemaResumenRow): void {
    const turnoId = (row as DashboardTemaRow).turnoId;
    if (!this.isAdmin() && turnoId) {
      void this.router.navigate(['/app/seguimientos', turnoId]);
      return;
    }

    const search = row.numeroControl.replace(/\s/g, '');
    console.log('Abrir detalle del tema:', search);
    void this.router.navigate(['/app/temas'], { queryParams: { search } });
  }

  protected onActivityDetail(row: DashboardActivityRow): void {
    if (!this.isAdmin() && row.turnoId) {
      void this.router.navigate(['/app/seguimientos', row.turnoId]);
      return;
    }

    console.log('Abrir tema desde actividad:', row.numeroControl);
    if (row.temaId) {
      void this.router.navigate(['/app/temas'], { queryParams: { temaId: row.temaId } });
      return;
    }

    void this.router.navigate(['/app/temas'], { queryParams: { search: row.numeroControl } });
  }

  protected activitySeverity(situacion: string): 'success' | 'info' {
    return situacion.trim().toUpperCase() === 'ATENDIDO' ? 'success' : 'info';
  }

  private loadTemasResumen(): void {
    this.loadingTemas.set(true);
    this.loadingActivity.set(false);
    this.activityError.set(null);

    const currentUser = this.sessionService.getCurrentUser();
    const claims = this.getSessionClaims();
    const role = (currentUser?.role ?? currentUser?.tipoUsuario ?? '').trim() || this.resolveRole(claims);
    const isAdmin = this.isAdminRole(role) || this.resolveIsAdmin(claims);
    const claimArea = this.readClaim(claims, ['area', 'Area', 'departamento', 'department']);
    const claimAreaIsUuid = this.isUuid(claimArea);
    const userAreaId =
      (currentUser?.areaId ?? '').trim() ||
      this.readClaim(claims, ['areaId', 'area_id', 'AreaId']) ||
      (claimAreaIsUuid ? claimArea : '');
    this.isAdmin.set(isAdmin);

    if (isAdmin) {
      this.summaryTitle.set('Resumen Institucional');
      this.summarySubtitle.set('Vista de administrador con temas urgentes, recientes y actividad operativa.');
      this.urgentTableTitle.set('Temas urgentes');
      this.recentTableTitle.set('Seguimientos recientes');
      this.activityTitle.set('Seguimientos recientes');
      this.activitySubtitle.set('Ultimos seguimientos registrados en el sistema.');
      this.showRecentTemas.set(false);
      this.loadAdminDashboard();
    } else {
      this.summaryTitle.set('Mi Resumen de Trabajo');
      this.summarySubtitle.set('Vista de usuario con los temas asignados y su nivel de urgencia.');
      this.urgentTableTitle.set('Temas asignados urgentes');
      this.recentTableTitle.set('Temas asignados recientes');
      this.activityTitle.set('Seguimientos recientes');
      this.activitySubtitle.set('Ultimos seguimientos registrados en los temas asignados a tu area.');
      this.showRecentTemas.set(true);
      this.loadAnalystDashboard(userAreaId);
    }
  }

  private loadAdminDashboard(): void {
    this.temaService
      .getAllTemas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const normalized = this.normalizeTemasResponse(data);
          const urgentTemas = [...normalized]
            .filter((tema) => !this.isTemaConcluido(tema) && this.isUrgentTema(tema))
            .sort((a, b) => this.compareTemaUrgency(a, b))
            .slice(0, 10);
          const activityTemas = this.pickAdminActivityTemaSubset(normalized, urgentTemas);

          this.kpiCards.set(this.buildKpiCards(normalized));
          this.urgentRows.set(urgentTemas.map((tema) => this.toResumenRow(tema)));
          this.recentRows.set([]);
          this.loadingTemas.set(false);
          this.loadRecentActivity(activityTemas);
        },
        error: () => this.handleDashboardLoadError(),
      });
  }

  private loadAnalystDashboard(areaId: string): void {
    if (!areaId) {
      this.kpiCards.set(this.buildTurnoKpiCards([]));
      this.urgentRows.set([]);
      this.recentRows.set([]);
      this.recentActivityRows.set([]);
      this.activityError.set(null);
      this.loadingTemas.set(false);
      return;
    }

    this.temaService
      .getTemaTurnoByAreaId(areaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const turnos = this.normalizeTurnosResponse(data);
          if (!turnos.length) {
            this.kpiCards.set(this.buildTurnoKpiCards([]));
            this.urgentRows.set([]);
            this.recentRows.set([]);
            this.recentActivityRows.set([]);
            this.loadingTemas.set(false);
            return;
          }

          forkJoin(
            turnos.map((turno) =>
              this.temaService.getTemaById(turno.temaId).pipe(
                map((tema) => ({ turno, tema: this.withTurnoForArea(tema, turno) })),
                catchError(() => of(null))
              )
            )
          )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (items) => {
                const assignedItems = items.filter((item): item is DashboardTurnoTemaItem => item !== null);
                const urgentItems = [...assignedItems]
                  .filter((item) => Number(item.turno.solventado) !== 1 && this.isUrgentTema(item.tema))
                  .sort((a, b) => this.compareTemaUrgency(a.tema, b.tema))
                  .slice(0, 10);
                const urgentTurnoIds = new Set(urgentItems.map((item) => item.turno.id));
                const recentItems = assignedItems.filter((item) => !urgentTurnoIds.has(item.turno.id)).slice(0, 10);

                this.kpiCards.set(this.buildTurnoKpiCards(turnos, assignedItems.map((item) => item.tema)));
                this.urgentRows.set(urgentItems.map((item) => this.toResumenRow(item.tema, item.turno)));
                this.recentRows.set(recentItems.map((item) => this.toResumenRow(item.tema, item.turno)));
                this.recentActivityRows.set([]);
                this.loadingActivity.set(false);
                this.activityError.set(null);
                this.loadingTemas.set(false);
              },
              error: () => this.handleDashboardLoadError(),
            });
        },
        error: () => this.handleDashboardLoadError(),
      });
  }

  private buildKpiCards(temas: TemaDTO[]): DashboardKpiCardData[] {
    const concluidos = temas.filter((tema) => this.isTemaConcluido(tema)).length;
    const activos = temas.length - concluidos;
    const pendientes = temas.filter((tema) => !this.isTemaConcluido(tema)).length;
    const porVencer = temas.filter((tema) => !this.isTemaConcluido(tema) && this.isTemaVencidoOProximo(tema)).length;

    return [
      {
        title: 'Temas Activos',
        value: activos,
        trendLabel: `${activos} en seguimiento`,
        trendDirection: activos > 0 ? 'up' : 'neutral',
        icon: 'pi pi-clipboard',
      },
      {
        title: 'Temas Pendientes',
        value: pendientes,
        trendLabel: `${pendientes} por atender`,
        trendDirection: pendientes > 0 ? 'down' : 'neutral',
        icon: 'pi pi-clock',
      },
      {
        title: 'Temas Concluidos',
        value: concluidos,
        trendLabel: `${concluidos} cerrados`,
        trendDirection: concluidos > 0 ? 'up' : 'neutral',
        icon: 'pi pi-check-circle',
      },
      {
        title: 'Vencimientos próximos',
        value: porVencer,
        trendLabel: `${porVencer} vencidos o por vencer`,
        trendDirection: porVencer > 0 ? 'down' : 'neutral',
        icon: 'pi pi-calendar-clock',
      },
    ];
  }

  private buildTurnoKpiCards(turnos: TemaTurnoDTO[], temas: TemaDTO[] = []): DashboardKpiCardData[] {
    const activos = turnos.length;
    const concluidos = turnos.filter((turno) => this.isTurnoSolventado(turno)).length;
    const pendientes = turnos.filter((turno) => !this.isTurnoSolventado(turno)).length;
    const porVencer = temas.filter((tema) => !this.isTemaConcluido(tema) && this.isTemaVencidoOProximo(tema)).length;

    return [
      {
        title: 'Temas Activos',
        value: activos,
        trendLabel: `${activos} asignados al area`,
        trendDirection: activos > 0 ? 'up' : 'neutral',
        icon: 'pi pi-clipboard',
      },
      {
        title: 'Temas Pendientes',
        value: pendientes,
        trendLabel: `${pendientes} por atender`,
        trendDirection: pendientes > 0 ? 'down' : 'neutral',
        icon: 'pi pi-clock',
      },
      {
        title: 'Temas Concluidos',
        value: concluidos,
        trendLabel: `${concluidos} cerrados`,
        trendDirection: concluidos > 0 ? 'up' : 'neutral',
        icon: 'pi pi-check-circle',
      },
      {
        title: 'Vencimientos próximos',
        value: porVencer,
        trendLabel: `${porVencer} vencidos o por vencer`,
        trendDirection: porVencer > 0 ? 'down' : 'neutral',
        icon: 'pi pi-calendar-clock',
      },
    ];
  }

  private toResumenRow(t: TemaDTO, turno?: TemaTurnoDTO): DashboardTemaRow {
    const prioLabel = (t.tipoPrioridad ?? '').toUpperCase();
    const prioridad: TemaResumenRow['prioridad'] = prioLabel.includes('ALTA') || prioLabel.includes('URGENT')
      ? 'ALTA'
      : prioLabel.includes('MEDIA')
        ? 'MEDIA'
        : 'BAJA';

    const areaValue = Array.isArray(t.turnos) && t.turnos.length
      ? t.turnos
          .map((turno) => turno.area)
          .filter((area) => !!area)
          .join(', ')
      : 'Sin area asignada';

    return {
      id: t.id,
      turnoId: turno?.id,
      numeroControl: formatNumControl(t.numControl),
      descripcion: (t.descripcion || 'Sin descripcion').split('\n')[0],
      area: turno?.area || areaValue,
      prioridad,
      vencimiento: t.fechaVencimiento || '',
      estado: turno ? this.resolveTurnoStatus(t, turno) : this.resolveStatus(t),
    };
  }

  private loadRecentActivity(temas: TemaDTO[]): void {
    if (!temas.length) {
      this.recentActivityRows.set([]);
      this.activityError.set(null);
      this.loadingActivity.set(false);
      return;
    }

    this.loadingActivity.set(true);
    this.activityError.set(null);

    forkJoin(
      temas.map((tema) =>
        this.temaService.getTemaTurnoByTemaId(tema.id).pipe(
          map((turnos) => ({
            tema,
            turnos: Array.isArray(turnos) ? turnos : [],
            error: false,
          })),
          catchError(() => of({ tema, turnos: [] as TemaTurnoDTO[], error: true }))
        )
      )
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((temaTurnoResults) => {
        const hadTurnoError = temaTurnoResults.some((result) => result.error);
        const turnoRequests = temaTurnoResults.flatMap((result) =>
          result.turnos.map((turno) =>
            this.temaService.getTemaSeguimientosByTurnoId(turno.id).pipe(
              map((seguimientos) => ({
                tema: result.tema,
                turno,
                seguimientos: this.normalizeSeguimientosResponse(seguimientos),
                error: false,
              })),
              catchError(() =>
                of({
                  tema: result.tema,
                  turno,
                  seguimientos: [] as TemaSeguimientoDTO[],
                  error: true,
                })
              )
            )
          )
        );

        if (!turnoRequests.length) {
          this.recentActivityRows.set([]);
          this.activityError.set(hadTurnoError ? 'No fue posible cargar parte de la actividad reciente.' : null);
          this.loadingActivity.set(false);
          return;
        }

        forkJoin(turnoRequests)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((results) => {
            const hadSeguimientoError = results.some((result) => result.error);
            const activity = results
              .flatMap((result) =>
                result.seguimientos.map((seguimiento) => this.toActivityRow(result.tema, result.turno, seguimiento))
              )
              .sort((left, right) => this.parseDate(right.fecha).getTime() - this.parseDate(left.fecha).getTime())
              .slice(0, 10);

            this.recentActivityRows.set(activity);
            this.activityError.set(
              hadTurnoError || hadSeguimientoError ? 'No fue posible cargar parte de la actividad reciente.' : null
            );
            this.loadingActivity.set(false);
          });
      });
  }

  private pickActivityTemaSubset(urgentTemas: TemaDTO[], recentTemas: TemaDTO[]): TemaDTO[] {
    const byId = new Map<string, TemaDTO>();
    [...urgentTemas, ...recentTemas].forEach((tema) => {
      if (tema.id && byId.size < 10) {
        byId.set(tema.id, tema);
      }
    });
    return [...byId.values()].slice(0, 10);
  }

  private pickAdminActivityTemaSubset(temas: TemaDTO[], urgentTemas: TemaDTO[]): TemaDTO[] {
    const byId = new Map<string, TemaDTO>();
    urgentTemas.forEach((tema) => {
      if (tema.id && byId.size < 25) {
        byId.set(tema.id, tema);
      }
    });
    temas.forEach((tema) => {
      if (tema.id && byId.size < 25) {
        byId.set(tema.id, tema);
      }
    });
    return [...byId.values()];
  }

  private loadRecentActivityForTurnos(items: DashboardTurnoTemaItem[]): void {
    const limitedItems = items.slice(0, 10);
    if (!limitedItems.length) {
      this.recentActivityRows.set([]);
      this.activityError.set(null);
      this.loadingActivity.set(false);
      return;
    }

    this.loadingActivity.set(true);
    this.activityError.set(null);

    forkJoin(
      limitedItems.map((item) =>
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
      .subscribe((results) => {
        const hadSeguimientoError = results.some((result) => result.error);
        const activity = results
          .flatMap((result) =>
            result.seguimientos.map((seguimiento) => this.toActivityRow(result.tema, result.turno, seguimiento))
          )
          .sort((left, right) => this.parseDate(right.fecha).getTime() - this.parseDate(left.fecha).getTime())
          .slice(0, 10);

        this.recentActivityRows.set(activity);
        this.activityError.set(hadSeguimientoError ? 'No fue posible cargar parte de los seguimientos recientes.' : null);
        this.loadingActivity.set(false);
      });
  }

  private pickActivityTurnoSubset(
    urgentItems: DashboardTurnoTemaItem[],
    recentItems: DashboardTurnoTemaItem[]
  ): DashboardTurnoTemaItem[] {
    const byTurnoId = new Map<string, DashboardTurnoTemaItem>();
    [...urgentItems, ...recentItems].forEach((item) => {
      if (item.turno.id && byTurnoId.size < 10) {
        byTurnoId.set(item.turno.id, item);
      }
    });
    return [...byTurnoId.values()];
  }

  private toActivityRow(tema: TemaDTO, turno: TemaTurnoDTO, seguimiento: TemaSeguimientoDTO): DashboardActivityRow {
    return {
      id: seguimiento.id,
      temaId: tema.id,
      turnoId: turno.id,
      numeroControl: formatNumControl(tema.numControl),
      temaDescripcion: (tema.descripcion || 'Sin descripcion').split('\n')[0],
      area: turno.area || 'Area sin nombre',
      situacion: seguimiento.situacion || 'Sin situacion',
      descripcion: seguimiento.descripcion || 'Sin descripcion',
      fecha: seguimiento.fecha || '',
    };
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

  private resolveStatus(t: TemaDTO): TemaResumenRow['estado'] {
    if (this.isTemaConcluido(t)) {
      return 'Concluido';
    }

    const dueDate = this.parseDate(t.fechaVencimiento);
    const daysToDue = this.daysUntil(dueDate);
    const isHigh = this.resolvePriorityScore(t) >= 3;

    if (daysToDue <= 0 || isHigh) {
      return 'Urgente';
    }
    if (daysToDue <= 3) {
      return 'En Proceso';
    }
    return 'Pendiente';
  }

  private resolveTurnoStatus(t: TemaDTO, turno: TemaTurnoDTO): TemaResumenRow['estado'] {
    if (this.isTurnoSolventado(turno)) {
      return 'Concluido';
    }

    return this.resolveStatus({ ...t, solventado: false });
  }

  private resolvePriorityScore(t: TemaDTO): number {
    const prioLabel = (t.tipoPrioridad ?? '').toUpperCase();
    if (prioLabel.includes('ALTA') || prioLabel.includes('URGENT')) {
      return 3;
    }
    if (prioLabel.includes('MEDIA')) {
      return 2;
    }
    return 1;
  }

  private isUrgentTema(t: TemaDTO): boolean {
    const dueDate = this.parseDate(t.fechaVencimiento);
    const daysToDue = this.daysUntil(dueDate);
    return this.resolvePriorityScore(t) >= 3 || daysToDue <= 7;
  }

  private isTemaVencidoOProximo(t: TemaDTO): boolean {
    const dueDate = this.parseDate(t.fechaVencimiento);
    if (dueDate.getTime() === 0) {
      return false;
    }
    return this.daysUntil(dueDate) <= 7;
  }

  private compareTemaUrgency(a: TemaDTO, b: TemaDTO): number {
    const scoreA = this.resolveUrgencyWeight(a);
    const scoreB = this.resolveUrgencyWeight(b);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    const dueA = this.parseDate(a.fechaVencimiento).getTime();
    const dueB = this.parseDate(b.fechaVencimiento).getTime();
    if (dueA !== dueB) {
      return dueA - dueB;
    }

    const ctrlA = this.resolveControlOrder(a.numControl);
    const ctrlB = this.resolveControlOrder(b.numControl);
    return ctrlB - ctrlA;
  }

  private resolveUrgencyWeight(t: TemaDTO): number {
    if (this.isTemaConcluido(t)) {
      return 0;
    }
    const priorityScore = this.resolvePriorityScore(t);
    const dueDate = this.parseDate(t.fechaVencimiento);
    const daysToDue = this.daysUntil(dueDate);

    if (daysToDue < 0) {
      return priorityScore + 4;
    }
    if (daysToDue <= 2) {
      return priorityScore + 3;
    }
    if (daysToDue <= 7) {
      return priorityScore + 2;
    }
    return priorityScore;
  }

  private resolveControlOrder(numControl: string): number {
    const onlyDigits = (numControl || '').replace(/\D/g, '');
    const parsed = Number(onlyDigits);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private parseDate(value: string): Date {
    const date = value ? new Date(value) : new Date(0);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
  }

  private daysUntil(date: Date): number {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const ms = startOfTarget.getTime() - startOfToday.getTime();
    return Math.ceil(ms / 86400000);
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

  private resolveIsAdmin(claims: Record<string, unknown>): boolean {
    const roleCandidates: string[] = [];
    const rawCandidates = [
      claims['role'],
      claims['roles'],
      claims['Rol'],
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

    const allRoles = roleCandidates.map((value) => value.toLowerCase());
    return allRoles.some((role) => role.includes('admin') || role.includes('superusuario') || role.includes('super-user'));
  }

  private resolveRole(claims: Record<string, unknown>): string {
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

    return roleCandidates[0] || '';
  }

  private isAdminRole(role: string): boolean {
    const normalized = role.toLowerCase();
    return normalized.includes('admin') || normalized.includes('superusuario') || normalized.includes('super-user');
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private isTemaConcluido(tema: TemaDTO): boolean {
    if (this.isTruthyFlag(tema.solventado)) {
      return true;
    }

    const turnos = Array.isArray((tema as TemaDTO & { turnos?: Array<TemaTurnoDTO | { solventado?: unknown }> }).turnos)
      ? ((tema as TemaDTO & { turnos?: Array<TemaTurnoDTO | { solventado?: unknown }> }).turnos ?? [])
      : [];

    return turnos.length > 0 && turnos.every((turno) => this.isTruthyFlag((turno as { solventado?: unknown }).solventado));
  }

  private isTurnoSolventado(turno: TemaTurnoDTO): boolean {
    return this.isTruthyFlag(turno.solventado);
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

  private withTurnoForArea(tema: TemaDTO, turno: TemaTurnoDTO): TemaDTO {
    return {
      ...tema,
      turnos: [
        {
          areaId: turno.areaId,
          area: turno.area || turno.areaCatalogo || 'Area sin nombre',
        },
      ],
    };
  }

  private handleDashboardLoadError(): void {
    this.kpiCards.set(this.isAdmin() ? this.buildKpiCards([]) : this.buildTurnoKpiCards([]));
    this.urgentRows.set([]);
    this.recentRows.set([]);
    this.recentActivityRows.set([]);
    this.activityError.set('No fue posible cargar la actividad reciente.');
    this.loadingTemas.set(false);
    this.loadingActivity.set(false);
  }

  private readClaim(claims: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = claims[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  }
}
