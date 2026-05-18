# 🚀 Cómo Debuggear y Cambiar Endpoints de API

## ✅ Lo que ya está listo

1. ✅ Los servicios ahora usan URLs dinámicas (cambiables sin editar código)
2. ✅ Consola de debugging automática en el navegador (`window.apiDebug`)
3. ✅ Logging detallado de todas las requests HTTP
4. ✅ Error handling con mensajes claros en el modal

---

## 📍 Pasos para Probar y Cambiar Endpoints

### Paso 1: Abre el navegador en http://localhost:4200

### Paso 2: Abre la consola (F12)

Deberías ver:
```
✅ API Debug Helper registrado. Escribe: window.apiDebug.help()
```

### Paso 3: En la consola, escribe el comando para ver opciones

```javascript
window.apiDebug.listOptions()
```

Verás algo como:
```
🔧 OPCIONES DE API DISPONIBLES:
  1. OPI (actual)
     http://svr-apps1/sisarback.test/opi
  2. API
     http://svr-apps1/sisarback.test/api
  3. API v1
     http://svr-apps1/sisarback.test/api/v1
  4. Service/API
     http://svr-apps1/sisarback.test/service/api
  5. SISAR/API
     http://svr-apps1/sisarback.test/sisar/api
```

### Paso 4: Probando `/api` (si obtuviste 404 con `/opi`)

En la consola, escribe:
```javascript
window.apiDebug.useApi()
```

Verás:
```
✅ Cambiado a /api: http://svr-apps1/sisarback.test/api
```

### Paso 5: Intenta crear un Tema

1. Haz clic en **"+ Nuevo Tema"**
2. Rellena los campos
3. Haz clic en **"Registrar Tema"**
4. **Mira en la consola** (no cierres F12)

Deberías ver:
```
🔧 Modal abierto. Configuración actual:
  📍 API URL: http://svr-apps1/sisarback.test/api
  🔄 Opciones disponibles: [...]

📤 POST FormData: http://svr-apps1/sisarback.test/api/Tema {...}
✅ Tema creado exitosamente: {id: "...", ...}
📤 Creando TemaTurno para área TI (uuid...)
🔄 Enviando 3 TemaTurnos en paralelo...
🎉 Tema y turnos registrados completamente
```

### Paso 6: Si ves error 404 con `/api` también

Intenta con otra opción:
```javascript
window.apiDebug.setUrl('http://svr-apps1/sisarback.test/api/v1')
```

O:
```javascript
window.apiDebug.setUrl('http://svr-apps1/sisarback.test/sisar/api')
```

Luego repite los pasos 5-6.

---

## 🧪 Usando Postman (Alternativa)

Si los cambios dinámicos en consola no funcionan, usa Postman para encontrar el endpoint correcto:

### Request Test en Postman

```
POST http://svr-apps1/sisarback.test/api/Tema
Content-Type: multipart/form-data

Body:
  formFiles: [archivo_de_prueba.pdf]
  temaR: {
    "tipoTemaId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tipoPrioridadId": "3fa85f64-5717-4562-b3fc-2c963f66afb2",
    "descripcion": "Test tema desde Postman",
    "numControl": "2026-TEST-001",
    "solventado": false
  }
```

**Resultado esperado:** 
- ✅ 200 OK con JSON response `{id: "...", ...}`
- ❌ 404 Not Found → Intenta con `/opi` o `/api/v1`
- ❌ 400 Bad Request → Verifica los datos, tal vez faltan campos

Una vez encuentres cuál funciona, cámbialo en la consola:
```javascript
window.apiDebug.setUrl('URL_QUE_FUNCIONO')
```

---

## 📝 Comandos Rápidos en Consola

```javascript
// Ver URL actual
window.apiDebug.getCurrentUrl()

// Cambiar a /api
window.apiDebug.useApi()

// Cambiar a /opi
window.apiDebug.useOpi()

// Ver todas las opciones disponibles
window.apiDebug.listOptions()

// Cambiar a URL personalizada
window.apiDebug.setUrl('http://svr-apps1/sisarback.test/tu-endpoint')

// Ver ayuda completa
window.apiDebug.help()
```

---

## 🔍 Qué mirar en la consola al crear un tema

**Antes de hacer clic en "Registrar":**
- ✅ Modal muestra configuración actual: `📍 API URL: ...`

**Al hacer clic en "Registrar":**
- ✅ `📤 POST FormData: http://...` → Se está enviando
- ✅ `✅ Tema creado exitosamente: {...}` → Paso 1 exitoso
- ✅ `📤 Creando TemaTurno...` → Se crea para cada área
- ✅ `🎉 Tema y turnos registrados completamente` → ¡ÉXITO!

**Si hay error:**
- ❌ `❌ Error HTTP 404` → Endpoint no existe, intenta otra URL
- ❌ `❌ Error HTTP 400` → Datos inválidos, revisa los campos
- ❌ `❌ Error HTTP 500` → Error en servidor, intenta más tarde

---

## ✅ Checklist Final

- [ ] Abriste http://localhost:4200
- [ ] Abriste la consola (F12)
- [ ] Viste "✅ API Debug Helper registrado..."
- [ ] Corriste `window.apiDebug.listOptions()`
- [ ] Probaste cambiar URL con `window.apiDebug.useApi()`
- [ ] Creaste un tema de prueba
- [ ] Viste los logs en consola mostrando las requests
- [ ] Modal mostró ✅ o ❌ feedback

Si llegaste aquí, **¡tienes todo lo necesario para debuggear sin Postman!** 🎉
