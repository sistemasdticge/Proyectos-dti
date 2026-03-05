# Publicación de IVAIhistorico

## 1) Ubicarse en la raíz del workspace

Ruta esperada:

`C:\Users\ESantiago\Documents\Proyectos\Proyectos-dti`

## 2) Generar build de producción

Ejecutar:

`npx nx build IVAIhistorico --configuration=production`

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
