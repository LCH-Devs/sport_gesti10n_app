# Tareas manuales frontend antes del lanzamiento

Checklist para ejecutar en navegador con API y base de staging. Estas tareas no se consideran aprobadas por type-check, build o tests unitarios. Completar con fecha, responsable, navegador, viewport y evidencia.

## Preparación

- [ ] Levantar API, web y base de staging con datos ficticios.
- [ ] Crear dos clubes de prueba: Club A y Club B.
- [ ] Crear usuarios de prueba: admin, entrada, socio y profe en cada club.
- [ ] Confirmar que los datos de prueba no contienen contraseñas ni información real.
- [ ] Registrar versión desplegada, URL, navegador y tamaño de ventana.

## Acceso y navegación

### B01 — escenarios habilitados

- [ ] Con sesión activa, suspender Club A desde plataforma y confirmar que la siguiente operación devuelve al acceso.
- [ ] Dar de baja la membresía de prueba y confirmar que el token anterior ya no permite operar.
- [ ] Cambiar el rol de una membresía y confirmar que la navegación se actualiza al renovar datos.
- [ ] Cambiar entre Club A y Club B y confirmar que no quedan datos ni colores del club anterior.
- [ ] Revisar recursos de plataforma y confirmar que solo se muestran campos públicos.

**Siguiente paso:** completar estos cinco escenarios para cerrar B01. Una vez registrados, iniciar B02 con el contrato de recuperación de contraseña y conectar la pantalla `/recuperar-clave`.

- [ ] Landing carga sin errores de consola visibles.
- [ ] Login con credenciales válidas entra al destino correcto.
- [ ] Login inválido muestra un mensaje genérico y no revela si el email existe.
- [ ] Logout elimina la sesión y vuelve al acceso.
- [ ] Abrir directamente una ruta privada sin sesión redirige al acceso.
- [ ] Refrescar una ruta privada mantiene el contexto correcto.
- [ ] Subrutas de Socios, Cobros, Reservas, Noticias y Configuración resaltan el menú correcto.
- [ ] Cambiar de club actualiza nombre, logo, colores y datos mostrados.
- [ ] Una sesión vencida o revocada limpia la pantalla y vuelve al acceso.
- [ ] El rol plataforma no entra a rutas de club y viceversa.

## Onboarding

- [ ] Completar todos los pasos en orden.
- [ ] Volver atrás conserva los datos ingresados.
- [ ] Validaciones de nombre, CUIT/CUIL, cuota y contraseña son claras.
- [ ] No se solicita número de tarjeta, vencimiento ni CVV.
- [ ] Crear espacios desde onboarding muestra correctamente éxito parcial o total.
- [ ] Al finalizar se llega al panel sin repetir el onboarding.
- [ ] Cerrar y volver a abrir el navegador conserva el estado esperado.

## Padrón de socios

- [ ] Ver listado vacío con mensaje entendible.
- [ ] Crear socio válido.
- [ ] Editar datos personales y estado.
- [ ] Intentar duplicar email y DNI; el mensaje debe explicar el conflicto.
- [ ] Dar de baja un socio y confirmar el resultado.
- [ ] Verificar que la baja no elimina otra membresía del mismo usuario.
- [ ] Descargar plantilla CSV.
- [ ] Importar CSV válido de 100 filas.
- [ ] Importar CSV con duplicados, comillas, filas incompletas y datos inválidos.
- [ ] Revisar resumen por fila y reintentar solo lo necesario.
- [ ] Confirmar que paginación, búsqueda y filtros no pierden filas.
- [ ] Exportar el padrón completo y verificar que no sea solo la página visible.

## Cuotas

- [ ] Emitir la cuota del período con el monto configurado.
- [ ] Repetir la emisión y confirmar que no duplica registros.
- [ ] Intentar doble clic durante la emisión.
- [ ] Ver pendientes, pagadas y totales.
- [ ] Registrar pago manual con medio y fecha.
- [ ] Corregir un pago y verificar que se conserve el historial.
- [ ] Confirmar que no aparecen links mock, push ficticio ni promesas de MercadoPago en la versión manual.
- [ ] Confirmar que una cuota pagada no cambia al editar el monto general del club.

## Reservas

- [ ] Crear espacio y revisar apertura, cierre y duración de turnos.
- [ ] Consultar disponibilidad por fecha.
- [ ] Crear una reserva válida.
- [ ] Intentar reservar un intervalo solapado.
- [ ] Intentar reservar desde dos ventanas para el mismo turno.
- [ ] Intentar reservar fuera de horario, en el pasado y con socio suspendido.
- [ ] Alcanzar el límite de reservas futuras.
- [ ] Cancelar dentro y fuera del plazo permitido.
- [ ] Confirmar que un socio solo ve y cancela sus reservas desde su portal.

## Portal socio

- [ ] Login de socio llega a una página implementada, sin 404.
- [ ] Mostrar perfil propio, club y estado.
- [ ] Confirmar que no aparecen listados de otros socios.
- [ ] Consultar cuotas e instrucciones de pago manual cuando estén conectadas al contrato final.
- [ ] Consultar y cancelar reservas propias cuando estén conectadas al contrato final.
- [ ] Ver novedades y horarios del club.
- [ ] Probar todo el flujo en 320 px, 375 px y escritorio.

## Noticias, configuración y marca

- [ ] Crear, editar, publicar y retirar una noticia.
- [ ] Confirmar que un borrador no aparece para quien no corresponde.
- [ ] Crear y editar un horario.
- [ ] Cambiar logo y colores del club.
- [ ] Recargar y confirmar que logo/tema persisten.
- [ ] Subir un archivo inválido y verificar un mensaje claro.
- [ ] Cambiar de club y confirmar que el tema anterior no queda aplicado.

## Responsive y accesibilidad

- [ ] Probar viewports 320, 375, 768 y escritorio.
- [ ] Navegar formularios solo con teclado.
- [ ] Confirmar foco visible y orden lógico de tabulación.
- [ ] Confirmar labels asociados a todos los inputs.
- [ ] Confirmar nombres accesibles en iconos y botones.
- [ ] Confirmar que mensajes de error son leídos/identificables como alerta.
- [ ] Confirmar que tablas y calendarios no requieren scroll horizontal innecesario.
- [ ] Confirmar que acciones no dependen únicamente de color.

## Rutas y contenido de lanzamiento

- [ ] Revisar todos los enlaces del landing; ninguno debe llevar a `#` o una ruta inexistente.
- [ ] Revisar que eventos, mapa y notificaciones no presenten datos mock como reales.
- [ ] Confirmar que las funciones fuera de 1.0 están ocultas o marcadas como posteriores.
- [ ] Confirmar marca final ClubApp/Kanri en títulos, textos y favicon.
- [ ] Confirmar enlaces de privacidad, términos y soporte según los textos aprobados.

## Criterio de aprobación

- [x] Type-check frontend aprobado (09/09/2026).
- [ ] Build productivo aprobado en CI/Linux.
- [ ] Smoke test de todas las rutas principales aprobado.
- [ ] Cero defectos críticos o altos del alcance frontend.
- [ ] Evidencia de pruebas con dos clubes y al menos dos roles.
- [ ] Evidencia de prueba en móvil y escritorio.
- [ ] API conectada a los contratos finales; no quedan fixtures activos en producción.
- [ ] Responsable de producto, QA y tecnología firman la salida a piloto.

## Registro de ejecución

| Fecha | Responsable | Navegador/viewport | Resultado | Incidencias |
|---|---|---|---|---|
| | | | | |

## Próximo orden de trabajo

- [ ] Cerrar validación manual de B01 con dos clubes.
- [ ] Registrar incidencias y evidencia de B01.
- [ ] Definir contrato backend de recuperación de contraseña (B02).
- [ ] Conectar `/recuperar-clave` al contrato B02 y probar token expirado/reutilizado.

## B02 — recuperación de contraseña

Pruebas unitarias backend B02 aprobadas: 3 casos (email inexistente, generación/envío de enlace y rechazo de token inválido/vencido/reutilizado).

### Preparación

- [ ] Reiniciar la API después de aplicar `pnpm db:sync`.
- [ ] Tener un usuario de prueba existente y acceso al correo stub o SMTP de staging.
- [ ] Abrir `/recuperar-clave` desde el login de comisión, socio y plataforma.

### Solicitud

- [ ] Ingresar un email existente y confirmar que la respuesta no revela datos privados.
- [ ] Ingresar un email inexistente y comprobar que muestra el mismo mensaje genérico.
- [ ] Revisar el correo recibido: el enlace apunta a `/recuperar-clave?token=...` y no expone el token en logs de la aplicación.

### Restablecimiento

- [ ] Abrir el enlace recibido y establecer una contraseña de al menos 8 caracteres.
- [ ] Confirmar que la pantalla informa éxito y permite volver al acceso.
- [ ] Ingresar con la contraseña nueva en el canal correspondiente.
- [ ] Intentar reutilizar el mismo enlace: debe rechazarse.
- [ ] Probar un token modificado o vencido: debe rechazarse con un mensaje claro.
- [ ] Confirmar que la contraseña anterior ya no funciona.

### Evidencia

- [ ] Registrar fecha, usuario de prueba, navegador, resultado y referencia del correo stub/SMTP.
- [ ] Confirmar que nunca aparecen `password_hash`, tokens completos ni contraseñas en la interfaz.

Las tareas que dependan de endpoints faltantes quedan pendientes hasta que backend entregue el contrato definido en [BACKEND_PENDIENTES_FRONTEND.md](BACKEND_PENDIENTES_FRONTEND.md). Este archivo es una guía de verificación, no sustituye las pruebas de seguridad, datos, backups ni operación del roadmap general.
