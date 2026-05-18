import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface Notification {
  id: string;
  type: 'seguimiento' | 'tarea-completada' | 'tema-alta' | 'info' | 'warning';
  title: string;
  message: string;
  date: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  // Lista de notificaciones
  protected readonly notifications = signal<Notification[]>([]);

  // Total de notificaciones no leídas
  public readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  // Observable para emitir eventos de notificaciones nuevas
  private readonly notificationAdded$ = new Subject<Notification>();

  constructor() {
    // Simular llegada de notificaciones cada 5 segundos (para demo)
    // En producción, esto vendría de WebSocket o polling
    interval(8000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Aquí se pueden agregar notificaciones reales del backend
        // this.simulateIncomingNotification();
      });
  }

  /**
   * Agrega una notificación a la lista y emite evento
   */
  public addNotification(notification: Omit<Notification, 'id' | 'date' | 'read'>): void {
    const newNotif: Notification = {
      ...notification,
      id: this.generateId(),
      date: new Date(),
      read: false,
    };

    this.notifications.update((current) => [newNotif, ...current]);
    this.notificationAdded$.next(newNotif);
  }

  /**
   * Marca una notificación como leída
   */
  public markAsRead(notificationId: string): void {
    this.notifications.update((current) =>
      current.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  public markAllAsRead(): void {
    this.notifications.update((current) => current.map((n) => ({ ...n, read: true })));
  }

  /**
   * Obtiene todas las notificaciones
   */
  public getNotifications(): Notification[] {
    return this.notifications();
  }

  /**
   * Obtiene notificaciones no leídas
   */
  public getUnreadNotifications(): Notification[] {
    return this.notifications().filter((n) => !n.read);
  }

  /**
   * Limpia todas las notificaciones
   */
  public clearAll(): void {
    this.notifications.set([]);
  }

  /**
   * Notificación cuando se entrega un seguimiento
   */
  public notifySeguimientoEntregado(temaNumControl: string, areaNombre: string): void {
    this.addNotification({
      type: 'seguimiento',
      title: 'Seguimiento Entregado',
      message: `El área "${areaNombre}" entregó un seguimiento para el tema ${temaNumControl}.`,
    });
  }

  /**
   * Notificación cuando se completa una tarea
   */
  public notifyTareaCompletada(temaNumControl: string, areaNombre: string): void {
    this.addNotification({
      type: 'tarea-completada',
      title: 'Tarea Completada',
      message: `La tarea en "${areaNombre}" se ha completado para el tema ${temaNumControl}.`,
    });
  }

  /**
   * Notificación cuando se da de alta un tema
   */
  public notifyTemaAlta(temaNumControl: string, descripcion: string): void {
    this.addNotification({
      type: 'tema-alta',
      title: 'Nuevo Tema Registrado',
      message: `Se registró un nuevo tema: ${temaNumControl} - ${descripcion}`,
    });
  }

  /**
   * Genera un ID único para notificación
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Simula notificación entrante (solo para desarrollo)
   */
  private simulateIncomingNotification(): void {
    const types: Array<'seguimiento' | 'tarea-completada' | 'tema-alta'> = [
      'seguimiento',
      'tarea-completada',
      'tema-alta',
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const temaNum = `TEMA-${Math.floor(Math.random() * 9000) + 1000}`;
    const areas = ['Sistemas', 'Recursos Humanos', 'Finanzas', 'Operaciones'];
    const area = areas[Math.floor(Math.random() * areas.length)];

    if (type === 'seguimiento') {
      this.notifySeguimientoEntregado(temaNum, area);
    } else if (type === 'tarea-completada') {
      this.notifyTareaCompletada(temaNum, area);
    } else {
      this.notifyTemaAlta(temaNum, 'Descripción de tema de prueba');
    }
  }
}
