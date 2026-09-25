# lmformat

Dependency-free Node.js library for automatically sized, left-aligned CLI tables.
Install with `npm install @lmctl-ai/lmformat`.

Pass an array of rows; each row is an array of cells. No column widths are needed.

```js
const { formatTable, printTable } = require('@lmctl-ai/lmformat');
// ESM also supports: import { formatTable, printTable } from '@lmctl-ai/lmformat';

const rows = [
  ['triage.lmctl', 'Triage', 'done', '25s'],
  ['math.lmctl', 'Lead', 'done', '2s'],
];
printTable(rows, { headers: ['team', 'alias', 'status', 'time spent'] });
```

```text
team          alias   status  time spent
triage.lmctl  Triage  done    25s
math.lmctl    Lead    done    2s
```

`formatTable(rows, { headers }?)` returns a string without a final newline.
`printTable(rows, { headers, stream }?)` writes it with a final newline to
`process.stdout` or a supplied writable stream. Empty output writes nothing.
Headers are optional. You can also include a header as the first row.

All rows are loaded before formatting. Each column takes the maximum cell length
across headers and data; cells are right-padded with spaces and columns have a
two-space gap. Trailing empty cells add no padding. Ragged rows are accepted;
`null`, `undefined`, and missing cells become empty strings. Other values use
`String(value)`. Inputs are not modified and long text is never truncated or wrapped.

Cells must be plain single-line text: tabs, newlines, ANSI escape sequences, and
other terminal control characters are rejected. Widths use JavaScript string
length, suitable for ASCII and the supplied session data. Wide Unicode characters,
emoji, and combining marks may not align by terminal display width. A terminal
narrower than the output may wrap lines.

Requires Node.js 18 or newer. Run `npm test` for alignment tests, `npm run check`
for syntax checks, and `npm run example` for the complete session example.

## Relative timestamps

```js
const { formatRelativeTime, printTable } = require('@lmctl-ai/lmformat');
const now = '2026-09-25T20:00:00Z'; // Omit to use Date.now().
printTable([
  ['weekly', formatRelativeTime('2026-09-28T20:00:00Z', { now })],
  ['session', formatRelativeTime('2026-09-25T20:40:00Z', { now })],
  ['missing', formatRelativeTime('unknown', { now })],
], { headers: ['limit', 'resets in'] });
// weekly   3d
// session  40m
// missing  unknown
```

`formatRelativeTime(timestamp, { now }?)` accepts a Date, an epoch timestamp in
milliseconds, or a date string accepted by `Date.parse`. Prefer ISO 8601 strings
with an explicit timezone. It returns the largest whole unit (`d`, `h`, `m`, `s`),
rounding down: 2 days and 20 hours becomes `2d`. Days mean 24 hours.
Future timestamps return `3d`; past timestamps return `3d ago`; differences below
one second return `now`. Missing or invalid timestamps return `unknown`.
An invalid explicit `now` throws a TypeError. Capture `now` once when formatting
multiple timestamps so the report uses a consistent reference time.

Run `npm run example:ratelimit` for the supplied provider and rate-limit data,
including read ages, reset countdowns, credits, and exhausted status. This example
uses the fixed snapshot time `2026-09-25T20:33:47Z` for reproducible output.
Transform timestamp cells before passing rows to the table formatter; widths
are calculated from the resulting text automatically.

MIT licensed. Project homepage: [lmctl.com](https://lmctl.com).

## Publishing

CI builds and tests pushes to `main` and pull requests on Node 18, 20, 22, and 24.
It also installs the built tarball and checks CommonJS and ESM imports.
`npm run build` checks syntax and produces `release/lmctl-ai-lmformat-VERSION.tgz`.
Only the library, package metadata, README, and license are included.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
from GitHub Actions with provenance. No npm token is stored in GitHub.

One-time setup by an npm account with access to the `@lmctl-ai` scope:

1. Run `npm login`, then `npm ci && npm test && npm run build` and
   `npm publish ./release/lmctl-ai-lmformat-0.1.0.tgz --access public` to create
   the first package version. Complete npm's authentication/2FA prompt if requested.
2. On npmjs.com, open `@lmctl-ai/lmformat` → Settings → Trusted Publisher and
   select GitHub Actions. Set organization to `lmctl-ai`, repository to `lmformat`,
   and workflow filename to `publish.yml`. Leave environment blank and allow
   direct publishing (`npm publish`).
3. Subsequent versions publish automatically when their matching version tag is
   pushed. The workflow tests and builds again before publishing with provenance.

For example, after committing changes on `main`:

```sh
npm version patch -m 'Release %s for npm consumers'
git push origin main
git push origin --tags
```

The tag must equal `v` plus the version in `package.json`. A tag for an already
published version cannot republish it. No version is changed by CI itself.
For a build and publish dry run, use the Publish workflow's **Run workflow** button
with `dry_run` checked. To retry an unpublished tagged version, select that tag
and uncheck `dry_run`. Real manual publishes from branch refs are rejected.
