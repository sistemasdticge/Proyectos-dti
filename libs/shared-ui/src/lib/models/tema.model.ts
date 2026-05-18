/**
 * DTOs y Modelos para SISAR API - Módulo de Temas
 * Basado en Swagger: http://svr-apps1/sisarback.test/swagger/index.html
 */

// ==================== TEMA ====================
export interface TemaArchivoDTO {
  id: string; // uuid
  nombreArchivo: string;
  tipoDocumentoId: string; // uuid
  tipoDocumento: string;
}

export interface TemaTurnoCreateDTO {
  areaId: string; // uuid
  area: string;
}

export interface TemaDTO {
  id: string; // uuid
  tipoTemaId: string; // uuid
  tipoTema: string;
  tipoPrioridadId: string; // uuid
  tipoPrioridad: string;
  descripcion: string;
  fechaVencimiento: string; // date-time ISO 8601
  numControl: string;
  tipoDocumentoId?: string; // uuid, requerido por backend solo cuando POST /Tema adjunta archivo
  solventado: boolean;
  fechaSolventado: string; // date-time ISO 8601
  archivos: TemaArchivoDTO[];
  turnos?: TemaTurnoCreateDTO[];
}

export interface TemaUpdateDTO {
  id: string; // uuid
  tipoTemaId: string; // uuid
  tipoPrioridadId: string; // uuid
  descripcion: string;
  fechaVencimiento: string | null; // date-time
  numControl: string;
}

// ==================== TEMA SEGUIMIENTO ====================
export interface TemaSeguimientoDTO {
  id: string; // uuid
  temaTurnoId: string; // uuid
  fecha: string; // date-time ISO 8601
  descripcion: string;
  situacionId: string; // uuid
  situacion: string;
  archivos: TemaArchivoDTO[];
}

export interface TemaSeguimientoUpdateDTO {
  id: string; // uuid
  tematurnoId: string; // uuid
  fecha: string; // date-time
  descripcion: string;
  situacionId: string; // uuid
}

// ==================== TEMA TURNO ====================
export interface TemaTurnoDTO {
  id: string; // uuid
  temaId: string; // uuid
  areaId: string; // uuid
  area: string;
  areaCatalogo: string;
  solventado: number; // int32
  fechaSolventado: string; // date-time
}

export interface TemaTurnoAddDTO {
  temaId: string; // uuid
  areaId: string; // uuid
  area: string;
}

// ==================== CATÁLOGOS ====================
export interface CatSituacionDTO {
  id: string; // uuid
  descripcion: string;
  activo?: number; // int32
  esSolventado: number; // int32
}

export interface CatalogoDTO {
  id: string; // uuid
  descripcion: string;
  activo?: number; // int32
}

// ==================== RESPUESTAS DE ERROR ====================
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  [key: string]: unknown;
}

// ==================== REQUESTS MULTIPART ====================
export interface TemaCreateRequest {
  formFiles: File[];
  temaR: string; // JSON stringified TemaDTO
}

export interface TemaSeguimientoCreateRequest {
  formFiles: File[];
  temaR: string; // JSON stringified TemaSeguimientoDTO
}

export interface TemaUploadRequest {
  file: File;
  temaId: string; // uuid query param
  tipoDocumentoId: string; // uuid query param
}
