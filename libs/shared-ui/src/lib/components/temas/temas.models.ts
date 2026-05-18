export type TemaTabFilter = 'todos' | 'urgentes' | 'en-proceso' | 'pendientes' | 'completados';

export interface TemaRow {
  id: string;
  numControl: string;
  descripcion: string;
  subtitulo: string;
  area: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  vencimientoLabel: string;
  estado: 'Urgente' | 'Abierto' | 'En Proceso' | 'Pendiente' | 'Cerrado';
  totalAreas?: number;
  areasSolventadas?: number;
  progresoPorcentaje?: number;
  progresoLabel?: string;
  vencimientoRank?: number;
}
