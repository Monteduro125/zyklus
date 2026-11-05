import * as C from './cycle.js';
import { PHASES, PHASE_ORDER, pick } from './tips.js';
import { WIKI, WIKI_TOPICS } from './wiki.js';

const KEY = 'zyklus.v1';
const view = document.getElementById('view');
const titleEl = document.getElementById('title');
const sheet = document.getElementById('sheet');
const sheetBody = document.getElementById('sheet-body');

// ---------- Speicher (nur lokal) ----------
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { /* leerer Start */ }
  return normalize({});
}
function normalize(d) {
  return {
    periods: Array.isArray(d.periods) ? d.periods.filter((p) => p && /^\d{4}-\d{2}-\d{2}$/.test(p.start)) : [],
    settings: { defaultCycle: 28, defaultPeriod: 7, overrideCycle: null, overridePeriod: null, ...(d.settings || {}) },
  };
}
let state = load();
function save() {
  state.periods = C.sortPeriods(state.periods);
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { toast('Speichern fehlgeschlagen. Ist der Speicher voll oder gesperrt?'); }
}

// ---------- Helfer ----------
const today = () => C.todayISO();
const stats = () => C.computeStats(state.periods, state.settings);
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WD_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function fmt(iso, opts = {}) {
  const t = C.parseDate(iso);
  const d = new Date(t);
  const base = `${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()].slice(0, opts.long ? 99 : 3)}${opts.long ? '' : '.'}`;
  const withYear = opts.year ? `${base} ${d.getUTCFullYear()}` : base;
  return opts.weekday ? `${WD_LONG[d.getUTCDay()]}, ${withYear}` : withYear;
}
function relDays(n) {
  if (n === 0) return 'heute';
  if (n === 1) return 'morgen';
  if (n === -1) return 'gestern';
  return n > 0 ? `in ${n} Tagen` : `vor ${-n} Tagen`;
}
function seedFor(iso) { return Math.floor(C.parseDate(iso) / 86400000); }
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
function lastPeriod() { const s = C.sortPeriods(state.periods); return s[s.length - 1]; }

// Anfang und Ende der Phase, in der ein Tag liegt.
function phaseRange(iso, st) {
  const info = C.dayInfo(iso, state.periods, st, today());
  if (!info) return null;
  let from = iso, to = iso;
  for (let i = 0; i < 20; i++) {
    const p = C.addDays(from, -1);
    const pi = C.dayInfo(p, state.periods, st, today());
    if (!pi || pi.phase !== info.phase) break;
    from = p;
  }
  for (let i = 0; i < 20; i++) {
    const n = C.addDays(to, 1);
    const ni = C.dayInfo(n, state.periods, st, today());
    if (!ni || ni.phase !== info.phase) break;
    to = n;
  }
  return { from, to };
}

// ---------- Aktionen ----------
function startPeriod(iso) {
  const last = lastPeriod();
  if (last && last.start === iso) return toast('Für diesen Tag ist schon ein Start eingetragen.');
  if (last && iso > last.start && C.diffDays(last.start, iso) < 15 &&
      !confirm(`Der letzte Start war erst am ${fmt(last.start)}. Trotzdem eintragen?`)) return;
  // Offene Periode davor automatisch abschließen.
  if (last && !last.end && iso > last.start) {
    const P = stats().periodLength;
    last.end = C.addDays(last.start, Math.min(P, C.diffDays(last.start, iso)) - 1);
  }
  state.periods.push({ start: iso, end: null });
  save();
  toast(`Periodenstart am ${fmt(iso)} gespeichert.`);
  render();
}
function endPeriod(iso) {
  const p = C.sortPeriods(state.periods).filter((x) => x.start <= iso).pop();
  if (!p) return;
  const entry = state.periods.find((x) => x.start === p.start);
  entry.end = iso;
  save();
  toast(`Periodenende am ${fmt(iso)} gespeichert.`);
  render();
}

// ---------- Ansichten ----------
const views = {
  today: { title: 'Heute', render: renderToday },
  calendar: { title: 'Kalender', render: renderCalendar },
  vacation: { title: 'Urlaub planen', render: renderVacation },
  wiki: { title: 'Wiki', render: renderWiki },
  history: { title: 'Verlauf', render: renderHistory },
  settings: { title: 'Einstellungen', render: renderSettings },
};
let current = 'today';

function render() {
  if (!views[current]) current = 'today';
  titleEl.textContent = views[current].title;
  view.innerHTML = '';
  views[current].render();
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === current));
}

function onboarding() {
  view.innerHTML = `
    <div class="card">
      <h2>Los geht's</h2>
      <p>Wann hat ihre letzte Periode begonnen? Mehr braucht die App für den Anfang nicht.</p>
      <label class="field"><span>Start der letzten Periode</span><input type="date" id="ob-start" max="${today()}" value="${today()}"></label>
      <label class="field"><span>Ende (optional)</span><input type="date" id="ob-end" max="${today()}"></label>
      <button class="btn primary block" id="ob-save">Speichern</button>
      <p class="small muted">Tipp: Trag im Verlauf auch ältere Perioden ein. Ab drei Einträgen passt die App die Zykluslänge automatisch an.</p>
    </div>
    <div class="card small muted">Alle Daten bleiben auf diesem Gerät. Kein Konto, keine Werbung, keine Analyse.</div>`;
  view.querySelector('#ob-save').onclick = () => {
    const start = view.querySelector('#ob-start').value;
    const end = view.querySelector('#ob-end').value || null;
    if (!start) return toast('Bitte ein Startdatum wählen.');
    if (end && end < start) return toast('Das Ende liegt vor dem Start.');
    state.periods.push({ start, end });
    save();
    render();
  };
}

function ringSvg(day, L, color) {
  const r = 52, c = 2 * Math.PI * r;
  const frac = Math.min(1, day / L);
  return `<svg viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="10"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${c * frac} ${c}"/>
  </svg>`;
}

function renderToday() {
  if (!state.periods.length) return onboarding();
  const t = today();
  const st = stats();
  const info = C.dayInfo(t, state.periods, st, t);
  const ph = PHASES[info.phase];
  const seed = seedFor(t);
  const next = C.nextPeriodStart(state.periods, st, t);
  const last = lastPeriod();
  const daysToNext = C.diffDays(t, next.date);

  let nextLine;
  if (info.late) nextLine = `Periode ist ${info.day - info.cycleLength} ${info.day - info.cycleLength === 1 ? 'Tag' : 'Tage'} später als erwartet.`;
  else nextLine = `Nächste Periode ${relDays(daysToNext)}, ${fmt(next.date)} (±${st.spread} ${st.spread === 1 ? 'Tag' : 'Tage'}).`;

  const inOpenPeriod = !last.end && info.phase === 'menstruation' && !info.predicted;
  const energy = Array.from({ length: 5 }, (_, i) => `<i class="${i < ph.energy ? 'on' : ''}"></i>`).join('');

  const notices = [];
  if (!info.late && daysToNext >= 1 && daysToNext <= 2) notices.push('Periode kommt bald. Vorräte checken: Binden oder Tampons, Wärmflasche, Schokolade.');
  if (info.late) notices.push('Die Prognose pausiert, bis du den nächsten Start einträgst. Ein paar Tage Abweichung sind normal, zum Beispiel durch Stress oder Reisen.');
  if (info.phase === 'ovulation' && pick([0, 1], seed) === 0) notices.push('Guter Zeitraum für die große Date Night.');

  // Nächste 7 Tage.
  let week = '';
  for (let i = 0; i < 7; i++) {
    const d = C.addDays(t, i);
    const di = C.dayInfo(d, state.periods, st, t);
    const wd = WD_LONG[new Date(C.parseDate(d)).getUTCDay()].slice(0, 2);
    week += `<div style="background:${PHASES[di.phase].color};color:#fff" class="${i === 0 ? 'today' : ''}" title="${PHASES[di.phase].name}">${wd}<br><b>${new Date(C.parseDate(d)).getUTCDate()}</b></div>`;
  }

  const range = phaseRange(t, st);

  view.innerHTML = `
    <div class="card" style="--phase:${ph.color}">
      <div class="hero">
        <div class="ring">${ringSvg(info.day, info.cycleLength, ph.color)}
          <div class="center"><div><div class="num">${info.day}</div><div class="lbl">Zyklustag</div></div></div>
        </div>
        <div>
          <span class="pill" style="background:${ph.color}">${ph.short}</span>
          <p class="phase-name">${ph.name}</p>
          <div class="small muted">Energie</div>
          <div class="energy" aria-label="Energie ${ph.energy} von 5">${energy}</div>
        </div>
      </div>
      <p class="small muted" style="margin-top:12px">${nextLine}</p>
      <div class="row" style="margin-top:8px">
        ${last.start !== t ? '<button class="btn primary grow" id="act-start">Periode hat heute begonnen</button>' : ''}
        ${inOpenPeriod && last.start !== t ? '<button class="btn grow" id="act-end">Heute beendet</button>' : ''}
      </div>
    </div>

    ${notices.map((n) => `<div class="card notice">${n}</div>`).join('')}

    <div class="card">
      <h2>Tipp für heute</h2>
      <p class="tip">${pick(ph.tips, seed)}</p>
      <dl class="kv" style="margin-top:12px">
        <dt>Stimmung</dt><dd>${pick(ph.mood, seed)}</dd>
        <dt>Cravings</dt><dd>${ph.cravings}</dd>
        <dt>Date-Idee</dt><dd>${pick(ph.dates, seed)}</dd>
        <dt>Lieber nicht</dt><dd>${pick(ph.avoid, seed)}</dd>
      </dl>
    </div>

    <div class="card">
      <h2>Nächste 7 Tage</h2>
      <div class="week">${week}</div>
    </div>

    <div class="card">
      <h2>Diese Phase: ${ph.name}</h2>
      <p class="small muted">${range ? `${fmt(range.from)} bis ${fmt(range.to)}` : ''}</p>
      <p><b>${ph.summary}</b></p>
      <ul>${ph.tips.slice(0, 4).map((x) => `<li>${x}</li>`).join('')}</ul>
      <button class="btn block" id="act-wiki">Mehr zu dieser Phase im Wiki</button>
    </div>

    <p class="small muted">Typische Tendenzen, keine Garantie. Am besten einfach nachfragen.</p>`;

  view.querySelector('#act-start')?.addEventListener('click', () => startPeriod(t));
  view.querySelector('#act-end')?.addEventListener('click', () => endPeriod(t));
  view.querySelector('#act-wiki').addEventListener('click', () => { wikiPhase = info.phase; go('wiki'); });
}

function renderCalendar() {
  if (!state.periods.length) return onboarding();
  const t = today();
  const st = stats();
  const legend = PHASE_ORDER.map((k) => `<span style="--c:${PHASES[k].color}">${PHASES[k].name}</span>`).join('');
  let html = `<div class="card"><div class="legend">${legend}</div><p class="small muted" style="margin:8px 0 0">Blasse Tage sind Prognose. Tippe auf einen Tag für Details.</p></div>`;

  const now = new Date(C.parseDate(t));
  for (let m = -1; m <= 6; m++) {
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + m, 1));
    const y = first.getUTCFullYear(), mo = first.getUTCMonth();
    const daysIn = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    const lead = (first.getUTCDay() + 6) % 7;
    let cells = WD.map((w) => `<div class="wd">${w}</div>`).join('');
    for (let i = 0; i < lead; i++) cells += '<div class="day empty"></div>';
    for (let d = 1; d <= daysIn; d++) {
      const iso = C.formatISO(Date.UTC(y, mo, d));
      const info = C.dayInfo(iso, state.periods, st, t);
      const cls = ['day'];
      let style = '';
      if (info) { cls.push('ph'); style = `background:${PHASES[info.phase].color}`; if (info.predicted) cls.push('pred'); }
      if (iso === t) cls.push('today');
      cells += `<button class="${cls.join(' ')}" style="${style}" data-date="${iso}" aria-label="${fmt(iso, { long: true })}${info ? ', ' + PHASES[info.phase].name : ''}">${d}</button>`;
    }
    html += `<section class="month"><h3>${MONTHS[mo]} ${y}</h3><div class="grid">${cells}</div></section>`;
  }
  view.innerHTML = html;
  view.querySelectorAll('.day[data-date]').forEach((b) => b.addEventListener('click', () => daySheet(b.dataset.date)));
  // Zum aktuellen Monat scrollen.
  view.querySelectorAll('.month')[1]?.scrollIntoView({ block: 'start' });
}

function daySheet(iso) {
  const t = today();
  const st = stats();
  const info = C.dayInfo(iso, state.periods, st, t);
  const ph = info && PHASES[info.phase];
  const seed = seedFor(iso);
  const inPast = iso <= t;
  const canEnd = inPast && state.periods.some((p) => p.start < iso && C.diffDays(p.start, iso) < 12);
  sheetBody.innerHTML = `
    <h2 style="margin:0 0 4px">${fmt(iso, { long: true, weekday: true, year: true })}</h2>
    ${info ? `<p><span class="pill" style="background:${ph.color}">${ph.name}</span> <span class="muted">Zyklustag ${info.day}${info.predicted ? ', Prognose' : ''}</span></p>
      <p><b>${pick(ph.tips, seed)}</b></p>
      <p class="small">${pick(ph.mood, seed)}</p>
      <p class="small"><span class="muted">Date-Idee:</span> ${pick(ph.dates, seed)}</p>` : '<p class="muted">Für diesen Tag gibt es noch keine Daten.</p>'}
    <div class="row" style="margin-top:12px">
      ${inPast ? '<button class="btn primary grow" id="ds-start">Periode begann an diesem Tag</button>' : ''}
      ${canEnd ? '<button class="btn grow" id="ds-end">Periode endete an diesem Tag</button>' : ''}
      <button class="btn grow" id="ds-close">Schließen</button>
    </div>`;
  sheet.showModal();
  sheetBody.querySelector('#ds-close').onclick = () => sheet.close();
  sheetBody.querySelector('#ds-start')?.addEventListener('click', () => { sheet.close(); startPeriod(iso); });
  sheetBody.querySelector('#ds-end')?.addEventListener('click', () => { sheet.close(); endPeriod(iso); });
}
sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });

let wikiPhase = null;
function renderWiki() {
  const t = today();
  const info = state.periods.length ? C.dayInfo(t, state.periods, stats(), t) : null;
  const sel = wikiPhase || (info && info.phase) || 'menstruation';
  const chips = PHASE_ORDER.map((k) => `<button class="chip ${k === sel ? 'on' : ''}" data-phase="${k}" style="--c:${PHASES[k].color}">${PHASES[k].name}</button>`).join('');
  const ph = PHASES[sel];
  const w = WIKI[sel];
  view.innerHTML = `
    <div class="chips" role="tablist">${chips}</div>
    <div class="card" style="border-top:4px solid ${ph.color}">
      <p class="phase-name">${ph.name}${info && info.phase === sel ? ' <span class="pill" style="background:' + ph.color + '">jetzt</span>' : ''}</p>
      <p class="muted small">${ph.summary}</p>
      <dl class="wiki">${WIKI_TOPICS.map((tp) => `<dt>${tp.label}</dt><dd>${w[tp.key]}</dd>`).join('')}</dl>
    </div>
    <p class="small muted">Typische Tendenzen, keine Garantie und keine medizinische Beratung. Jede Frau erlebt ihren Zyklus anders.</p>`;
  view.querySelectorAll('[data-phase]').forEach((b) => b.addEventListener('click', () => { wikiPhase = b.dataset.phase; render(); }));
  const on = view.querySelector('.chip.on');
  on.parentElement.scrollLeft = on.offsetLeft - (on.parentElement.clientWidth - on.offsetWidth) / 2;
}

let vacationLength = 7;
function renderVacation() {
  if (!state.periods.length) return onboarding();
  const t = today();
  const st = stats();
  const wins = C.vacationWindows(state.periods, st, t, vacationLength);
  const lamp = (w) => w.periodDays ? ['var(--c-mens)', 'Periode im Urlaub'] : w.pmsDays > 2 ? ['var(--c-ovu)', `${w.pmsDays} PMS-Tage`] : ['var(--c-foll)', 'Keine Periode'];
  const opts = [3, 4, 5, 7, 10, 14, 21].map((n) => `<option value="${n}" ${n === vacationLength ? 'selected' : ''}>${n} Tage</option>`).join('');
  view.innerHTML = `
    <div class="card">
      <p>Vorschläge für die nächsten 6 Monate. Bevorzugt werden Zeiträume ohne Periode und mit viel Energie.</p>
      <label class="field"><span>Reisedauer</span><select id="vl">${opts}</select></label>
    </div>
    <div class="card">
      <h2>Beste Zeiträume</h2>
      <ul class="list">${wins.map((w) => { const [c, txt] = lamp(w); return `
        <li><span class="dot" style="background:${c}"></span>
          <div class="grow"><b>${fmt(w.from)} bis ${fmt(w.to, { year: true })}</b><div class="small muted">${txt}</div></div></li>`; }).join('')}
      </ul>
    </div>
    <div class="card">
      <h2>Eigenen Zeitraum prüfen</h2>
      <div class="row"><label class="field grow"><span>Von</span><input type="date" id="vf" min="${t}"></label>
      <label class="field grow"><span>Bis</span><input type="date" id="vt" min="${t}"></label></div>
      <p id="vr" class="small"></p>
    </div>
    <p class="small muted">Je weiter in der Zukunft, desto ungenauer. Kurz vor der Buchung lohnt ein zweiter Blick.</p>`;
  view.querySelector('#vl').onchange = (e) => { vacationLength = Number(e.target.value); render(); };
  const check = () => {
    const f = view.querySelector('#vf').value, to = view.querySelector('#vt').value, out = view.querySelector('#vr');
    if (!f || !to) { out.textContent = ''; return; }
    if (to < f) { out.textContent = 'Das Ende liegt vor dem Anfang.'; return; }
    const r = C.rateRange(f, to, state.periods, st, t);
    if (!r) return;
    out.innerHTML = r.periodDays
      ? `<b style="color:var(--c-mens)">Voraussichtlich ${r.periodDays} Periodentage</b> in diesem Zeitraum.`
      : `<b style="color:var(--c-foll)">Voraussichtlich keine Periode.</b>${r.pmsDays ? ` ${r.pmsDays} Tage PMS-Phase.` : ''}`;
  };
  view.querySelector('#vf').onchange = check;
  view.querySelector('#vt').onchange = check;
}

function renderHistory() {
  const st = stats();
  const s = C.sortPeriods(state.periods);
  const srcText = { auto: `automatisch aus den letzten ${st.lengths.length} Zyklen`, manual: 'manuell festgelegt', default: 'Standardwert, bis drei Perioden eingetragen sind' }[st.source];
  const rows = s.map((p, i) => {
    const len = s[i + 1] ? C.diffDays(p.start, s[i + 1].start) : null;
    const dur = p.end ? C.diffDays(p.start, p.end) + 1 : null;
    return { p, len, dur };
  }).reverse();

  view.innerHTML = `
    <div class="card">
      <h2>Prognose-Grundlage</h2>
      <dl class="kv">
        <dt>Zyklus</dt><dd><b>${st.cycleLength} Tage</b> <span class="small muted">(${srcText})</span></dd>
        <dt>Periode</dt><dd><b>${st.periodLength} Tage</b></dd>
        <dt>Genauigkeit</dt><dd>±${st.spread} ${st.spread === 1 ? 'Tag' : 'Tage'}</dd>
      </dl>
    </div>
    <div class="card">
      <h2>Ältere Periode nachtragen</h2>
      <div class="row"><label class="field grow"><span>Start</span><input type="date" id="h-start" max="${today()}"></label>
      <label class="field grow"><span>Ende (optional)</span><input type="date" id="h-end" max="${today()}"></label></div>
      <button class="btn primary block" id="h-add">Hinzufügen</button>
    </div>
    <div class="card">
      <h2>Einträge</h2>
      ${rows.length ? `<ul class="list">${rows.map(({ p, len, dur }) => `
        <li><span class="dot" style="background:var(--c-mens)"></span>
          <div class="grow"><b>${fmt(p.start, { year: true })}</b>
            <div class="small muted">${dur ? `${dur} Tage Periode` : 'Ende offen'}${len ? ` · Zyklus ${len} Tage` : ' · aktueller Zyklus'}</div></div>
          <button class="btn small" data-edit="${p.start}">Ändern</button></li>`).join('')}</ul>` : '<p class="muted">Noch keine Einträge.</p>'}
    </div>`;

  view.querySelector('#h-add').onclick = () => {
    const start = view.querySelector('#h-start').value;
    const end = view.querySelector('#h-end').value || null;
    if (!start) return toast('Bitte ein Startdatum wählen.');
    if (end && end < start) return toast('Das Ende liegt vor dem Start.');
    if (state.periods.some((p) => p.start === start)) return toast('Dieser Start ist schon eingetragen.');
    state.periods.push({ start, end });
    save(); toast('Hinzugefügt.'); render();
  };
  view.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => editSheet(b.dataset.edit)));
}

function editSheet(start) {
  const entry = state.periods.find((p) => p.start === start);
  sheetBody.innerHTML = `
    <h2 style="margin:0 0 8px">Eintrag ändern</h2>
    <label class="field"><span>Start</span><input type="date" id="e-start" value="${entry.start}" max="${today()}"></label>
    <label class="field"><span>Ende</span><input type="date" id="e-end" value="${entry.end || ''}" max="${today()}"></label>
    <div class="row"><button class="btn primary grow" id="e-save">Speichern</button><button class="btn grow" id="e-close">Abbrechen</button></div>
    <button class="btn danger block" id="e-del" style="margin-top:12px">Eintrag löschen</button>`;
  sheet.showModal();
  sheetBody.querySelector('#e-close').onclick = () => sheet.close();
  sheetBody.querySelector('#e-save').onclick = () => {
    const s = sheetBody.querySelector('#e-start').value;
    const e = sheetBody.querySelector('#e-end').value || null;
    if (!s) return toast('Start fehlt.');
    if (e && e < s) return toast('Das Ende liegt vor dem Start.');
    if (s !== start && state.periods.some((p) => p.start === s)) return toast('Dieser Start ist schon eingetragen.');
    entry.start = s; entry.end = e;
    save(); sheet.close(); render();
  };
  sheetBody.querySelector('#e-del').onclick = () => {
    if (!confirm('Diesen Eintrag wirklich löschen?')) return;
    state.periods = state.periods.filter((p) => p !== entry);
    save(); sheet.close(); render();
  };
}

function renderSettings() {
  const s = state.settings;
  const st = stats();
  const cycOpts = ['<option value="">Automatisch</option>'].concat(
    Array.from({ length: 21 }, (_, i) => 21 + i).map((n) => `<option value="${n}" ${s.overrideCycle === n ? 'selected' : ''}>Fest: ${n} Tage</option>`)).join('');
  const perOpts = ['<option value="">Automatisch</option>'].concat(
    Array.from({ length: 9 }, (_, i) => 2 + i).map((n) => `<option value="${n}" ${s.overridePeriod === n ? 'selected' : ''}>Fest: ${n} Tage</option>`)).join('');
  view.innerHTML = `
    <div class="card">
      <h2>Zyklus</h2>
      <label class="field"><span>Zykluslänge (aktuell ${st.cycleLength} Tage)</span><select id="s-cyc">${cycOpts}</select></label>
      <p class="small muted">Automatisch heißt: gewichteter Durchschnitt der letzten 6 Zyklen, neuere zählen stärker, Ausreißer werden ignoriert. Wähle einen festen Wert, wenn du es besser weißt, zum Beispiel „ab sofort 26 Tage“.</p>
      <label class="field"><span>Periodendauer (aktuell ${st.periodLength} Tage)</span><select id="s-per">${perOpts}</select></label>
      <div class="row">
        <label class="field grow"><span>Startwert Zyklus</span><input type="number" id="s-dc" min="21" max="45" value="${s.defaultCycle}"></label>
        <label class="field grow"><span>Startwert Periode</span><input type="number" id="s-dp" min="2" max="10" value="${s.defaultPeriod}"></label>
      </div>
      <p class="small muted">Startwerte gelten, solange weniger als drei Perioden eingetragen sind.</p>
    </div>
    <div class="card">
      <h2>Daten</h2>
      <p class="small">Alle Daten liegen nur in diesem Browser auf diesem Gerät. Sichere sie ab und zu als Datei.</p>
      <div class="row">
        <button class="btn grow" id="s-export">Backup speichern</button>
        <label class="btn grow" for="s-import">Backup laden</label>
        <input type="file" id="s-import" accept="application/json,.json" hidden>
      </div>
      <button class="btn danger block" id="s-wipe" style="margin-top:12px">Alle Daten löschen</button>
    </div>
    <div class="card small muted">
      <h2>Über</h2>
      <p>Die Tipps beschreiben typische hormonelle Tendenzen und sind keine medizinische Beratung. Diese App ist nicht zur Verhütung geeignet.</p>
      <p>Installieren: In Chrome auf das Menü ⋮ tippen und „App installieren“ oder „Zum Startbildschirm hinzufügen“ wählen.</p>
    </div>`;

  const num = (v) => (v ? Number(v) : null);
  view.querySelector('#s-cyc').onchange = (e) => { s.overrideCycle = num(e.target.value); save(); render(); toast('Gespeichert.'); };
  view.querySelector('#s-per').onchange = (e) => { s.overridePeriod = num(e.target.value); save(); render(); toast('Gespeichert.'); };
  view.querySelector('#s-dc').onchange = (e) => { const v = Number(e.target.value); if (v >= 21 && v <= 45) { s.defaultCycle = v; save(); render(); } };
  view.querySelector('#s-dp').onchange = (e) => { const v = Number(e.target.value); if (v >= 2 && v <= 10) { s.defaultPeriod = v; save(); render(); } };
  view.querySelector('#s-export').onclick = () => {
    const blob = new Blob([JSON.stringify({ app: 'zyklus', version: 1, exported: today(), ...state }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `zyklus-backup-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  view.querySelector('#s-import').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = normalize(JSON.parse(await file.text()));
      if (!confirm(`Backup mit ${data.periods.length} Einträgen laden? Die aktuellen Daten werden ersetzt.`)) return;
      state = data; save(); render(); toast('Backup geladen.');
    } catch (err) { toast('Diese Datei konnte nicht gelesen werden.'); }
  };
  view.querySelector('#s-wipe').onclick = () => {
    if (!confirm('Wirklich alle Daten löschen? Das lässt sich nicht rückgängig machen.')) return;
    state = normalize({}); save(); current = 'today'; render();
  };
}

// ---------- Start ----------
function go(tab) {
  current = tab;
  window.scrollTo(0, 0);
  render();
}
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.tab === 'wiki') wikiPhase = null;
  go(b.dataset.tab);
}));

// Bei Rückkehr zur App den Tag neu berechnen.
let renderedFor = today();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && today() !== renderedFor) { renderedFor = today(); render(); }
});

render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // Wenn eine neue Version übernimmt, einmal neu laden, damit alle Dateien zusammenpassen.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
