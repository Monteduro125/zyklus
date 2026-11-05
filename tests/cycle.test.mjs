import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as C from '../js/cycle.js';

const P = (start, end) => ({ start, end });

test('Phasen bei 28/7', () => {
  const ph = (d) => C.phaseForDay(d, 28, 7);
  assert.equal(ph(1), 'menstruation'); assert.equal(ph(7), 'menstruation');
  assert.equal(ph(8), 'follicular'); assert.equal(ph(12), 'follicular');
  assert.equal(ph(13), 'ovulation'); assert.equal(ph(15), 'ovulation');
  assert.equal(ph(16), 'luteal'); assert.equal(ph(21), 'luteal');
  assert.equal(ph(22), 'pms'); assert.equal(ph(28), 'pms');
});

test('Standardwerte ohne Historie', () => {
  const s = C.computeStats([P('2026-10-01', null)]);
  assert.equal(s.cycleLength, 28); assert.equal(s.source, 'default');
});

test('Automatische Anpassung auf 26 Tage', () => {
  const ps = []; let d = '2026-01-01';
  for (let i = 0; i < 7; i++) { ps.push(P(d, C.addDays(d, 5))); d = C.addDays(d, 26); }
  const s = C.computeStats(ps);
  assert.equal(s.cycleLength, 26); assert.equal(s.source, 'auto'); assert.equal(s.periodLength, 6);
});

test('Ausreisser wird ignoriert', () => {
  const starts = ['2026-01-01','2026-01-29','2026-02-26','2026-04-10','2026-05-08','2026-06-05'];
  const s = C.computeStats(starts.map((x) => P(x)));
  assert.equal(s.cycleLength, 28);
});

test('Manueller Override gewinnt', () => {
  const s = C.computeStats([P('2026-01-01'), P('2026-01-29'), P('2026-02-26')], { overrideCycle: 25 });
  assert.equal(s.cycleLength, 25); assert.equal(s.source, 'manual');
});

test('dayInfo aktuell und Prognose', () => {
  const ps = [P('2026-10-10', '2026-10-16')];
  const s = C.computeStats(ps);
  const today = '2026-11-05';
  const t = C.dayInfo(today, ps, s, today);
  assert.equal(t.day, 27); assert.equal(t.phase, 'pms');
  const f = C.dayInfo('2026-11-07', ps, s, today);
  assert.equal(f.day, 1); assert.equal(f.phase, 'menstruation'); assert.equal(f.predicted, true);
});

test('Verspaetung', () => {
  const ps = [P('2026-10-01')];
  const s = C.computeStats(ps);
  const today = '2026-11-01';
  const t = C.dayInfo(today, ps, s, today);
  assert.equal(t.late, true);
  assert.equal(C.dayInfo('2026-11-02', ps, s, today).day, 1);
});

test('Urlaubsfenster ohne Periode', () => {
  const ps = [P('2026-10-10', '2026-10-16')];
  const s = C.computeStats(ps);
  const w = C.vacationWindows(ps, s, '2026-11-05', 7);
  assert.ok(w.length >= 4);
  for (const x of w) assert.equal(x.periodDays, 0);
});

import { WIKI, WIKI_TOPICS } from '../js/wiki.js';
import { PHASE_ORDER } from '../js/tips.js';
test('Wiki hat fuer jede Phase jedes Thema', () => {
  for (const ph of PHASE_ORDER) for (const t of WIKI_TOPICS) assert.ok(WIKI[ph]?.[t.key], `${ph}.${t.key}`);
});

import { buildWidgetData, WIDGET_IDEAS, WIDGET_LABELS } from '../js/widget.js';
test('Widget-Texte enthalten keine verraeterischen Woerter', () => {
  const ps = [{ start: '2026-10-10', end: '2026-10-16' }];
  const w = buildWidgetData(ps, C.computeStats(ps), '2026-11-05');
  assert.equal(w.days.length, 60);
  const visible = w.days.map(({ label, idea, next, date }) => [label, idea, next, date]);
  const all = JSON.stringify([visible, Object.values(WIDGET_IDEAS), Object.values(WIDGET_LABELS)]);
  for (const bad of [/period/i, /PMS/, /Eisprung/i, /Menstru/i, /Blutung/i, /Zyklus/i]) assert.doesNotMatch(all, bad);
  assert.equal(w.days[0].d, '2026-11-05');
  assert.equal(w.days[0].next, 'Noch 2 Tage Sanft');
  assert.equal(w.days[1].next, 'Ab morgen: Ruhetage');
  assert.ok(w.days.some((d) => d.date === 'Heute: Date-Night-Fenster'));
});
