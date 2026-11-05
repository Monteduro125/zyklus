// Daten für die Android-Widgets. Bewusst neutral formuliert: kein „Periode“, keine Fachbegriffe,
// weil der Startbildschirm auch für andere sichtbar ist.
import * as C from './cycle.js';
import { PHASES } from './tips.js';

export const WIDGET_COLORS = {
  menstruation: '#E05A70',
  follicular: '#45AE87',
  ovulation: '#E6AE38',
  luteal: '#6A8DE0',
  pms: '#A673D4',
};

// Kurze Ideen für unterwegs oder zu Hause. Je Phase rotierend.
export const WIDGET_IDEAS = {
  menstruation: [
    'Chillen zu Hause: Sofa, Decke, Lieblingsserie',
    'Essen bestellen und einen Film aussuchen',
    'Frühstück im Bett',
    'Tee kochen und ein Hörbuch zusammen hören',
    'Ruhiger Abend, früh schlafen',
  ],
  follicular: [
    'Etwas Neues ausprobieren: Kochkurs oder Escape Room',
    'Bouldern gehen, danach Burger',
    'Ausflug in eine Stadt in der Nähe',
    'Kurztrip planen und buchen',
    'Neues Restaurant testen',
  ],
  ovulation: [
    'Date Night: schick essen gehen',
    'Konzert, Theater oder Tanzen',
    'Picknick zum Sonnenuntergang',
    'Abend mit Freunden',
    'Rooftop-Bar ausprobieren',
  ],
  luteal: [
    'Zusammen kochen, etwas Neues',
    'Spieleabend zu Hause',
    'Spaziergang mit Kaffee to go',
    'Kino mit Popcorn',
    'Chillen zu Hause mit Puzzle oder Serie',
  ],
  pms: [
    'Chillen zu Hause: Lieblingsessen und Kuscheln',
    'Spa-Abend zu Hause oder Therme',
    'Wohlfühlserie und Snacks',
    'Warmes Bad und früh schlafen',
    'Massage anbieten',
  ],
};

// Neutrale Bezeichnungen fürs Widget.
export const WIDGET_LABELS = {
  menstruation: 'Ruhetage',
  follicular: 'Aufwind',
  ovulation: 'Hochphase',
  luteal: 'Gemütlich',
  pms: 'Sanft',
};

const plural = (n, one, many) => (n === 1 ? one : many);

// Erzeugt Einträge für `days` Tage ab heute.
export function buildWidgetData(periods, stats, today, days = 60) {
  if (!periods.length) return { generated: today, days: [] };
  const infos = [];
  for (let i = 0; i < days + 40; i++) {
    const d = C.addDays(today, i);
    infos.push({ d, info: C.dayInfo(d, periods, stats, today) });
  }
  const out = [];
  for (let i = 0; i < days; i++) {
    const { d, info } = infos[i];
    if (!info) continue;
    const phase = info.phase;

    // Wie lange noch in dieser Phase, und was kommt danach?
    let j = i;
    while (j < infos.length && infos[j].info && infos[j].info.phase === phase) j++;
    const left = j - i;
    const nextPhase = infos[j]?.info?.phase;
    const next = left <= 1 && nextPhase
      ? `Ab morgen: ${WIDGET_LABELS[nextPhase]}`
      : `Noch ${left} ${plural(left, 'Tag', 'Tage')} ${WIDGET_LABELS[phase]}`;

    // Nächstes Date-Night-Fenster (Hochphase).
    let date;
    if (phase === 'ovulation') date = 'Heute: Date-Night-Fenster';
    else {
      let k = i;
      while (k < infos.length && infos[k].info && infos[k].info.phase !== 'ovulation') k++;
      const n = k - i;
      date = k < infos.length ? `Date-Night-Fenster in ${n} ${plural(n, 'Tag', 'Tagen')}` : '';
    }

    const seed = Math.floor(C.parseDate(d) / 86400000);
    const ideas = WIDGET_IDEAS[phase];
    out.push({
      d,
      phase,
      color: WIDGET_COLORS[phase],
      label: WIDGET_LABELS[phase],
      day: info.day,
      len: info.cycleLength,
      energy: PHASES[phase].energy,
      idea: ideas[((seed % ideas.length) + ideas.length) % ideas.length],
      next,
      date,
    });
  }
  return { generated: today, days: out };
}
