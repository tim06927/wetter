# Wetterballon-Fluglabor

Statische Web-App zur Erkundung der Wetterballon-Telemetrie eines
Schuelerstarts. Die erste Version laeuft komplett im Browser, nutzt Vite mit
TypeScript und braucht in Produktion keinen eigenen Node-Server.

Die App laedt diese oeffentlichen Datendateien:

- `public/data/data_some_cleaning.csv`
- `public/data/ozon.txt`
- `public/data/geiger.txt`

Alle im Frontend sichtbaren Texte sollen auf Deutsch sein.

## Projektstatus

- GitHub: <https://github.com/tim06927/wetter>
- Standardbranch: `main`
- CODEOWNERS ist fuer `@tim06927` eingerichtet.
- Produktion: statische Caddy-Auslieferung aus `/srv/wetter/current`.
- Oeffentliche Domain: `wetter.timklausmann.de`

## Lokal Entwickeln

Voraussetzung: Node.js 24 oder neuer.

```bash
npm install
npm run dev
```

Dann die Vite-Vorschau oeffnen:

```text
http://localhost:5173
```

## Entwicklung Mit GitHub Codespaces

Schuelerinnen und Schueler koennen ohne Zugriff auf den Homeserver in GitHub
Codespaces arbeiten:

```bash
npm run dev
```

Der Codespace startet mit Node 24 und installiert die Abhaengigkeiten nach dem
Anlegen automatisch. Aenderungen sollen ueber kleine Pull Requests in `main`
kommen.

## Pruefen

Vor einem Pull Request:

```bash
npm run check
npm run build
```

`npm run check` prueft TypeScript. `npm run build` erzeugt die statische
Produktionsversion in `dist/`.

## Hosting Auf Dem Homeserver

Die Produktionsseite sollte statisch von Caddy aus `/srv/wetter/current`
ausgeliefert werden. Das ist absichtlich kein `reverse_proxy` auf einen
studentisch veraenderbaren Entwicklungsserver.

Build erstellen:

```bash
npm run build
```

Build nach `/srv/wetter/releases/...` installieren und den Symlink
`/srv/wetter/current` aktualisieren:

```bash
sudo ./scripts/install_static_site.sh
```

Danach den Site-Block aus [deploy/Caddyfile.example](./deploy/Caddyfile.example)
in `/etc/caddy/Caddyfile` einfuegen, Domain anpassen, Caddy validieren und neu
laden:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## DNS-Hinweis Fuer FlexDNS

`wetter.timklausmann.de` muss auf eine Adresse zeigen, ueber die dieser
Homeserver von aussen auf Port `80` und `443` erreichbar ist. Die App selbst
braucht keinen offenen Entwicklungsport und keinen `reverse_proxy`.

FlexDNS/DDNS ist Server-Infrastruktur und wird nicht in diesem App-Repo
verwaltet. Der zentrale Updater liegt lokal unter:

```text
~/git/flexdns
```

Pruefen:

```bash
resolvectl query -t AAAA wetter.timklausmann.de
curl -I https://wetter.timklausmann.de
journalctl -u caddy -n 80 --no-pager
```

Wenn DNS nicht zur aktuellen externen IPv6 passt, zuerst den zentralen
FlexDNS-Updater in `~/git/flexdns` pruefen. Das Wetter-Projekt enthaelt keine
FlexDNS-Zugangsdaten und installiert keine DDNS-Dienste.

## Maintainer-Aufgaben

Erledigt:

- GitHub-Repository angelegt: <https://github.com/tim06927/wetter>
- CODEOWNERS fuer `@tim06927` eingerichtet.
- Caddy-Site-Block fuer `wetter.timklausmann.de` eingetragen.
- Deployment-Pfad `/srv/wetter/current` eingerichtet.

Noch offen:

- Branch Protection fuer `main` aktivieren.
- Lehrkraft und Schuelerinnen/Schueler einladen oder Fork/PR-Workflow klaeren.
- DNS/HTTPS fuer `wetter.timklausmann.de` von aussen testen.
- Optional spaeter Deployment automatisieren, aber ohne Server-Zugriff fuer
  Schuelerinnen und Schueler.
