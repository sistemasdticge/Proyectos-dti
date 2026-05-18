// ─── Tipos ───────────────────────────────────────────────────────────────────

export type CatalogoType = 'AREA' | 'SITUACION' | 'TIPO_DOCUMENTO' | 'TIPO_TEMA' | 'PRIORIDAD' | 'TIPO_USUARIO';

// ─── Registro interno (usado en tabla y estado del componente) ────────────────

export interface CatalogoRecord {
  id: string;
  descripcion: string;
  activo: boolean;
  esSolventado?: boolean;
  updatedAt?: string;
}

// ─── Respuestas de API ────────────────────────────────────────────────────────

/** Respuesta de GET /api/Catalogos/{tipo} y /api/CatSituacion */
export interface CatalogoApiRecord {
  id: string;
  descripcion: string;
  activo?: 0 | 1;
  esSolventado?: 0 | 1;
}

// ─── DTOs de escritura ────────────────────────────────────────────────────────

/** POST /api/Catalogos para AREA, TIPO_PRIORIDAD, TIPO_TEMA, TIPO_DOCUMENTO */
export interface CatalogoCreateDto {
  nombreCatalogo: string;
  descripcion: string;
}

/** POST /api/CatSituacion */
export interface CatSituacionCreateDto {
  descripcion: string;
  esSolventado: 0;
}

/** PUT /api/Catalogos/{id} */
export interface CatalogoUpdateDto {
  id: string;
  nombreCatalogo: string;
  descripcion: string;
  activo: 0 | 1;
}

/** PUT /api/CatSituacion/{id} */
export interface CatSituacionUpdateDto {
  id: string;
  descripcion: string;
  activo: 0 | 1;
}

// ─── Configuración por tipo ────────────────────────────────────────────────────

export interface CatalogoTypeConfig {
  /** Endpoint para GET (sin base URL) */
  getEndpoint: string;
  /** Endpoint para POST (sin base URL) */
  createEndpoint: string;
  /** Endpoint para PUT, se concatena el id */
  updateEndpointBase: string;
  /** Valor de nombreCatalogo en los DTOs */
  nombreCatalogo: string;
  /** Si usa el endpoint especial de CatSituacion */
  isCatSituacion: boolean;
}

export const CATALOGO_TYPE_CONFIG: Record<CatalogoType, CatalogoTypeConfig> = {
  AREA: {
    getEndpoint: 'Catalogos/AREAS',
    createEndpoint: 'Catalogos',
    updateEndpointBase: 'Catalogos',
    nombreCatalogo: 'AREAS',
    isCatSituacion: false,
  },
  SITUACION: {
    getEndpoint: 'CatSituacion',
    createEndpoint: 'CatSituacion',
    updateEndpointBase: 'CatSituacion',
    nombreCatalogo: 'CatSituacion',
    isCatSituacion: true,
  },
  TIPO_DOCUMENTO: {
    getEndpoint: 'Catalogos/TIPO_DOCUMENTO',
    createEndpoint: 'Catalogos',
    updateEndpointBase: 'Catalogos',
    nombreCatalogo: 'TIPO_DOCUMENTO',
    isCatSituacion: false,
  },
  TIPO_TEMA: {
    getEndpoint: 'Catalogos/TIPO_TEMA',
    createEndpoint: 'Catalogos',
    updateEndpointBase: 'Catalogos',
    nombreCatalogo: 'TIPO_TEMA',
    isCatSituacion: false,
  },
  PRIORIDAD: {
    getEndpoint: 'Catalogos/TIPO_PRIORIDAD',
    createEndpoint: 'Catalogos',
    updateEndpointBase: 'Catalogos',
    nombreCatalogo: 'TIPO_PRIORIDAD',
    isCatSituacion: false,
  },
  TIPO_USUARIO: {
    getEndpoint: 'Catalogos/Tipo_usuario',
    createEndpoint: 'Catalogos',
    updateEndpointBase: 'Catalogos',
    nombreCatalogo: 'Tipo_usuario',
    isCatSituacion: false,
  },
};

// ─── Tarjeta del grid ─────────────────────────────────────────────────────────

export interface CatalogoSummaryCard {
  type: CatalogoType;
  title: string;
  subtitle: string;
  icon: string;
  accentClass: string;
  count: number;
}

// ─── Formulario de creación ───────────────────────────────────────────────────

export interface CatalogoFormValue {
  descripcion: string;
}
