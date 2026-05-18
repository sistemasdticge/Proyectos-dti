import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiConfigService } from '@proyectos-dti/shared-ui';

export interface SessionLoginRequest {
  login: string;
  password: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface SessionCurrentUser {
  userName?: string;
  email?: string | null;
  role?: string;
  tipoUsuario?: string;
  areaId?: string;
  area?: string;
}

interface SessionLoginResponse {
  accessToken?: string;
  token?: string;
  jwt?: string;
  bearerToken?: string;
  refreshToken?: string;
  refresh?: string;
  userName?: string;
  email?: string | null;
  rol?: string;
  area?: string | null;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private readonly accessTokenKey = 'sisar.accessToken';
  private readonly refreshTokenKey = 'sisar.refreshToken';
  private readonly currentUserKey = 'sisar.currentUser';

  login(request: SessionLoginRequest): Observable<SessionTokens> {
    const url = `${this.apiConfig.getApiBaseUrl()}/Sesion/login`;
    return this.http.post<SessionLoginResponse>(url, request).pipe(
      map((response) => {
        const accessToken = this.extractAccessToken(response);
        const refreshToken = this.extractRefreshToken(response);

        if (!accessToken) {
          throw new Error('El login no devolvio access token.');
        }

        this.setTokens({ accessToken, refreshToken });
        const currentUser = this.buildCurrentUser(response);
        this.setCurrentUser(currentUser);
        const payload = this.decodeJwtPayload(accessToken);
        const areaId = this.readClaim(payload, ['areaId', 'AreaId', 'area_id', 'AreaID', 'areaID', 'idArea', 'IdArea']);
        const role = this.readClaim(payload, [
          'role',
          'roles',
          'Rol',
          'tipoUsuario',
          'TipoUsuario',
          'tipo_usuario',
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
        ]);
        console.log('[Auth/Login] response:', response);
        console.log('[Auth/Login] currentUser:', currentUser);
        console.log('[Auth/Login] areaId mapeada:', currentUser.areaId ?? '');
        console.log('[Auth/JWT] payload:', payload);
        console.log('[Auth/JWT] areaId detectada:', areaId);
        console.log('[Auth/JWT] rol detectado:', role);
        return { accessToken, refreshToken };
      })
    );
  }

  refreshToken(): Observable<SessionTokens> {
    const url = `${this.apiConfig.getApiBaseUrl()}/Sesion/refresh-token`;
    return this.http.post<SessionLoginResponse>(url, {}).pipe(
      map((response) => {
        const accessToken = this.extractAccessToken(response);
        const refreshToken = this.extractRefreshToken(response) ?? this.getRefreshToken() ?? undefined;

        if (!accessToken) {
          throw new Error('El refresh no devolvio access token.');
        }

        this.setTokens({ accessToken, refreshToken });
        return { accessToken, refreshToken };
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getCurrentUser(): SessionCurrentUser | null {
    const value = localStorage.getItem(this.currentUserKey);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as SessionCurrentUser;
    } catch {
      return null;
    }
  }

  hasSession(): boolean {
    return !!this.getAccessToken();
  }

  clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.currentUserKey);
  }

  private setTokens(tokens: SessionTokens): void {
    localStorage.setItem(this.accessTokenKey, tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, tokens.refreshToken);
    }
  }

  private setCurrentUser(currentUser: SessionCurrentUser): void {
    localStorage.setItem(this.currentUserKey, JSON.stringify(currentUser));
  }

  private buildCurrentUser(response: SessionLoginResponse): SessionCurrentUser {
    const responseArea = this.asString(response.area).trim();
    const areaIsUuid = this.isUuid(responseArea);
    const role = this.asString(response.rol).trim();

    return {
      userName: this.asString(response.userName).trim() || undefined,
      email: typeof response.email === 'string' ? response.email : response.email === null ? null : undefined,
      role: role || undefined,
      tipoUsuario: role || undefined,
      areaId: areaIsUuid ? responseArea : undefined,
      area: !areaIsUuid && responseArea ? responseArea : undefined,
    };
  }

  private extractAccessToken(response: SessionLoginResponse): string {
    const token =
      this.asString(response.accessToken) ||
      this.asString(response.token) ||
      this.asString(response.jwt) ||
      this.asString(response.bearerToken);

    return token;
  }

  private extractRefreshToken(response: SessionLoginResponse): string {
    return this.asString(response.refreshToken) || this.asString(response.refresh);
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private decodeJwtPayload(token: string): Record<string, unknown> {
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
}
