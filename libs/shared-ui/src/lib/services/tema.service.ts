/**
 * Servicio de TEMA
 * Métodos para consumir endpoints de Tema y TemaSeguimiento
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { inject } from '@angular/core';
import {
  CatSituacionDTO,
  CatalogoDTO,
  TemaDTO,
  TemaUpdateDTO,
  TemaSeguimientoDTO,
  TemaSeguimientoUpdateDTO,
  TemaTurnoDTO,
  TemaTurnoAddDTO,
  TemaArchivoDTO,
} from '../models/tema.model';

@Injectable({
  providedIn: 'root',
})
export class TemaService {
  private readonly apiBase = inject(ApiBaseService);

  /**
   * GET /api/Catalogos/{catalogo} - Obtiene elementos de catálogo
   */
  getCatalogo(catalogo: string): Observable<CatalogoDTO[]> {
    return this.apiBase.get<CatalogoDTO[]>(`Catalogos/${catalogo}`);
  }

  /**
   * GET /api/CatSituacion - Obtiene situaciones para seguimiento
   */
  getCatSituaciones(): Observable<CatSituacionDTO[]> {
    return this.apiBase.get<CatSituacionDTO[]>('CatSituacion');
  }

  // ======================== TEMA ENDPOINTS ========================

  /**
   * GET /opi/Tema - Obtiene lista de todos los temas
   */
  getAllTemas(): Observable<TemaDTO[]> {
    return this.apiBase.get<TemaDTO[]>('Tema');
  }

  /**
   * GET /opi/Tema/{id} - Obtiene un tema por ID
   */
  getTemaById(id: string): Observable<TemaDTO> {
    return this.apiBase.get<TemaDTO>(`Tema/${id}`);
  }

  /**
   * POST /api/Tema - Crea un nuevo tema con archivo opcional
   * @param tema Datos del tema
   * @param files Archivo adjunto opcional. El backend espera la key formFiles en plural.
   */
  createTema(tema: Partial<TemaDTO>, files?: File[]): Observable<TemaDTO> {
    const formData = new FormData();
    const file = files?.[0] ?? null;
    const temaR = JSON.stringify(tema);

    if (file) {
      formData.append('formFiles', file);
    }

    formData.append('temaR', temaR);

    console.log('[TemaService] POST /Tema temaR final:', temaR);
    console.log('[TemaService] POST /Tema hay archivo:', !!file);
    console.log('[TemaService] POST /Tema archivo:', file?.name ?? '(sin archivo)');
    console.log('[TemaService] POST /Tema FormData archivo key:', file ? 'formFiles' : '(sin archivo)');

    return this.apiBase.postFormData<TemaDTO>('Tema', formData);
  }

  /**
   * PUT /opi/Tema/{id} - Actualiza un tema
   */
  updateTema(id: string, tema: TemaUpdateDTO): Observable<TemaDTO> {
    return this.apiBase.put<TemaDTO>(`Tema/${id}`, tema);
  }

  /**
   * DELETE /opi/Tema/{id} - Elimina un tema
   */
  deleteTema(id: string): Observable<TemaDTO> {
    return this.apiBase.delete<TemaDTO>(`Tema/${id}`);
  }

  /**
   * POST /opi/Tema/Upload - Sube un archivo a un tema
   * @param temaId ID del tema
   * @param tipoDocumentoId ID del tipo de documento
   * @param file Archivo a subir
   */
  uploadTemaFile(
    temaId: string,
    tipoDocumentoId: string,
    file: File
  ): Observable<TemaArchivoDTO> {
    const formData = new FormData();
    formData.append('file', file);

    return this.apiBase.postFormData<TemaArchivoDTO>(
      `Tema/Upload?temaId=${encodeURIComponent(temaId)}&tipoDocumentoId=${encodeURIComponent(tipoDocumentoId)}`,
      formData
    );
  }

  /**
   * DELETE /opi/Tema/Archivo/{temaId} - Elimina un archivo de tema
   */
  deleteTemaFile(temaId: string): Observable<TemaDTO> {
    return this.apiBase.delete<TemaDTO>(`Tema/Archivo/${temaId}`);
  }

  /**
   * GET /api/Tema/download/archivoId/{documentoId}
   * Descarga un archivo adjunto al tema.
   */
  downloadTemaArchivo(documentoId: string): Observable<Blob> {
    return this.apiBase.getBlob(
      `Tema/download/archivoId/${encodeURIComponent(documentoId)}`
    );
  }

  // ======================== TEMA SEGUIMIENTO ENDPOINTS ========================

  /**
   * GET /api/TemaSeguimiento/{id} - Obtiene seguimiento por ID
   */
  getTemaSeguimientoById(id: string): Observable<TemaSeguimientoDTO> {
    return this.apiBase.get<TemaSeguimientoDTO>(`TemaSeguimiento/${id}`);
  }

  /**
   * GET /api/TemaSeguimiento/turnoId/{id} - Obtiene historial de seguimientos por turno
   */
  getTemaSeguimientosByTurnoId(turnoId: string): Observable<TemaSeguimientoDTO[]> {
    return this.apiBase.get<TemaSeguimientoDTO[]>(`TemaSeguimiento/turnoId/${turnoId}`);
  }

  /**
   * POST /api/TemaSeguimiento - Crea un nuevo seguimiento
   * @param seguimiento Datos del seguimiento
   * @param files Archivos adjuntos (opcional)
   */
  createTemaSeguimiento(
    seguimiento: Partial<TemaSeguimientoDTO> | Record<string, unknown>,
    files?: File[]
  ): Observable<TemaSeguimientoDTO> {
    const formData = new FormData();
    const normalizedFiles = files ?? [];

    console.log('[SeguimientoService] temaR payload:', seguimiento);
    console.log('[SeguimientoService] files count:', normalizedFiles.length);

    if (normalizedFiles.length > 0) {
      normalizedFiles.forEach((file, index) => {
        console.log(`[SeguimientoService] file ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
        });
        formData.append('formFiles', file);
      });
    }

    formData.append('temaR', JSON.stringify(seguimiento));

    const formDataEntries = [
      {
        key: 'temaR',
        value: formData.get('temaR'),
      },
      ...normalizedFiles.map((file) => ({
        key: 'formFiles',
        fileName: file.name,
        size: file.size,
        type: file.type,
      })),
    ];

    console.log('[SeguimientoService] FormData entries:', formDataEntries);

    return this.apiBase.postFormData<TemaSeguimientoDTO>(
      'TemaSeguimiento',
      formData
    );
  }

  /**
   * PUT /api/TemaSeguimiento/{id} - Actualiza un seguimiento
   */
  updateTemaSeguimiento(
    id: string,
    seguimiento: TemaSeguimientoUpdateDTO
  ): Observable<TemaSeguimientoDTO> {
    return this.apiBase.put<TemaSeguimientoDTO>(
      `TemaSeguimiento/${id}`,
      seguimiento
    );
  }

  /**
   * DELETE /api/TemaSeguimiento/{id} - Elimina un seguimiento
   */
  deleteTemaSeguimiento(id: string): Observable<TemaDTO> {
    return this.apiBase.delete<TemaDTO>(`TemaSeguimiento/${id}`);
  }

  /**
   * DELETE /api/TemaSeguimiento/Archivo/{temaSeguimientoArchivoId}
   * Elimina un archivo de seguimiento
   */
  deleteTemaSeguimientoFile(
    temaSeguimientoArchivoId: string
  ): Observable<TemaDTO> {
    return this.apiBase.delete<TemaDTO>(
      `TemaSeguimiento/Archivo/${temaSeguimientoArchivoId}`
    );
  }

  /**
   * GET /api/TemaSeguimiento/download/archivoId/{documentoId}/temaId/{temaId}
   * Descarga un archivo adjunto a un seguimiento.
   */
  downloadTemaSeguimientoArchivo(documentoId: string, temaId: string): Observable<Blob> {
    return this.apiBase.getBlob(
      `TemaSeguimiento/download/archivoId/${encodeURIComponent(documentoId)}/temaId/${encodeURIComponent(temaId)}`
    );
  }

  // ======================== TEMA TURNO ENDPOINTS ========================

  /**
   * GET /api/TemaTurno/{id} - Obtiene turno por ID
   */
  getTemaTurnoById(id: string): Observable<TemaTurnoDTO> {
    return this.apiBase.get<TemaTurnoDTO>(`TemaTurno/${id}`);
  }

  /**
   * GET /api/TemaTurno/areaId/{areaId} - Obtiene turnos por área
   */
  getTemaTurnoByAreaId(areaId: string): Observable<TemaTurnoDTO[]> {
    return this.apiBase.get<TemaTurnoDTO[]>(`TemaTurno/areaId/${areaId}`);
  }

  /**
   * GET /api/TemaTurno/areaId/{areaId}/solventado/{solventado}
   * Obtiene turnos por área y estado solventado
   */
  getTemaTurnoByAreaAndSolventado(
    areaId: string,
    solventado: number
  ): Observable<TemaTurnoDTO[]> {
    return this.apiBase.get<TemaTurnoDTO[]>(
      `TemaTurno/areaId/${areaId}/solventado/${solventado}`
    );
  }

  /**
   * GET /api/TemaTurno/temaId/{temaId} - Obtiene turnos por tema
   */
  getTemaTurnoByTemaId(temaId: string): Observable<TemaTurnoDTO[]> {
    return this.apiBase.get<TemaTurnoDTO[]>(`TemaTurno/temaId/${temaId}`);
  }

  /**
   * GET /api/TemaTurno/temaId/{temaId}/solventado/{solventado}
   * Obtiene turnos por tema y estado solventado
   */
  getTemaTurnoByTemaAndSolventado(
    temaId: string,
    solventado: number
  ): Observable<TemaTurnoDTO[]> {
    return this.apiBase.get<TemaTurnoDTO[]>(
      `TemaTurno/temaId/${temaId}/solventado/${solventado}`
    );
  }

  /**
   * POST /api/TemaTurno - Crea un nuevo turno
   */
  createTemaTurno(turno: TemaTurnoAddDTO): Observable<TemaTurnoDTO> {
    return this.apiBase.post<TemaTurnoDTO>('TemaTurno', turno);
  }

  /**
   * DELETE /api/TemaTurno/{id} - Elimina un turno
   */
  deleteTemaTurno(id: string): Observable<TemaTurnoDTO> {
    return this.apiBase.delete<TemaTurnoDTO>(`TemaTurno/${id}`);
  }
}
