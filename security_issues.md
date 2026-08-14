# ClubApp Arg — Seguridad de la integración de pagos (Mercado Pago)

Guía interna para el equipo de desarrollo. Reúne los riesgos identificados en el
diseño actual de cobros (`TECNICO_EQUIPO.md` / `VENTA_PUBLICO.md`) y las
soluciones concretas propuestas para cada uno, ordenados por prioridad.

> Regla general: si un ítem está en **Crítico**, no debería haber clubes reales
> cobrando en producción hasta resolverlo.

---

## Resumen ejecutivo

| # | Riesgo | Prioridad | Estado |
|---|--------|-----------|--------|
| 1 | `mp_access_token` de cada club guardado en texto plano | 🔴 Crítico | Pendiente |
| 2 | Fallback a token global de la plataforma en producción | 🔴 Crítico | Pendiente |
| 3 | Webhook sin validación de firma (`x-signature`) | 🔴 Crítico | Pendiente |
| 4 | Webhook solo maneja estado `approved` (sin rechazos/reembolsos) | 🟠 Alto | Pendiente |
| 5 | Sin reconciliación de respaldo si el webhook no llega | 🟠 Alto | Pendiente |
| 6 | Renovación del token OAuth (vence a los 180 días) sin proceso robusto | 🟠 Alto | Pendiente |
| 7 | Aislamiento multi-tenant dependiente de disciplina manual (`club_id`) | 🟠 Alto | Pendiente |
| 8 | Almacenamiento del JWT del panel admin sin definir (XSS vs CSRF) | 🟡 Medio | Pendiente |
| 9 | Uploads (fotos/audio) sin validación de tipo/path | 🟡 Medio | Pendiente |
| 10 | DNI usado como payload del carnet QR | 🟡 Medio | Pendiente |
| 11 | "Pago con QR en el club" vendido sin diseño técnico | 🟡 Medio | Pendiente |

---

## 🔴 Crítico

### 1. `mp_access_token` / `mp_refresh_token` de cada club en texto plano

**Riesgo.** El `mp_access_token` obtenido al conectar la cuenta de MP de un club
no es un dato cualquiera: permite crear cobros, leer el historial completo de
transacciones y, en muchos flujos, iniciar reembolsos en nombre del club. Es
necesario para **cualquier** cobro automático generado por el servidor (el cron
del día 25 lo usa igual para la Opción A que para la Opción B — no es exclusivo
del débito automático). Si la base de datos se filtra en texto plano (por un
backup sin cifrar, un dump compartido para debugging, un usuario de solo
lectura, logging de queries activado por error), el resultado es el compromiso
simultáneo de las cuentas reales de Mercado Pago de **todos** los clubes
conectados, con la plata de sus socios.

**Solución propuesta.**
- Cifrar el campo a nivel de aplicación (AES-256-GCM, módulo `crypto` de Node)
  antes de persistirlo. Nunca texto plano en la columna.
- *Envelope encryption*: la clave maestra (KEK) vive fuera de la base y fuera
  del repo.
  - Mínimo viable: variable de entorno en el secret manager del hosting,
    distinta entre dev/staging/prod, nunca en `.env` versionado.
  - Nivel maduro: KMS gestionado (AWS KMS / GCP Cloud KMS) — costo bajo y suma
    auditoría de cada operación de descifrado.
- Un único servicio (`MpTokenVaultService`) autorizado a leer/escribir estos
  campos. Ningún otro punto del código accede a ellos directamente.
- `select` explícito y restrictivo en Prisma para que un `findMany`/`findUnique`
  genérico de `Club` nunca traiga estos campos por default.
- Revocar el acceso a nivel de columna en Postgres para roles de solo
  lectura/analítica.
- Logger (Pino/Winston) configurado con redacción explícita de estos campos,
  para que un `console.log` accidental no los exponga.

### 2. Fallback a token global de la plataforma (`MP_ACCESS_TOKEN` del `.env`)

**Riesgo.** El diseño actual contempla un fallback al token global de la
plataforma para clubes que no conectaron su propia cuenta. Si eso llega a
producción, la plata de las cuotas cae en la cuenta de MP de la **plataforma**,
no del club — convirtiendo a ClubApp Arg en custodio de fondos de terceros, con
implicancias legales/regulatorias serias, más allá de lo técnico.

**Alineación con regla de negocio (PLAN.md).** ClubApp **no cobra ni custodia
fondos**: solo genera links con la MP del club + avisos por push FCM. El
fallback en producción rompe esa regla de producto/legal, no solo un detail
técnico.

**Solución propuesta.**
- El fallback queda estrictamente limitado a entornos de demo/sandbox, nunca
  alcanzable desde producción (`NODE_ENV=production` → exigir token del club).
- Bloquear a nivel de código: un club no puede pasar a estado "activo para
  cobrar" sin haber completado el flujo OAuth de conexión de su propia cuenta.
  Validar esto server-side, no solo en la UI.

### 3. Webhook sin validación de firma

**Riesgo.** El endpoint `POST /webhook/mp` no valida hoy los headers
`x-signature` / `x-request-id` que MP provee para confirmar que la notificación
viene realmente de ellos. Está documentado como "si aplica" (opcional).

**Solución propuesta.**
- Implementar la validación HMAC documentada por MP como paso obligatorio,
  antes de procesar cualquier notificación.
- Mantener además la práctica ya prevista de volver a consultar el pago contra
  la API de MP (`Payment.get`) en vez de confiar en el body del webhook — es
  una segunda capa de defensa, no reemplaza la validación de firma.

---

## 🟠 Alto

### 4. Solo se maneja el estado `approved`

**Riesgo.** No hay manejo de `rejected`, `cancelled`, ni de un reembolso o
contracargo posterior a un pago ya marcado como `pagado`. Con dinero real de
por medio, tarde o temprano va a ocurrir, y hoy no hay reversión automática del
estado del socio.

**Solución propuesta.**
- Ampliar el handler del webhook para procesar los demás estados relevantes y
  actualizar `Pago` en consecuencia (incluyendo reversión si un pago aprobado
  se reembolsa después).
- Notificar al admin del club cuando un pago cambia de estado después de haber
  sido dado por bueno.

### 5. Sin reconciliación de respaldo

**Riesgo.** Si el webhook no llega (caída de red, timing de un deploy), no hay
ningún mecanismo que lo detecte — un socio puede quedar marcado como moroso
habiendo pagado.

**Solución propuesta.**
- Job periódico que consulte a MP el estado de preferencias/pagos pendientes
  desde hace más de X horas, como red de seguridad independiente del webhook.

### 6. Renovación del token OAuth (vence a los 180 días)

**Riesgo.** El `access_token` de MP vence a los 180 días. Cada vez que se
renueva con el `refresh_token`, MP devuelve un `refresh_token` **nuevo**
también — hay que volver a guardarlo. No es un secreto estático: es un proceso
recurrente, y cada ejecución es una nueva oportunidad de error (por ejemplo,
guardar el valor nuevo sin pasar por el cifrado).

**Solución propuesta.**
- Job programado que renueve el token con margen antes del vencimiento (por
  ejemplo, a partir del día 150), usando el mismo `MpTokenVaultService` para
  descifrar el valor actual y volver a cifrar los dos valores nuevos.
- Test de integración específico para este flujo, dado que es el punto de
  mayor probabilidad de error humano.
- Alerta si la renovación falla repetidamente, para no cortar la cobranza de
  un club sin que nadie se entere.

### 7. Aislamiento multi-tenant dependiente de disciplina manual

**Riesgo.** La privacidad entre clubes depende de que **todas** las queries
filtren correctamente por `club_id`. Un solo endpoint donde se omita ese
filtro es una vulnerabilidad de tipo IDOR (acceso a datos de otro club) — y es
enteramente responsabilidad del código propio, Mercado Pago no protege contra
esto.

**Solución propuesta.**
- Middleware/guard de Nest que resuelva y valide el `club_id` de forma
  centralizada, en vez de depender de que cada resolver/controller lo repita.
- Tests de integración que verifiquen explícitamente que un usuario del Club A
  no puede leer ni modificar recursos del Club B.

---

## 🟡 Medio

### 8. Almacenamiento del JWT del panel admin sin definir

**Riesgo.** Ni `TECNICO_EQUIPO.md` ni `VENTA_PUBLICO.md` especifican dónde vive
el JWT en el navegador del admin. Esto cambia el vector de ataque principal:
en `localStorage`, el riesgo es XSS; en cookie `httpOnly`, el riesgo es CSRF.

**Solución propuesta.**
- Definir explícitamente el mecanismo (recomendado: cookie `httpOnly` +
  `SameSite` + protección CSRF con token, dado que Next.js lo soporta bien) y
  documentarlo para que no quede a criterio de quien implemente el módulo de
  auth.

### 9. Uploads sin validación de tipo/path

**Riesgo.** Fotos de noticias y audios de justificación se sirven directo por
la API desde `./uploads`. Sin validación estricta de tipo de archivo y sin
control de path, hay riesgo de path traversal o de contenido servido con un
`content-type` que permita XSS almacenado (por ejemplo, un SVG con script
embebido).

**Solución propuesta.**
- Whitelist estricta de mimetypes permitidos por endpoint (imagen para
  noticias, audio para justificaciones).
- Servir los archivos con `content-type` forzado y `Content-Disposition`
  apropiado, nunca inferido del nombre del archivo subido por el usuario.
- Sanitizar/generar nombres de archivo server-side, nunca usar el nombre
  original del cliente para construir el path.

### 10. DNI como payload del carnet QR

**Riesgo.** El DNI no es un dato secreto en Argentina. Sirve bien como
identificador para pasar lista rápido, pero no debería tratarse como una
credencial de autenticación si en el futuro se lo usa para algo de mayor
riesgo (confirmar un pago, autorizar algo).

**Solución propuesta.**
- Mantener su uso actual (identificación rápida, bajo riesgo) pero documentar
  explícitamente que no debe extenderse a flujos de autenticación o
  autorización sin agregar una firma/secreto adicional al payload del QR.

### 11. "Pago con QR en el club" vendido sin diseño técnico

**Riesgo.** `VENTA_PUBLICO.md` promete una tercera forma de cobro (pago
presencial en secretaría/cantina mostrando el carnet) que no tiene ninguna
contraparte en el diseño técnico de `TECNICO_EQUIPO.md` — ni endpoint, ni
integración con MP Point/QR de cobro presencial, ni un flujo manual de
"marcar como pagado en efectivo".

**Solución propuesta.**
- Diseñar el flujo (integración con MP Point/QR, o un flujo manual con
  registro de quién lo marcó como pagado y por qué medio) antes de seguir
  ofreciéndolo en el material de venta, o retirarlo temporalmente del pitch
  hasta tenerlo resuelto.

---

## Checklist para antes de cobrar plata real de un club

- [ ] `mp_access_token` / `mp_refresh_token` cifrados en la base (envelope encryption)
- [ ] Fallback al token global bloqueado en producción
- [ ] Validación de firma del webhook implementada y obligatoria
- [ ] Webhook maneja `approved`, `rejected`, `cancelled` y reversión por reembolso
- [ ] Job de reconciliación de respaldo corriendo
- [ ] Job de renovación de token OAuth corriendo con alertas de fallo
- [ ] Tests de aislamiento multi-tenant (Club A no ve datos de Club B)
- [ ] Definido y documentado dónde vive el JWT del admin en el cliente
- [ ] Validación de tipo/path en uploads
- [ ] Flujo de "pago con QR en el club" diseñado o retirado del material de venta

---

## Referencias

- [Webhooks - Documentación - Mercado Pago Developers](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/additional-content/notifications/webhooks)
- [PCI DSS - Seguridad - Checkout API - Mercado Pago Developers](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/additional-content/security/pci)
- [Renovar Access Token - OAuth - Mercado Pago Developers](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-payments/additional-content/security/oauth/renewal)
- [Creation - OAuth - Mercado Pago Developers](https://www.mercadopago.com.ar/developers/en/docs/checkout-api-payments/additional-content/security/oauth/creation)
- [Integrar bajo el modelo Marketplace de Mercado Pago en 3 pasos](https://medium.com/joelibaceta/integrar-bajo-el-modelo-marketplace-de-mercado-pago-en-3-pasos-f78319f9a9a2)

---

*Documento vivo: actualizar el estado de cada ítem a medida que se resuelva, y
sumar nuevos hallazgos con el mismo formato (Riesgo / Solución propuesta).*
