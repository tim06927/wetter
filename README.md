# Wetterballon-Fluglabor

Statische Web-App zur Erkundung der Wetterballon-Telemetrie eines
Schuelerstarts. Die erste Version laeuft komplett im Browser, nutzt Vite mit
TypeScript und braucht in Produktion keinen eigenen Node-Server.

Die App laedt diese oeffentlichen Datendateien:

- `public/data/data_some_cleaning.csv`
- `public/data/ozon.txt`
- `public/data/geiger.txt`

Alle im Frontend sichtbaren Texte sollen auf Deutsch sein.

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

## Maintainer-Aufgaben

- GitHub-Repository anlegen und Sichtbarkeit festlegen.
- Echte GitHub-Nutzernamen in `.github/CODEOWNERS` eintragen.
- Branch Protection fuer `main` aktivieren.
- Domain/Subdomain im DNS auf den Homeserver zeigen lassen.
- Caddy-Site-Block fuer die gewaehlte Domain eintragen.
- Optional spaeter Deployment automatisieren, aber ohne Server-Zugriff fuer
  Schuelerinnen und Schueler.
