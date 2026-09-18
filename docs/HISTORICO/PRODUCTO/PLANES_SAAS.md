 v# Ayuda memoria — Planes por cantidad de socios

Para leerla en voz alta. **No cobramos todavía.** Esto es tope + aviso + confirmación.

## El problema de antes

- Tope fijo de 100 socios, hardcodeado.
- El precio 15 / 30 / 45 USD vivía solo en el formulario de alta.
- Si la solicitud ya decía “80 socios”, Superadmin tenía que volver a cargar cantidad y precio.
- Members en Superadmin era una maqueta (Alex Johnson, 8.547 usuarios).

## Cómo funciona ahora

**Planes vigentes** (Superadmin los edita en Overview → Planes, sin deploy). Hoy salen tres, y se pueden sumar más (100–200, 200–300…):

| Plan | Socios | USD / mes |
|------|--------|-----------|
| Hasta 50 socios | 1–50 | 15 |
| Hasta 100 socios | 51–100 | 30 |
| Más de 100 socios | 101+ | 45 |

Cuentan solo **socio y profe** activos. Admin y portería no.

## Alta desde una solicitud (trial)

1. En la landing ya mandaron `cantidad_miembros`.
2. Al pasar a trial, el formulario trae club, mail, admin **y** esa cantidad.
3. El precio se completa solo según el plan vigente.
4. Si hay un acuerdo, se puede cambiar el precio a mano. El tope sigue saliendo de la cantidad.

## Si el club se pasa de socios

1. Al cargar el socio 51 (o importar / alta familiar) aparece un **modal**:
   - Este mes **no cambia** el precio.
   - El próximo ciclo sería el plan siguiente.
   - “Sí, entiendo y quiero continuar” o cancelar (no se crea nadie).
2. Si aceptan: el socio **sí se crea**. El precio **no sube**. Queda un **upgrade pendiente**.
3. Sale un **mail** al admin del club. El botón confirma el plan nuevo, no vuelve a preguntar si agregan a Juan.
4. Si no confirman: siguen usando de más, pagan lo de antes, y **nosotros lo vemos** en Superadmin.

No se baja de plan solo. Si después tienen 40, siguen en el precio actual hasta que soporte lo toque.

## Qué ve cada uno

**Comisión del club (`/gestion`)**  
Barra: `Hasta 50 socios · USD 15/mes · 48/50`. Amarillo al 80%. Rojo si se pasaron o hay pendiente. Pueden confirmar el upgrade ahí.

**Superadmin**  
Cards reales: clubes activos, socios en la red, solicitudes, planes sin confirmar.  
Tabla de clubes con plan y `48/50`.  
Bloque “superaron el plan y no confirmaron”: reenviar mail o forzar confirmación.  
Members ahora es **Administradores ClubApp**, no un listado falso de socios.

## Cuándo cambia el precio (todavía no la plata)

Solo si:

1. Confirmaron (mail, el club, o nosotros), **y**
2. Llegó el **1° del mes siguiente**.

Un job diario escribe `precio_usd_mes`. **No hay MercadoPago ni factura de ClubApp.** Eso es el paso siguiente.

## Frases útiles

- “No les cobramos de sorpresa. Primero avisan, después confirman, el precio nuevo es el mes que viene.”
- “Si no confirman, el socio ya está y el precio no sube. Nosotros los vemos en la cola.”
- “Los planes los cambiamos nosotros, no hace falta un deploy.”
