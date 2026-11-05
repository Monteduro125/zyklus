// Inhalte je Phase. Typische Tendenzen, keine Garantie: jede Frau erlebt ihren Zyklus anders.

export const PHASES = {
  menstruation: {
    name: 'Periode',
    short: 'Periode',
    color: 'var(--c-mens)',
    energy: 1,
    summary: 'Ruhe, Wärme und wenig Erwartungen.',
    mood: [
      'Wahrscheinlich ruhebedürftig. Krämpfe und Müdigkeit können die Laune drücken.',
      'Oft eher nach innen gekehrt. Nähe ja, Programm nein.',
      'Die ersten Tage sind meist die anstrengendsten, danach wird es leichter.',
    ],
    cravings: 'Schokolade, Warmes, Salziges. Eisenreiches Essen tut gut (Linsen, Spinat, rotes Fleisch).',
    tips: [
      'Wärmflasche füllen und Tee machen, ohne dass sie fragen muss.',
      'Ihren Lieblingssnack mitbringen, einfach so.',
      'Haushalt heute übernehmen: Abwasch, Wäsche, Einkauf.',
      'Keine großen Pläne machen. Lieber fragen, worauf sie Lust hat.',
      'Eine Rückenmassage oder Bauch wärmen hilft oft bei Krämpfen.',
      'Essen bestellen oder etwas Warmes kochen, zum Beispiel Suppe oder Pasta.',
    ],
    dates: [
      'Sofa-Abend mit Decke, Film oder Serie und Essen vom Lieblingsladen.',
      'Gemütliches Frühstück im Bett.',
      'Hörbuch oder Podcast zusammen hören.',
    ],
    avoid: [
      'Heute kein guter Tag für Sport-Dates oder volle Terminkalender.',
      'Spontanbesuch von Freunden lieber vorher abstimmen.',
    ],
  },
  follicular: {
    name: 'Follikelphase',
    short: 'Aufwind',
    color: 'var(--c-foll)',
    energy: 4,
    summary: 'Energie steigt, Lust auf Neues.',
    mood: [
      'Energie kommt zurück, die Stimmung wird meist leichter und optimistischer.',
      'Gute Zeit für Neues: offen, neugierig, gesellig.',
      'Oft motiviert und unternehmungslustig.',
    ],
    cravings: 'Weniger Heißhunger, eher Lust auf Frisches: Salate, Obst, leichte Küche.',
    tips: [
      'Neue Dinge vorschlagen: ein Restaurant, das ihr noch nicht kennt.',
      'Pläne schmieden: Wochenendtrip, Konzertkarten, Urlaub.',
      'Gemeinsam Sport machen: Laufen, Radtour, Bouldern.',
      'Freunde einladen oder zusammen ausgehen.',
      'Ein Projekt starten, das ihr schon länger aufschiebt.',
    ],
    dates: [
      'Etwas Neues ausprobieren: Kochkurs, Töpfern, Escape Room.',
      'Bouldern oder Klettern, danach Burger.',
      'Ausstellung oder Markt in einer Stadt in der Nähe.',
      'Kurztrip planen und buchen.',
    ],
    avoid: [
      'Wenig zu beachten. Gute Zeit, auch schwierigere Themen anzusprechen.',
    ],
  },
  ovulation: {
    name: 'Eisprung',
    short: 'Hoch',
    color: 'var(--c-ovu)',
    energy: 5,
    summary: 'Höchste Energie, gesellig, Lust auf Nähe.',
    mood: [
      'Meist am energiegeladensten des ganzen Zyklus: selbstbewusst und kommunikativ.',
      'Oft mehr Lust auf Nähe und Zweisamkeit.',
      'Strahlt häufig richtig. Guter Moment für Komplimente.',
    ],
    cravings: 'Appetit eher gering. Leichtes Essen, viel trinken.',
    tips: [
      'Komplimente machen, ehrlich und konkret.',
      'Die große Date Night planen.',
      'Zeit zu zweit einplanen, Handy weglegen.',
      'Große Gespräche und Zukunftspläne passen jetzt gut.',
    ],
    dates: [
      'Schickes Restaurant und danach eine Bar.',
      'Konzert, Theater oder Tanzen gehen.',
      'Rooftop-Abend oder Picknick zum Sonnenuntergang.',
      'Party oder Abend mit Freunden.',
    ],
    avoid: [
      'Kaum etwas. Höchstens: den Abend nicht verplanen, falls sie Lust auf Zweisamkeit hat.',
    ],
  },
  luteal: {
    name: 'Lutealphase',
    short: 'Gemütlich',
    color: 'var(--c-lut)',
    energy: 3,
    summary: 'Ausgeglichen, eher nach innen gewandt.',
    mood: [
      'Meist ausgeglichen, aber die Energie sinkt langsam.',
      'Lust auf Routine und Gemütlichkeit wird größer.',
      'Eher nach innen gewandt, braucht mehr Ruhe als letzte Woche.',
    ],
    cravings: 'Hunger steigt, Lust auf Kohlenhydrate: Brot, Pasta, Kartoffeln.',
    tips: [
      'Zusammen kochen, etwas Sattmachendes.',
      'Gemütliche Routinen pflegen: Spaziergang, Serie, früh ins Bett.',
      'Kleine Aufmerksamkeiten: Blumen, ein Zettel, ihr Lieblingskaffee.',
      'Jetzt schon Vorräte für die nächsten Wochen auffüllen.',
    ],
    dates: [
      'Kochabend zu Hause mit neuem Rezept.',
      'Spieleabend oder Puzzle.',
      'Ruhiger Spaziergang mit Kaffee to go.',
      'Kino mit Popcorn.',
    ],
    avoid: [
      'Volle Wochenenden lieber entzerren.',
    ],
  },
  pms: {
    name: 'PMS-Phase',
    short: 'Sanft',
    color: 'var(--c-pms)',
    energy: 2,
    summary: 'Empfindlicher, braucht Verständnis und Snacks.',
    mood: [
      'Kann empfindlicher sein, schneller gereizt oder traurig. Das ist hormonell, nicht persönlich.',
      'Braucht eher Verständnis als Lösungen.',
      'Schlaf kann schlechter sein, die Geduld kürzer.',
    ],
    cravings: 'Starker Heißhunger auf Süßes und Salziges. Blähgefühl und Brustspannen sind häufig.',
    tips: [
      'Geduld haben und nichts persönlich nehmen.',
      'Snacks bereithalten: dunkle Schokolade, Nüsse, Chips, Bananen.',
      'Aufgaben abnehmen, bevor sie fragen muss.',
      'Zuhören statt Lösungen anbieten.',
      'Konflikte vertagen, wenn es geht. Nicht eskalieren lassen.',
      'Eine Massage oder ein warmes Bad anbieten.',
    ],
    dates: [
      'Wellness: Sauna, Therme oder ein Spa-Abend zu Hause.',
      'Ihr Lieblingsessen bestellen und früh schlafen.',
      'Kuscheln und eine Wohlfühlserie.',
    ],
    avoid: [
      'Heute kein guter Tag, um Streitthemen oder Urlaubsplanung auszudiskutieren.',
      'Kritik und Sticheleien lieber lassen, auch im Spaß.',
    ],
  },
};

export const PHASE_ORDER = ['menstruation', 'follicular', 'ovulation', 'luteal', 'pms'];

export function pick(list, seed) {
  return list[((seed % list.length) + list.length) % list.length];
}
