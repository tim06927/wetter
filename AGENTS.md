# AI Contributor Rules

This project is for students learning real coding with AI assistance.

- Keep the production site static. Do not add a backend, database, server-side API, login system, or deployment secret without maintainer review.
- Do not commit API keys, passwords, tokens, cookies, or private keys.
- Treat files in `public/data/` as public once the site is published.
- Keep changes small enough to review in a pull request.
- Run `npm run check` and `npm run build` before requesting review.
- Prefer readable TypeScript modules over clever abstractions.
- Keep all user-facing frontend text in German.
- Add comments only when they explain science, units, or non-obvious math.

Good first tasks:

- Add a descent-rate chart from altitude differences over time.
- Mark the apogee on the time-series chart.
- Connect ozone readings to the nearest flight timestamp.
- Convert Geiger clicks into clicks per minute.
- Add a unit explanation panel for pressure, humidity, and UVA index.
