# ClubApp Arg — Características

Plataforma multi-club: **panel web** para la comisión + **app móvil** para socios, profes y portería.  
Cada club tiene su espacio, logo, color y reglas propias.

---

## Para la comisión (Web)

### Socios y familias
- Alta, baja y modificación de socios
- Importar socios desde Excel / CSV
- Grupos familiares (un pago, varios DNIs)
- Multideporte: anotar al socio en varias actividades
- Fecha de nacimiento (cumpleaños automáticos)

### Cobros y cuotas
- **ClubApp no cobra:** solo genera links MP de la cuenta del club (sin custodia de fondos)
- Generar y enviar cobros del mes (link + **push FCM gratis**; sin WhatsApp/SMS pagos)
- Débito automático (socio deja tarjeta; plata igual al club)
- Listado pagados vs deudores (webhook y/o marcar manual)
- Ranking de cobranza (% cobrado del mes)
- Cobranza inteligente (avisos día 25 / 1 / 5 / 10 por push)
- Extra de actividad **dentro de la cuota** (modo club)
- Liquidaciones cuando **cobra el profe** y reparte %/fijo al club (modo profe)

### Día a día
- Dashboard **“Hoy en el club”** (turnos, reservas, deudores, alertas)
- Notificaciones push a todos o solo deudores
- Noticias, eventos y fotos
- Horarios de entrenamiento / actividades
- Cumpleaños: push + mención automática en noticias

### Reservas
- ABM de espacios: pádel, fútbol, básquet, tenis, quincho, salón, etc.
- Calendario de reservas
- Cancelar o bloquear turnos

### Control y reportes
- **Alerta de Fuga** (deuda o baja asistencia)
- WhatsApp en un tap desde la alerta (mensaje armado)
- Historial de ingresos (scans en puerta)
- Torneos: crear, fixture, resultados, tabla

### Configuración del club (solo su club)
- Reglas de moroso (N cuotas)
- Bloquear o no reservas / entrada si debe
- Máx. reservas y horas para cancelar
- Monto de cuota, logo y color
- Cumpleaños on/off
- Usuarios admin y **entrada** (portería)
- Actividades en modo cobro club o profe

---

## Para el socio (App)

### Cuenta y cuota
- Elegir club + login con DNI
- Ver si está al día o cuánto debe
- Pagar cuota con MercadoPago
- Activar / desactivar débito automático
- Ver grupo familiar y actividades

### Carnet y acceso
- Carnet digital con QR
- Funciona offline 24–48 h (mala señal en el predio)
- Generar **invitado / day pass** (QR temporal para un amigo)

### Reservas
- Reservar canchas, quinchos y espacios
- Ver turnos libres y confirmar
- Lista de espera (“avisame si se libera”) + push
- Ver y cancelar mis reservas

### Vida del club
- Horarios
- Noticias, eventos y fotos
- Torneos / fixture / tabla
- Notificaciones push
- Justificar falta con audio

---

## Para el profe (App — Modo Profe)

- Pasar asistencia del día (presente / ausente)
- Escanear QR del carnet para marcar presente
- Si cobra él (modo B): registrar cobros de alumnos (efectivo, transferencia, etc.)
- Ver liquidación pendiente al club
- Marcar varios alumnos a la vez

---

## Para la portería (App — Modo Entrada)

- Sesión en un celular del club (sin lector QR de hardware)
- Escanear carnets en loop
- Semáforo según reglas del club (al día / con deuda / suspendido)
- Reconoce invitados (day pass)
- Deja registro de cada ingreso

---

## Plataforma (para todos los clubes)

- Un solo sistema para muchos clubes (datos no se mezclan)
- Subdominio / marca por club (white label)
- MercadoPago del club (link + débito; webhook/manual → estado pagado)
- Push ilimitadas FCM (canal de cobranza; costo mensajería ≈ $0)
- Onboarding self-serve del club (roadmap Fase 4)

---

## Después (no incluido aún)

- Modo cantina / consumos en cuenta del socio
- Split automático de pagos alumno → profe + club

---

## Quién usa qué (resumen)

| Quién | Dónde | Para qué |
|--------|--------|----------|
| Secretario / tesorero / presidente | Web | Administrar, cobrar, configurar, reportes |
| Socio | App | Pagar, carnet, reservar, noticias |
| Profe | App | Asistencia + cobros de su actividad |
| Portería | App | Controlar ingreso con QR |
