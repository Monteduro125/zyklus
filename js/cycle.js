// Zyklusberechnung: reine Funktionen ohne DOM, damit sie testbar sind.

const DAY = 86400000;

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function formatISO(t) {
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

export function todayISO(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function addDays(iso, n) {
  return formatISO(parseDate(iso) + n * DAY);
}

export function diffDays(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / DAY);
}

export const DEFAULTS = { cycleLength: 28, periodLength: 7 };
const MAX_HISTORY = 6;
const MIN_LUTEAL = 14;

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function sortPeriods(periods) {
  return [...periods].sort((a, b) => a.start.localeCompare(b.start));
}

// Zykluslängen aus aufeinanderfolgenden Periodenstarts, neueste zuletzt.
export function cycleLengths(periods) {
  const s = sortPeriods(periods);
  const out = [];
  for (let i = 1; i < s.length; i++) out.push(diffDays(s[i - 1].start, s[i].start));
  return out;
}

// Ausreißer raus: unplausible Werte und alles, was mehr als 7 Tage vom Median abweicht.
export function usableLengths(lengths) {
  const recent = lengths.filter((l) => l >= 18 && l <= 45).slice(-MAX_HISTORY);
  if (recent.length < 3) return recent;
  const med = median(recent);
  return recent.filter((l) => Math.abs(l - med) <= 7);
}

function weightedAverage(xs) {
  let sum = 0, w = 0;
  xs.forEach((x, i) => { sum += x * (i + 1); w += i + 1; });
  return sum / w;
}

// Liefert die Prognose-Grundlage inklusive Erklärung für die Oberfläche.
export function computeStats(periods, settings = {}) {
  const lengths = usableLengths(cycleLengths(periods));
  const base = settings.defaultCycle || DEFAULTS.cycleLength;
  let cycleLength = base, source = 'default', spread = 1;

  if (settings.overrideCycle) {
    cycleLength = settings.overrideCycle;
    source = 'manual';
  } else if (lengths.length >= 2) {
    cycleLength = Math.round(weightedAverage(lengths));
    source = 'auto';
  }
  if (lengths.length >= 2) {
    spread = Math.max(1, Math.round(Math.max(...lengths.map((l) => Math.abs(l - cycleLength)))));
    spread = Math.min(spread, 5);
  }

  const durations = sortPeriods(periods)
    .filter((p) => p.end)
    .map((p) => diffDays(p.start, p.end) + 1)
    .filter((d) => d >= 2 && d <= 10)
    .slice(-MAX_HISTORY);
  let periodLength = settings.defaultPeriod || DEFAULTS.periodLength;
  if (settings.overridePeriod) periodLength = settings.overridePeriod;
  else if (durations.length >= 2) periodLength = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

  return { cycleLength, periodLength, spread, source, lengths, recentAverage: lengths.length ? weightedAverage(lengths) : null };
}

// Phase für einen Zyklustag (1-basiert). Eisprung wird rückwärts vom nächsten Start gezählt.
export function phaseForDay(day, cycleLength, periodLength) {
  const ovulation = Math.max(periodLength + 2, cycleLength - MIN_LUTEAL);
  if (day <= periodLength) return 'menstruation';
  if (day < ovulation - 1) return 'follicular';
  if (day <= ovulation + 1) return 'ovulation';
  if (day > cycleLength - 7) return 'pms';
  return 'luteal';
}

// Infos zu einem Datum: Zyklustag, Phase, ob es Prognose oder echte Daten sind.
export function dayInfo(iso, periods, stats, today = iso) {
  const s = sortPeriods(periods);
  if (!s.length) return null;
  const { cycleLength: L, periodLength: P } = stats;

  // Letzter eingetragener Start an oder vor dem Datum.
  let idx = -1;
  for (let i = s.length - 1; i >= 0; i--) if (s[i].start <= iso) { idx = i; break; }
  if (idx === -1) return null;

  const entry = s[idx];
  const next = s[idx + 1];

  if (next) {
    // Vergangener, abgeschlossener Zyklus: echte Länge verwenden.
    const realL = diffDays(entry.start, next.start);
    const day = diffDays(entry.start, iso) + 1;
    const realP = entry.end ? diffDays(entry.start, entry.end) + 1 : P;
    return { day, cycleLength: realL, phase: phaseForDay(day, realL, realP), predicted: false, cycleStart: entry.start };
  }

  // Aktueller Zyklus ab letztem Eintrag.
  const sinceLast = diffDays(entry.start, iso);
  const currentP = entry.end ? diffDays(entry.start, entry.end) + 1 : P;
  const todayDay = diffDays(entry.start, today) + 1;
  const late = todayDay > L;

  if (sinceLast < L || (late && iso <= today)) {
    const day = sinceLast + 1;
    if (day > L) return { day, cycleLength: L, phase: 'pms', predicted: false, late: true, cycleStart: entry.start };
    return { day, cycleLength: L, phase: phaseForDay(day, L, currentP), predicted: iso > today, cycleStart: entry.start };
  }

  // Zukünftige Zyklen hochrechnen. Bei Verspätung startet die Prognose morgen.
  const firstFuture = late ? addDays(today, 1) : addDays(entry.start, L);
  const offset = diffDays(firstFuture, iso);
  const k = Math.floor(offset / L);
  const start = addDays(firstFuture, k * L);
  const day = offset - k * L + 1;
  return { day, cycleLength: L, phase: phaseForDay(day, L, P), predicted: true, cycleStart: start };
}

export function nextPeriodStart(periods, stats, today) {
  const s = sortPeriods(periods);
  if (!s.length) return null;
  const last = s[s.length - 1];
  let next = addDays(last.start, stats.cycleLength);
  if (next <= today) {
    // Bereits überfällig: Prognose ist nicht mehr sinnvoll datierbar.
    return { date: next, overdueDays: diffDays(next, today) };
  }
  return { date: next, overdueDays: 0 };
}

// Urlaubsfenster in den nächsten `horizon` Tagen bewerten.
export function vacationWindows(periods, stats, today, length = 7, horizon = 183) {
  const weights = { menstruation: -10, pms: -2, luteal: 0, follicular: 2, ovulation: 3 };
  const windows = [];
  for (let start = 1; start + length <= horizon; start++) {
    const from = addDays(today, start);
    let score = 0, periodDays = 0, pmsDays = 0;
    for (let i = 0; i < length; i++) {
      const info = dayInfo(addDays(from, i), periods, stats, today);
      if (!info) return [];
      score += weights[info.phase];
      if (info.phase === 'menstruation') periodDays++;
      if (info.phase === 'pms') pmsDays++;
    }
    windows.push({ from, to: addDays(from, length - 1), score, periodDays, pmsDays });
  }
  // Beste Fenster wählen, ohne dass sie sich stark überlappen.
  windows.sort((a, b) => b.score - a.score || a.from.localeCompare(b.from));
  const picked = [];
  for (const w of windows) {
    if (picked.every((p) => Math.abs(diffDays(p.from, w.from)) >= 14)) picked.push(w);
    if (picked.length === 6) break;
  }
  return picked.sort((a, b) => a.from.localeCompare(b.from));
}

// Bewertung eines frei gewählten Zeitraums.
export function rateRange(from, to, periods, stats, today) {
  let periodDays = 0, pmsDays = 0, total = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const info = dayInfo(d, periods, stats, today);
    if (!info) return null;
    total++;
    if (info.phase === 'menstruation') periodDays++;
    if (info.phase === 'pms') pmsDays++;
  }
  return { periodDays, pmsDays, total };
}
