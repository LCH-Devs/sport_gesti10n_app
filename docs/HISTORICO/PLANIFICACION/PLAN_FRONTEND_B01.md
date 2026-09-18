# Plan frontend habilitado por B01

> Documento de apoyo histórico. El estado vigente se consulta en
> [`ESTADO_PROYECTO.md`](ESTADO_PROYECTO.md) y las prioridades en
> [`PLAN_FRONTEND_LANZAMIENTO.md`](PLAN_FRONTEND_LANZAMIENTO.md).

Fecha: 09/09/2026. B01 de backend está implementado. Este lote concreta el trabajo web que ya puede ejecutarse sin inventar endpoints nuevos.

## Objetivo

Hacer que la aplicación reaccione de forma consistente a la vigencia real de la sesión, a la suspensión o baja del club y a las respuestas públicas del panel de plataforma.

## Tareas

### B01-FE01 — Sesión vigente

- Usar `expires_in` de login/cambio de club para calcular la expiración local.
- Ante 401, limpiar la sesión correspondiente y enviar al login con un mensaje breve.
- Ante 403 por club suspendido o membresía revocada, limpiar el contexto del club y mostrar el estado recibido.
- No dejar visible información del club anterior durante el cambio de club.

### B01-FE02 — Cambio de club

- Renovar sesión mediante `membresia_id`.
- Recargar tema, navegación y datos después de cambiar de membresía.
- Ignorar respuestas pendientes asociadas al club anterior.

### B01-FE03 — Plataforma segura

- Consumir los recursos con DTOs públicos; no depender de campos privados ni del grafo Prisma.
- Verificar que listados de socios, familias, reservas, liquidaciones y cobros rendericen con el objeto plano actual.
- Mantener acciones de plataforma separadas de las rutas de club.

### B01-FE04 — Estados visibles

- Estado de sesión vencida.
- Club suspendido.
- Membresía dada de baja.
- Plataforma desactivada.
- Rol modificado durante una sesión.

Cada estado debe tener mensaje, acción disponible y retorno seguro al destino correspondiente.

## Validación manual

1. Iniciar sesión en dos clubes y cambiar entre ellos.
2. Suspender un club desde plataforma y comprobar que una sesión existente pierde acceso.
3. Dar de baja una membresía y comprobar que el token anterior deja de autorizar.
4. Desactivar un superadmin y comprobar el rechazo de sus requests.
5. Abrir los recursos de plataforma y confirmar que no aparecen hashes, tokens ni credenciales.

## Avance realizado

- `expires_in` se persiste como `expires_at` para staff, socio y plataforma.
- Las lecturas de sesión descartan automáticamente sesiones expiradas.
- Las respuestas 401 y 403 disparan limpieza de la sesión autenticada y retorno al acceso del canal.
- Type-check web aprobado.

## Criterio de cierre

- Type-check web aprobado.
- Matriz anterior ejecutada en navegador con dos clubes y los roles incluidos.
- Sin datos del tenant anterior después de cambio, 401 o 403.
- Registrar evidencia y defectos en `docs/TAREAS_MANUALES_FRONTEND.md`.
