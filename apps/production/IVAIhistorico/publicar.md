# Publicación de IVAIhistorico

## 1) Ubicarse en la raíz del workspace

Ruta esperada:

`C:\Users\ESantiago\Documents\Proyectos\Proyectos-dti`

## 2) Generar build de producción

Ejecutar:

`npx nx build IVAIhistorico --configuration=production`

Este comando ya genera la app para publicarse en:

`https://sistemas4.cgever.gob.mx/ivaihistorico/`

También funciona:

`npx nx build IVAIhistorico`

(En este proyecto, la configuración por default es `production`.)

## 3) Verificar carpeta de salida

El build queda en:

`dist/apps/production/IVAIhistorico`

La carpeta que se debe publicar es:

`dist/apps/production/IVAIhistorico/browser`

## 4) Qué copiar al servidor

Copiar **todo el contenido** de:

`dist/apps/production/IVAIhistorico/browser/*`

hacia la carpeta pública de tu servidor (`wwwroot`, `public_html` o equivalente).

## 5) (Opcional) Empaquetar para enviar

En PowerShell:

`Compress-Archive -Path dist/apps/production/IVAIhistorico/browser/* -DestinationPath IVAIhistorico-build.zip -Force`

## 6) (Opcional) Probar localmente el resultado estático

`npx nx run IVAIhistorico:serve-static`

Luego abrir:

`http://localhost:4200`

---

## Nota sobre `proxy.conf.json`

El `proxy.conf.json` se usa para desarrollo (`serve`), no afecta el contenido final del build estático.

## Si en servidor marca error

Verifica en IIS:

1. Que exista una aplicación con alias `ivaihistorico` dentro del sitio `sistemas4.cgever.gob.mx`.
2. Que la ruta física apunte a `\\svr-sistemas4\ASP\IVAIHistorico\front`.
3. Que en esa carpeta exista `index.html` (copiando el contenido de `dist/apps/production/IVAIhistorico/browser`).
4. Que `index.html` tenga `<base href="/ivaihistorico/">` (el build de producción ya lo deja así).
5. Que el App Pool tenga permisos de lectura a esa carpeta compartida.
6. Si al refrescar rutas internas da 404, agregar regla de URL Rewrite para redirigir a `index.html`.

Diagnóstico rápido del error de tus capturas (`/ivaihistorico/index/`):

- Prueba directa: `https://sistemas4.cgever.gob.mx/ivaihistorico/index.html`
- Si `index.html` sí abre pero `/ivaihistorico/` no, falta/está mal el **Default Document** en IIS.
- Si ninguna abre, la aplicación IIS no está apuntando a la carpeta correcta o no hay permisos.

Este proyecto ya incluye `web.config` en `public/` para publicar en IIS con SPA rewrite.


https://sistemas4.cgever.gob.mx/ivaihistorico/
