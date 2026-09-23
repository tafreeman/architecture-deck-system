# Security policy

## Supported code

Security fixes go to the default branch (`main`). Older commits and tagged
releases have no guaranteed support window.

## Scope

Architecture Deck System is a client-side React application with no backend.
Decks are JSON content packs rendered in the browser, and the published demo on
GitHub Pages is a static build. The export scripts in `scripts/` (image, PDF
and single-file HTML) run locally against your own build.

In scope: script injection through deck content or layouts, the export
scripts, the Pages build, and the dependency tree in `package-lock.json`.

## Report a vulnerability

Do not open a public issue for a suspected vulnerability.

Use a private
[GitHub Security Advisory](https://github.com/tafreeman/architecture-deck-system/security/advisories/new).
If that path is unavailable, contact the maintainer privately and ask for a
secure reporting channel. Do not send exploit details, credentials, or private
data through a public issue.

Include:

- the affected file, layout, or commit;
- minimal reproduction steps or a proof of concept;
- the expected and observed behavior; and
- the impact, and a suggested mitigation if you have one.

The maintainer will confirm receipt, assess severity, coordinate a fix, and
agree on disclosure timing with the reporter. This is a single-maintainer
project with no published response time.
