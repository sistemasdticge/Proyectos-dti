# 🔧 Solución: Cambia el Endpoint sin Editar Código

El sistema ahora está configurado para **cambiar dinámicamente la URL base de la API** desde la consola del navegador.

---

## ✅ Pasos para Probar

### 1. Verifica que la app esté compilando
```
✅ localhost:4200 debe cargar sin errores
```

### 2. Abre DevTools presionando **F12**

### 3. En la consola (pestaña Console), escribe:
```javascript
// Ver la URL actual
const apiConfig = window.ng.probe(document.body).injector.get('ApiConfigService');
apiConfig.getApiBaseUrl()
```

**Resultado:** 
```
http://svr-apps1/sisarback.test/opi
```

### 4. Cambiar a `/api`:
```javascript
apiConfig.setApiBaseUrl('http://svr-apps1/sisarback.test/api')
```

### 5. Intenta crear un Tema

1. Haz clic en **"+ Nuevo Tema"**
2. Rellena campos y haz clic **"Registrar Tema"**
3. Observa:
   - La consola muestra qué URL se está usando
   - El modal muestra si fue `✅ exitoso` o `❌ error`

---

## 🎯 Resumido: 3 Comandos en Consola

```javascript
// 1. Obtener el servicio ApiConfigService
const api = window.ng.probe(document.body).injector.get('ApiConfigService');

// 2. Ver URL actual
api.getApiBaseUrl()

// 3. Cambiar URL
api.setApiBaseUrl('http://svr-apps1/sisarback.test/api')
```

---

## 🧪 Probando Diferentes URLs

Cambia el endpoint dinámicamente sin recargar la página:

```javascript
// Cambiar a /api
api.setApiBaseUrl('http://svr-apps1/sisarback.test/api')

// Cambiar a /opi  
api.setApiBaseUrl('http://svr-apps1/sisarback.test/opi')

// Cambiar a /api/v1
api.setApiBaseUrl('http://svr-apps1/sisarback.test/api/v1')
```

Luego **crea un tema** y mira qué pasa.

---

## 📍 Cómo Saber Cuál Funciona

En la consola después de crear un tema, deberías ver:

**✅ Si funciona:**
```
✅ Tema creado exitosamente: {...}
📤 Creando TemaTurno para área...
🎉 Tema y turnos registrados completamente
```

**❌ Si NO funciona (404):**
```
❌ Error HTTP 404
Error: 'Http failure response for http://svr-apps1/sisarback.test/[tu-url]/Tema: 404 Not Found'
```

Si ves 404, **intenta cambiar a otra URL** y repite.

---

## 🎬 Demo Rápida

1. Abre http://localhost:4200
2. Presiona F12
3. En Console, pega esto:
```javascript
const api = window.ng.probe(document.body).injector.get('ApiConfigService');
api.setApiBaseUrl('http://svr-apps1/sisarback.test/api');
console.log('URL cambiada a:', api.getApiBaseUrl());
```
4. Haz clic en **"+ Nuevo Tema"** 
5. Llena los datos y presiona **"Registrar Tema"**
6. Revisa la consola para ver los logs

---

## ❓ ¿Cuál es la URL correcta?

Basándonos en el error 404 que viste, los candidatos son:

| URL | Estado |
|-----|--------|
| `/api/Tema` | ❌ 404 (según error mostrado) |
| `/opi/Tema` | ❓ Prueba con este |
| `/api/v1/Tema` | ❓ Prueba con este |

**La app ahora te deja cambiar sin recompilación**, así que puedes probar todas hasta encontrar la correcta.

---

Una vez encuentres cuál funciona ✅, me dices y actualizo el valor por defecto en el código.
