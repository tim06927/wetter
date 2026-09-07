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

Pruefen:

```bash
resolvectl query -t A wetter.timklausmann.de
resolvectl query -t AAAA wetter.timklausmann.de
ip -brief addr
curl -I https://wetter.timklausmann.de
journalctl -u caddy -n 80 --no-pager
```

Wenn FlexDNS nur einen `AAAA`-Record veroeffentlicht, muss genau diese IPv6 am
Homeserver oder am Router ankommen. Wenn die veroeffentlichte IPv6 nicht zu den
Adressen aus `ip -brief addr` passt, ist der DNS-Eintrag stale oder der
FlexDNS-Updater nutzt die falsche Adresse. Dann entweder den `AAAA`-Record
korrigieren, IPv6-Forwarding/Firewall reparieren oder zusaetzlich einen
erreichbaren `A`-Record fuer die oeffentliche IPv4 setzen.

### Vorhandenen FlexDNS-Updater Reparieren

Auf diesem Homeserver gibt es bereits systemd-Updater fuer do.de FlexDNS. Wenn
diese nach einem Neustart mit `No global /128 IPv6 found on enp3s0` scheitern,
ist die alte IPv6-Erkennung zu eng. Der neue Updater in
`deploy/flexdns/update-flexdns-do` ermittelt die aktuelle, von aussen sichtbare
IPv6 zuerst ueber externe Echo-Dienste und faellt erst danach auf die lokale
Routing-Quelle zurueck.

Installieren:

```bash
sudo ./scripts/install_flexdns_external_ipv6.sh
sudo systemctl start flexdns-cv.service
journalctl -u flexdns-cv.service -n 30 --no-pager
dig @ns1.domainoffensive.de wetter.timklausmann.de AAAA +short
```

Ein bewusstes Update trotz unveraenderter lokal gemerkter IPv6 ist moeglich mit:

```bash
sudo FLEXDNS_FORCE_UPDATE=1 /usr/local/sbin/update-flexdns-cv
```

Der Installer ersetzt nur die vorhandenen lokalen Update-Skripte unter
`/usr/local/sbin/`, legt Backups mit Zeitstempel an und reduziert die Timer auf
kurze Intervalle. Zugangsdaten bleiben weiter in den geschuetzten Dateien unter
`/etc`.

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
