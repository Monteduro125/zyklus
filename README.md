# Zyklus

Ein schlanker Periodentracker aus Partner-Sicht. Du trägst den Periodenstart ein, die App berechnet die Zyklusphasen und gibt jeden Tag einen Tipp: Stimmung, Energie, Cravings, Date-Ideen. Dazu gibt es einen Kalender für die nächsten Monate und einen Urlaubsplaner.

Alle Daten bleiben im Browser auf deinem Gerät. Es gibt kein Konto, keinen Server, keine Werbung und keine Analyse-Tools.

## Funktionen

- **Heute:** Zyklustag, Phase, Energie, Tipp des Tages, Date-Idee, Vorschau auf die nächsten 7 Tage.
- **Kalender:** Phasen farbig für den letzten und die nächsten 6 Monate. Tippe auf einen Tag, um Details zu sehen oder einen Start nachzutragen.
- **Urlaub:** Vorschläge für Reisezeiträume ohne Periode und Prüfung eigener Zeiträume.
- **Wiki:** Je Phase ein kurzer Satz zu Stimmung, Energie, Stress und Reizbarkeit, Sport, Appetit, Schlaf, Nähe, Körper und Gesprächen.
- **Verlauf:** Alle Einträge, ändern, löschen, ältere Perioden nachtragen.
- **Optionen:** Zykluslänge und Periodendauer automatisch oder fest, Backup speichern und laden.

## So rechnet die App

- Die Zykluslänge ist der gewichtete Durchschnitt der letzten 6 Zyklen. Neuere Zyklen zählen stärker, Ausreißer über 7 Tage Abstand zum Median werden ignoriert.
- Solange weniger als drei Perioden eingetragen sind, gelten die Startwerte (28 Tage Zyklus, 7 Tage Periode).
- Der Eisprung wird rückwärts vom erwarteten nächsten Start gezählt (Zykluslänge minus 14).
- Phasen bei 28 Tagen: Periode Tag 1 bis 7, Follikelphase bis Tag 12, Eisprung Tag 13 bis 15, Lutealphase bis Tag 21, PMS-Phase Tag 22 bis 28.

Die Tipps beschreiben typische Tendenzen und sind keine medizinische Beratung. Die App ist nicht zur Verhütung geeignet.

## Installieren auf Android

1. Die App über GitHub Pages öffnen (siehe unten).
2. In Chrome auf ⋮ tippen und „App installieren“ wählen.

## Veröffentlichen mit GitHub Pages

Unter **Settings → Pages** als Quelle „Deploy from a branch“, Branch `main` und Ordner `/ (root)` wählen. Nach etwa einer Minute ist die App unter `https://<dein-name>.github.io/<repo>/` erreichbar.

## Entwicklung

Kein Build-Schritt. Lokal starten mit `python3 -m http.server` und `http://localhost:8000` öffnen. Tests der Zykluslogik: `npm test` (Node 20 oder neuer).

Nach Änderungen an Dateien die Cache-Version in `sw.js` erhöhen, damit installierte Apps das Update laden.
