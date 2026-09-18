# Seguridad y operación

## Realizado

- JWT de club con TTL de 8 horas.
- Revalidación de membresía y club en cada request.
- Baja y suspensión invalidan sesiones.
- Pass maestra restringida a staff y fuera de producción.
- No devolver hashes ni secretos en respuestas públicas.

## Pendiente antes de cobros reales

- No guardar tokens MP en texto plano.
- Eliminar fallback productivo a token global.
- Validar firma del webhook.
- Manejar rechazos, reembolsos y contracargos.
- Implementar reconciliación cuando no llega el webhook.
- Renovar OAuth antes de vencimiento.
- Validar mime, tamaño y path de uploads.
- Definir estrategia de sesión más robusta que `localStorage`.

## Operación

Faltan criterios cerrados para backups, monitoreo, alertas, despliegue y
recuperación. Estas tareas son parte de la preparación comercial, no deben
marcarse como realizadas por tener solamente configuración local.

## Referencias archivadas

Los análisis detallados de seguridad y sesión quedan en
`HISTORICO/SEGURIDAD/`.
