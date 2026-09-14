# Pendientes de backend para cerrar frontend

Documento de coordinación entre API y web. Fecha: 09/09/2026. El frontend no debe inventar rutas ni considerar terminada una pantalla hasta que estos contratos estén definidos en `docs/API.md`, implementados y probados.

## Estado de implementación

### B01 — Sesión, revocación y respuestas seguras: **implementado en backend; integración frontend pendiente**

Disponible para consumo web:

- JWT con vigencia de 8 horas y `expires_in` expresado en segundos.
- Validación de sesión contra la base en cada request autenticado.
- Revocación efectiva cuando se elimina la membresía, se suspende el club o se desactiva el superadmin.
- Rol y `club_id` refrescados desde la membresía vigente.
- Recursos del panel de plataforma con selección pública de datos de usuario; no incluyen `password_hash`.
- `JWT_SECRET` obligatorio cuando `NODE_ENV=production`.

Validación ejecutada: `session-viva.spec.ts`, 4 casos aprobados. La suite completa queda pendiente por inconsistencias preexistentes del cliente Prisma generado y una dependencia `xlsx` ausente en una prueba de importación.

Trabajo frontend desbloqueado por B01:

1. FE04: consumir `expires_in`, cerrar sesión y limpiar datos ante 401/403.
2. FE05: adaptar el panel de plataforma a respuestas públicas y planas.
3. FE08: mostrar estados de club suspendido/baja con mensajes claros.
4. FE20: agregar estos casos a la matriz de aceptación del navegador.

### B02 — Recuperación de contraseña: **implementado en backend y conectado en frontend**

Contrato disponible:

- `POST /auth/forgot-password` recibe `{ email }` y siempre responde un mensaje genérico.
- Para una identidad existente genera un token aleatorio, guarda únicamente su hash y envía un enlace a `/recuperar-clave?token=...`.
- El token vence en 60 minutos y se invalida al utilizarse.
- `POST /auth/reset-password` recibe `{ token, password }`; exige contraseña mínima de 8 caracteres.
- La contraseña se almacena con bcrypt y se limpian los indicadores de recuperación y `must_change_password` de las membresías activas.
- Los tokens no se devuelven en la respuesta ni se registran en logs de aplicación.

Persistencia:

- Migración `20260909190000_add_password_reset_fields` aplicada.
- Campos agregados a `Usuario`: `reset_token_hash`, `reset_expires_at`, `reset_used_at`.

Validación ejecutada: `password-recovery.spec.ts`, 3 casos aprobados (email inexistente, generación/envío de enlace y rechazo de token inválido/vencido/reutilizado). Falta únicamente la prueba manual end-to-end con correo stub/SMTP, registrada en `docs/TAREAS_MANUALES_FRONTEND.md`.

## Bloqueantes para el lanzamiento web 1.0

### 1. Sesión y permisos

Confirmar y documentar:

- TTL definitivo del JWT y significado de `expires_in`.
- Respuesta uniforme para token vencido, membresía eliminada, club suspendido y rol modificado.
- Revocación efectiva: un token emitido antes de una baja o suspensión no debe continuar autorizando operaciones.
- Claims definitivos para staff, socio, profe, entrada y plataforma.
- Contrato de cambio de club con `membresia_id`, incluyendo validación de pertenencia.
- Campos privados excluidos de todas las respuestas, especialmente `password_hash` en recursos de plataforma.

**Aceptación:** tests con dos clubes y todos los roles; acceso directo a rutas devuelve 401/403 correctos; ninguna respuesta contiene hashes, tokens o credenciales. La parte de backend está cerrada; falta evidencia de integración en navegador.

### 2. Recuperación de contraseña

Definir e implementar, sin enumerar usuarios:

- `POST /auth/forgot-password` — email; respuesta genérica siempre.
- `POST /auth/reset-password` — token temporal, contraseña nueva y confirmación.
- Duración, uso único, invalidación tras uso y política de sesiones existentes.
- Enlace público de recuperación y comportamiento ante correo no disponible.

**Aceptación:** solicitud válida, email inexistente, token expirado, token reutilizado y contraseña inválida cubiertos por tests; token ausente de logs y respuestas.

### 3. Padrón e importación/exportación

Completar el contrato existente de socios:

- Resultado de importación por fila: creados, actualizados, omitidos y errores con número de fila.
- Regla de límite del plan y comportamiento ante importación parcial.
- Restauración de una membresía eliminada sin modificar indebidamente otra membresía del mismo `Usuario`.
- `GET /socios/export` (o ruta acordada) que exporte todas las filas autorizadas del club, no solo la página visible.
- Campos permitidos y formato de fechas/DNI/email.

**Aceptación:** importar dos veces el mismo archivo no duplica; 100 filas con errores producen resumen recuperable; exportación no mezcla clubes ni expone secretos.

### 4. Cuotas manuales

Separar emisión manual de MercadoPago:

- Endpoint para generar la cuota del período sin crear preference ni URL simulada.
- Repetición y concurrencia idempotentes por `(socio_id, mes)`.
- Respuesta con procesados, existentes, omitidos y errores parciales.
- Estado canónico, monto exacto y regla para no alterar cuotas ya pagadas.
- Registro manual con `medio`, `fecha`, `operador` y motivo de corrección.
- Historial/auditoría de cambios y endpoint de consulta que la web pueda mostrar.

**Aceptación:** dos solicitudes simultáneas dejan una cuota; repetir no cambia un pago cerrado; el reporte mensual coincide con el historial; ninguna ruta manual devuelve link mock.

### 5. Reservas propias del socio

Exponer o completar rutas para que el portal no use listados de staff:

- Listar disponibilidad por espacio y fecha, filtrada por `club_id`.
- Crear reserva tomando el socio desde el JWT; el cliente no elige un `socio_id` privilegiado.
- Listar y cancelar solo reservas propias para socio/profe.
- Mantener gestión de comisión con permisos separados.
- Validar en servidor pasado, apertura/cierre, duración, morosidad, límite de reservas y plazo de cancelación.
- Hacer atómica la comprobación de solape y la inserción.

**Aceptación:** dos solicitudes para el mismo intervalo confirman como máximo una; un socio no puede leer, cancelar ni crear una reserva para otra membresía.

## Contratos que deben actualizarse juntos

Cada cambio debe incluir:

1. `docs/API.md` con método, ruta, request, respuesta y errores.
2. DTOs y validación `class-validator`.
3. Tests de permisos, tenant, concurrencia e idempotencia donde aplique.
4. Tipos/consumidores web en `apps/web/src/lib/api.ts` y las páginas afectadas.

Los IDs de negocio siguen siendo `membresia.id`. Las personas se devuelven aplanadas; no entregar el grafo Prisma crudo.

## Prioridad y orden recomendado

| Orden | Bloque | Desbloquea |
|---|---|---|
| B01 | Sesión, revocación y respuestas seguras | navegación, cambio de club, portal y aceptación de permisos |
| B02 | Recuperación de contraseña | pantalla de recuperación y acceso comercial |
| B03 | Cuotas manuales/auditoría | pantalla de cobros 1.0 |
| B04 | Reservas propias y concurrencia | portal socio y pruebas de reservas |
| B05 | Importación/exportación definitiva | padrón y onboarding operativo |

B01 debe ir primero. B02 puede avanzar en paralelo si se acuerda el contrato. B03–B05 pueden desarrollarse en paralelo después de fijar los DTOs.

## Fuera de este pedido

No son necesarios para cerrar la web 1.0: MercadoPago por club, OAuth, débito automático, FCM real, QR/offline, mobile, lista de espera, split de pagos, cantina y billing autoservicio. Esos trabajos pertenecen a milestones posteriores del roadmap.

## Cuando backend entregue estos bloques

El frontend continúa en este orden:

1. Integrar B01 y ejecutar matriz de rutas/roles.
2. Conectar recuperación real y retirar el mensaje de limitación.
3. Adaptar padrón y cuotas a los DTOs finales.
4. Completar reservas y portal socio con datos propios.
5. Ejecutar QA de navegador, build productivo y piloto mensual.
