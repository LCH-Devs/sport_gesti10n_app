import {
  calorFranjas,
  disponibilidadSlotsForDay,
  extraStartMinutesFromBusyDates,
  horarioCaeEnDia,
  intervalWithinUsableWindow,
  occupiedMinutes,
  pct,
  reservaFitsSlot,
  usableWindowMins,
} from './ocupacion';

describe('ocupacion de espacios', () => {
  it('la ventana útil corta la última hora (8–23 → 8–22)', () => {
    expect(usableWindowMins('08:00', '23:00')).toEqual({
      start: 8 * 60,
      end: 22 * 60,
    });
  });

  it('no deja la ventana invertida si el espacio abre tarde', () => {
    expect(usableWindowMins('22:00', '23:00')).toEqual({
      start: 22 * 60,
      end: 23 * 60,
    });
  });

  it('fusiona solapes para no contar dos veces', () => {
    const win = { start: 8 * 60, end: 22 * 60 };
    const occ = occupiedMinutes(win.start, win.end, [
      { start: 10 * 60, end: 12 * 60 },
      { start: 11 * 60, end: 13 * 60 },
    ]);
    expect(occ).toBe(3 * 60);
  });

  it('calcula % y calor mañana/tarde/noche', () => {
    const { start, end } = usableWindowMins('08:00', '23:00');
    expect(pct(7 * 60, 14 * 60)).toBe(50);
    const franjas = calorFranjas(start, end);
    expect(franjas.manana).toEqual({ start: 8 * 60, end: 13 * 60 });
    expect(franjas.tarde).toEqual({ start: 13 * 60, end: 18 * 60 });
    expect(franjas.noche).toEqual({ start: 18 * 60, end: 22 * 60 });
  });

  it('detecta el día de un horario semanal', () => {
    const mie = new Date(2026, 8, 16); // miércoles
    const sab = new Date(2026, 8, 19);
    expect(horarioCaeEnDia('lun,mie,vie', mie)).toBe(true);
    expect(horarioCaeEnDia('lun,vie', mie)).toBe(false);
    expect(horarioCaeEnDia('Lunes,Miércoles,Viernes', mie)).toBe(true);
    expect(horarioCaeEnDia('Lun y Mié', mie)).toBe(true);
    expect(horarioCaeEnDia('Sábado', sab)).toBe(true);
    expect(horarioCaeEnDia('Sábado', mie)).toBe(false);
  });

  it('la reserva queda dentro del horario útil del espacio (8–22 → 8–21)', () => {
    const d = (h: number, m = 0) => new Date(2026, 8, 16, h, m, 0, 0);
    expect(intervalWithinUsableWindow(d(8), d(14), '08:00', '22:00')).toBe(true);
    expect(intervalWithinUsableWindow(d(20), d(21), '08:00', '22:00')).toBe(true);
    expect(intervalWithinUsableWindow(d(8), d(21), '08:00', '22:00')).toBe(true);
    expect(intervalWithinUsableWindow(d(7), d(14), '08:00', '22:00')).toBe(false);
    expect(intervalWithinUsableWindow(d(20), d(23), '08:00', '22:00')).toBe(false);
    expect(intervalWithinUsableWindow(d(19), d(24), '08:00', '22:00')).toBe(false);
  });

  it('el alquiler mínimo alinea inicio y duración al slot del espacio', () => {
    const d = (h: number, m = 0) => new Date(2026, 8, 16, h, m, 0, 0);
    expect(reservaFitsSlot(d(18), d(19), '08:00', '23:00', 60)).toBe(true);
    expect(reservaFitsSlot(d(18), d(20), '08:00', '23:00', 60)).toBe(true);
    expect(reservaFitsSlot(d(18, 43), d(19, 43), '08:00', '23:00', 60)).toBe(false);
    expect(reservaFitsSlot(d(18), d(18, 30), '08:00', '23:00', 60)).toBe(false);
  });

  it('después de un entrenamiento 18:00–19:30 ofrece 19:30–20:30, no 19:00–20:00', () => {
    const day = new Date(2026, 8, 16);
    const d = (h: number, m = 0) => new Date(2026, 8, 16, h, m, 0, 0);
    const busy = [{ start: d(18), end: d(19, 30) }];
    const extra = extraStartMinutesFromBusyDates(
      day,
      '08:00',
      '23:00',
      60,
      busy,
    );
    expect(extra).toContain(19 * 60 + 30);
    expect(extra).toContain(20 * 60 + 30);
    expect(reservaFitsSlot(d(19, 30), d(20, 30), '08:00', '23:00', 60, extra)).toBe(
      true,
    );
    expect(reservaFitsSlot(d(19, 30), d(20, 30), '08:00', '23:00', 60)).toBe(
      false,
    );
    expect(reservaFitsSlot(d(18, 43), d(19, 43), '08:00', '23:00', 60, extra)).toBe(
      false,
    );

    const slots = disponibilidadSlotsForDay({
      fecha: '2026-09-16',
      dayStart: day,
      apertura: '08:00',
      cierre: '23:00',
      duracionSlotMin: 60,
      busy,
    });
    const byStart = Object.fromEntries(slots.map((s) => [s.inicio.slice(11, 16), s]));
    expect(byStart['18:00']?.libre).toBe(false);
    expect(byStart['19:00']?.libre).toBe(false);
    expect(byStart['19:30']?.libre).toBe(true);
    expect(byStart['19:30']?.fin).toBe('2026-09-16T20:30:00');
    expect(byStart['20:00']?.libre).toBe(true);
    expect(byStart['20:30']?.libre).toBe(true);
  });
});
