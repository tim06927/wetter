# Weather Balloon Flight Lab

A static web app for exploring weather balloon telemetry from a student launch.

The first version runs directly in the browser and loads:

- `data_some_cleaning.csv`
- `ozon.txt`
- `geiger.txt`

## Local Preview On This Server

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Student Development

Students can work in GitHub Codespaces:

```bash
npm run dev
```

The app uses plain JavaScript modules with TypeScript checking through JSDoc.
This keeps the code readable while still catching basic mistakes.

## Production Shape

Production should serve static files only through Caddy. No student-written
server process needs to run on the home server.

```caddyfile
balloon.example.com {
    root * /srv/wetter/current
    encode zstd gzip
    file_server

    header {
        Strict-Transport-Security "max-age=31536000"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
    }
}
```

## What Maintainers Need To Configure

- GitHub repository name and visibility.
- Real usernames in `.github/CODEOWNERS`.
- Branch protection for `main`.
- Public domain or subdomain for Caddy.
- A deployment path, recommended: `/srv/wetter/current`.
