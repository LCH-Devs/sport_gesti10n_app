# QA y lanzamiento

Documento único para defectos visibles, pruebas manuales y criterios de salida.

## Bloqueos actuales

- El type-check web depende de tipos generados en `.next/types` ausentes en el
  checkout actual.
- El e2e visible del API no cubre todavía tenant real, auth completa ni reservas
  concurrentes.
- Falta completar la validación visual en navegador.

## Checklist de aceptación

- Login, logout, expiración, suspensión y cambio de club.
- Onboarding completo y parcial, sin duplicar espacios.
- Socios: alta, edición, baja lógica, importación y exportación.
- Cuotas: emitir, pagar manualmente, filtrar pendientes y reintentar errores.
- Reservas: solape, límites, cancelación, medianoche y dos navegadores.
- Portal socio: perfil, cuotas y reservas propias.
- Plataforma: solicitudes, clubes, planes y permisos.
- Responsive, traducciones, accesibilidad y ausencia de mocks expuestos.

## Criterio de cierre

Una pantalla no se considera terminada por existir: debe tener contrato real,
estados de error, permisos, prueba manual o automática y no prometer funciones
fuera del alcance.

## Referencias archivadas

Auditoría frontend, manual de usuario, checklist manual, traducciones y contraste
de formularios se conservan en `HISTORICO/QA/`.
