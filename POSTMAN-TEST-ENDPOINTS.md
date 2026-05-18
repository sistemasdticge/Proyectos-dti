# 🧪 Guía para Probar Endpoints en Postman

## Paso 1: Abre Postman y crea una nueva request

### Opción A: Intenta con `/api`
```
POST http://svr-apps1/sisarback.test/api/Tema
Content-Type: multipart/form-data

Body:
- formFiles: [selecciona un archivo de prueba]
- temaR: {"tipoTemaId":"3fa85f64-5717-4562-b3fc-2c963f66afa6","tipoPrioridadId":"3fa85f64-5717-4562-b3fc-2c963f66afb2","descripcion":"Test tema","numControl":"2026-SIS-0301","solventado":false}
```

**Resultado esperado:** 200 OK con respuesta JSON

---

### Opción B: Intenta con `/opi`
```
POST http://svr-apps1/sisarback.test/opi/Tema
Content-Type: multipart/form-data

Body: [mismo que arriba]
```

**Resultado esperado:** 200 OK con respuesta JSON

---

### Opción C: Otros prefijos comunes
- `/api/v1/Tema`
- `/service/api/Tema`
- `/sisar/api/Tema`
- `/sisarback/api/Tema`

---

## 📝 Notas

1. **Cuál resulta sin 404?** → Ese es el endpoint correcto
2. Si TODOS dan 404 → El servidor no está respondiendo o la URL es completamente diferente
3. Si necesita autenticación → Agrega header `Authorization: Bearer <token>`

---

## Después de encontrar el correcto:

**Dime cuál funcionó y cambio el código inmediatamente** 👇
