/**
 * Servicio genérico de API HTTP para SISAR
 * Maneja autenticación Bearer, errores y request/response
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProblemDetails } from '../models/tema.model';
import { ApiConfigService } from './api-config.service';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiBaseService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  /**
   * GET request genérico
   * @param endpoint Ruta relativa: ej. 'Tema', 'Tema/123'
   */
  get<T>(endpoint: string): Observable<T> {
    const url = `${this.apiConfig.getApiBaseUrl()}/${endpoint}`;
    console.log(`📥 GET: ${url}`);
    return this.http
      .get<T>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * GET request para descargar archivos binarios.
   */
  getBlob(endpoint: string): Observable<Blob> {
    const url = `${this.apiConfig.getApiBaseUrl()}/${endpoint}`;
    console.log(`GET Blob: ${url}`);
    return this.http
      .get(url, { responseType: 'blob' })
      .pipe(catchError(this.handleError));
  }

  /**
   * POST request JSON
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    const url = `${this.apiConfig.getApiBaseUrl()}/${endpoint}`;
    console.log(`📤 POST JSON: ${url}`, body);
    return this.http
      .post<T>(url, body)
      .pipe(catchError(this.handleError));
  }

  /**
   * PUT request JSON
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    const url = `${this.apiConfig.getApiBaseUrl()}/${endpoint}`;
    console.log(`🔄 PUT JSON: ${url}`, body);
    return this.http
      .put<T>(url, body)
      .pipe(catchError(this.handleError));
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.apiConfig.getApiBaseUrl()}/${endpoint}`;
    console.log(`🗑️ DELETE: ${url}`);
    return this.http
      .delete<T>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * POST multipart/form-data (para archivos)
   * ej: uploadFile('Tema/Upload', formData)
   */
  postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    const url = `${this.apiConfig.getApiBaseUrl()}/${endpoint}`;
    console.log(`📤 POST FormData: ${url}`, formData);
    return this.http
      .post<T>(url, formData)
      .pipe(
        catchError(this.handleError),
      );
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error en la solicitud al servidor';
    let errorDetail = '';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente (ej: conexión)
      errorMessage = `Error de cliente: ${error.error.message}`;
    } else {
      // Error del servidor (400, 404, 500, etc)
      const problemDetails = error.error as ProblemDetails;
      errorMessage = problemDetails?.title || `Error HTTP ${error.status}`;
      errorDetail = problemDetails?.detail || error.message;
    }

    const isCatalogAreasEndpoint =
      typeof error.url === 'string' && error.url.toUpperCase().includes('/CATALOGOS/AREAS');

    if (!isCatalogAreasEndpoint) {
      console.error('❌ API Error:', {
        status: error.status,
        url: error.url,
        message: errorMessage,
        detail: errorDetail,
        fullError: error,
      });
    }

    return throwError(() => ({
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: errorMessage,
      detail: errorDetail,
      error: error.error,
      rawError: error,
    }));
  }
}
