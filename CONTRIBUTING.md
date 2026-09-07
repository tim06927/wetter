# Mitmachen

## Arbeitsablauf Fuer Schuelerinnen Und Schueler

1. Repository in GitHub Codespaces oeffnen.
2. Im Terminal `npm run dev` starten.
3. Die weitergeleitete Vorschau fuer Port `5173` oeffnen.
4. Fuer eine kleine Aufgabe einen eigenen Branch erstellen.
5. KI als Hilfe nutzen, aber den erzeugten Code selbst lesen und verstehen.
6. Vor dem Pull Request `npm run check` und `npm run build` ausfuehren.
7. Pull Request oeffnen und kurz beschreiben, was geaendert wurde.

## Review-Regeln

- Pull Requests sollen jeweils nur eine Idee oder Aufgabe enthalten.
- Nicht mergen, wenn `npm run check` oder `npm run build` fehlschlaegt.
- `.github/`, `deploy/`, `package.json` und `package-lock.json` nur mit
  Maintainer-Review aendern.
- Keine API-Keys, Passwoerter, Tokens, Cookies oder privaten Schluessel in Code,
  Kommentare, Screenshots oder Workflow-Logs einfuegen.
- Alle im Frontend sichtbaren Texte muessen Deutsch sein.

## Datenhinweise

Die Logger-CSV in `public/data/` enthaelt Metadaten vor der eigentlichen
Tabelle. Die App sucht die Kopfzeile, die mit `Uptime [s];` beginnt, und liest
danach die semikolongetrennte Telemetrie.

Dateien in `public/data/` gelten nach dem Veroeffentlichen als oeffentlich.
