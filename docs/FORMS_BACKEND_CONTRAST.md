# Contraste forms (frontend) vs DTOs (backend)

Comparación campo a campo entre lo que cada formulario de `apps/web/src/app/gestion/*/nuevo` envía y lo que
acepta el DTO correspondiente en `apps/api/src/**/dto/*.dto.ts`. El backend usa `ValidationPipe({ whitelist: true,
forbidNonWhitelisted: true })`, así que cualquier campo enviado que no esté en el DTO hace fallar la request con 400.

## 1. usuarios/nuevo → `POST /admins` (`CreateAdminDto`)

| DTO | Frontend | ¿Coincide? |
|---|---|---|
| `email` | `email` | ✅ |
| `nombre` | `nombre` | ✅ |
| `password` | `password` | ✅ |
| `rol?` | `rol` | ✅ |

`passwordConfirm` vive solo en el estado local del form (validación de UI) y **no se manda** al backend.

## 2. socios/nuevo (crear) → `POST /socios` (`CreateSocioDto`)

| DTO | Frontend | ¿Coincide? |
|---|---|---|
| `dni` | `dni` | ✅ |
| `nombre` | `nombre` | ✅ |
| `apellido` | `apellido` | ✅ |
| `email` | `email` | ✅ |
| `telefono?` | `telefono` | ✅ |
| `password?` | `password` | ✅ |
| `rol?` | `rol` | ✅ |
| `fecha_nacimiento?` | `fecha_nacimiento` | ✅ |

## socios/nuevo (editar) → `PATCH /socios/:id` (`UpdateSocioDto`)

| DTO | Frontend | ¿Coincide? |
|---|---|---|
| `nombre?` | `nombre` | ✅ |
| `apellido?` | `apellido` | ✅ |
| `email?` | `email` | ✅ |
| `telefono?` | `telefono` | ✅ |
| `estado?` | `estado` | ✅ |
| `rol?` | `rol` | ✅ |
| `fecha_nacimiento?` | `fecha_nacimiento` | ✅ |

`dni` y `password` no existen en `UpdateSocioDto` y correctamente **no se envían** en el PATCH (el campo DNI
queda `disabled` en el form cuando se edita).

## 3. reservas/nuevo → `POST /reservas` (`CreateReservaDto`)

| DTO | Frontend | ¿Coincide? |
|---|---|---|
| `espacio_id` | `espacio_id` | ✅ |
| `socio_id` | `socio_id` | ✅ |
| `inicio` | `inicio` | ✅ |
| `fin` | `fin` | ✅ |
| `nota?` | `nota` | ✅ |

## 4. noticias/nuevo → `POST /noticias` (`CreateNoticiaDto`)

| DTO | Frontend | ¿Coincide? |
|---|---|---|
| `titulo` | `titulo` | ✅ |
| `cuerpo` | `cuerpo` | ✅ |
| `imagen_url?` | `imagen_url` | ✅ |
| `es_evento?` | `es_evento` | ✅ |
| `fecha?` | `fecha` | ✅ |
| `published?` | `published` | ✅ |

## 5. horarios/nuevo → `POST /horarios` (`CreateHorarioDto`)

| DTO | Frontend | ¿Coincide? |
|---|---|---|
| `titulo` | `titulo` | ✅ |
| `dias` | `dias` | ✅ |
| `hora_inicio` | `hora_inicio` | ✅ |
| `hora_fin` | `hora_fin` | ✅ |
| `profe_id?` | `profe_id` | ✅ |
| `activo?` | *(no se envía)* | — usa default `true` del backend |

## 6. familias/nuevo → `POST /familias` (`CreateFamiliaDto`)

| DTO | Frontend | ¿Coincide? |
|---|---|---|
| `nombre` | `nombre` | ✅ |
| `titular_id` | `titular_id` | ✅ |
| `socio_ids?` | `socio_ids` | ✅ |

## 7. espacios/nuevo → `POST /espacios` (`CreateEspacioDto`)

| DTO | Frontend | ¿Coincide? |
|---|---|---|
| `nombre` | `nombre` | ✅ |
| `tipo` | `tipo` | ✅ |
| `descripcion?` | `descripcion` | ✅ |
| `duracion_slot_min?` | `duracion_slot_min` | ✅ |
| `precio_opcional?` | `precio_opcional` | ✅ |
| `hora_apertura?` | `hora_apertura` | ✅ |
| `hora_cierre?` | `hora_cierre` | ✅ |

`tipo` es un `select` con el mismo enum fijo que valida el DTO
(`padel | futbol | basquet | tenis | quincho | salon | cancha | otro`).

## 8. actividades/nuevo → `POST /actividades` (`CreateActividadDto`)

| DTO | Frontend | ¿Coincide? |
|---|---|---|
| `nombre` | `nombre` | ✅ |
| `modo_cobro` | `modo_cobro` | ✅ |
| `monto_adicional?` | `monto_adicional` | ✅ |
| `profe_id?` | `profe_id` | ✅ |
| `comision_tipo?` | `comision_tipo` | ✅ |
| `comision_valor?` | `comision_valor` | ✅ |
| `activo?` | *(no se envía)* | — usa default `true` del backend |

## 9. onboarding → `PATCH /clubs/me/onboarding` (`CompleteOnboardingDto`)

| DTO | Frontend | ¿Coincide? |
|---|---|---|
| `titular_nombre` | `titular_nombre` | ✅ |
| `titular_apellido` | `titular_apellido` | ✅ |
| `cuit_cuil` | `cuit_cuil` | ✅ |
| `direccion?` | `direccion` | ✅ |
| `provincia?` | `provincia` | ✅ |
| `ciudad?` | `ciudad` | ✅ |
| `ubicacion_json?` | `ubicacion_json` | ✅ |
| `telefono_club?` | `telefono_club` | ✅ |
| `logo_url?` | `logo_url` | ✅ |
| `color_primario?` | `color_primario` | ✅ |
| `color_secundario?` | `color_secundario` | ✅ |
| `color_terciario?` | `color_terciario` | ✅ |
| `cuota_monto?` | `cuota_monto` | ✅ |
| `nueva_password` | `nueva_password` | ✅ |
| `deportes?` | `deportes` | ✅ |
| `bloquear_entrada?` | `bloquear_entrada` | ✅ |
| `descuento_familiar_pct?` | `descuento_familiar_pct` | ✅ |

Los espacios cargados en el step "Deportes y espacios" van aparte, a `POST /espacios`
(mismo DTO/contraste que el punto 7).

## Conclusión

Los 8 forms de `nuevo/` más el onboarding tienen **coincidencia 1 a 1 de nombres** con sus DTOs respectivos.
No hay ningún campo enviado con un nombre distinto al esperado por el backend, y los pocos campos del DTO que
no se envían (`activo` en horarios/actividades) tienen default en el backend, así que no rompen nada.

_Generado a partir de una revisión manual de `apps/web/src/app/gestion/*/nuevo/page.tsx`,
`apps/web/src/app/gestion/onboarding/page.tsx` y los DTOs en `apps/api/src/**/dto/*.dto.ts`. Puede quedar
desactualizado si se modifican los forms o los DTOs — no confiar en esto como fuente de verdad sin volver a
verificar contra el código._
