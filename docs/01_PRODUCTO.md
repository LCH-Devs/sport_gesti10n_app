# Producto y alcance

Fuente unificada para funcionalidades, usuarios, planes y alcance comercial.
El estado operativo está en [`ESTADO_PROYECTO.md`](ESTADO_PROYECTO.md).

## Producto actual

ClubApp es un SaaS multi-tenant para clubes de barrio. El alcance vigente del
milestone es API + panel web + PostgreSQL. Mobile queda documentado como línea
separada y no debe ampliar este milestone sin pedido explícito.

### Funcionalidades por usuario

| Usuario | Funcionalidad | Estado |
|---|---|---|
| Comisión | Socios, familias, cuotas, pagos manuales, reservas, noticias, horarios y configuración | Realizado en API; cierre UI en progreso |
| Comisión | Reportes, alerta de fuga y planes SaaS | Parcial; validar flujo completo |
| Socio/profe | Perfil, cuotas y reservas propias | Parcial |
| Plataforma | Clubes, solicitudes, planes y administración | API realizada; QA web pendiente |
| Todos los clubes | Feed Social | API realizada; UI parcial |
| Mobile | Portal, reservas y eventos | Código de fases 0–3 realizado; QA pendiente |

## Fuera del alcance actual

MercadoPago productivo por club, cobro SaaS de ClubApp, Modo Entrada QR/offline,
WhatsApp/SMS pagos, Kubernetes, S3/R2 y roles granulares de comisión.

## Decisiones pendientes

- Definir si la marca final será ClubApp o Kanri.
- Confirmar qué funciones se muestran en la oferta 1.0.
- Separar claramente demos, mocks y funciones productivas.

## Referencias archivadas

El detalle original de características, plan amplio, planes SaaS y material
comercial se conserva en `HISTORICO/PRODUCTO/`.
