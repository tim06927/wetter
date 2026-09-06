# Contributing

## Student Workflow

1. Open the repository in GitHub Codespaces.
2. Run `npm run dev`.
3. Open the forwarded `5173` preview.
4. Create a branch for one small task.
5. Ask AI for help, but read the code it writes.
6. Run `npm run check` and `npm run build`.
7. Open a pull request.

## Review Rules

- Pull requests should focus on one idea.
- Do not merge if the build fails.
- Do not change `.github/`, `deploy/`, or dependency files without maintainer review.
- Never paste secrets into source files or workflow logs.

## Data Notes

The logger CSV in `public/data/` contains metadata before the real table. The
app looks for the header row beginning with `Uptime [s];` and parses
semicolon-separated telemetry from there.
