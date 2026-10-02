# Working on lmformat

`@lmctl-ai/lmformat` turns small, fully loaded datasets into readable CLI output.
It owns reusable display mechanics; callers own headings, column order, labels,
width choices, and domain decisions. Add display capability here rather than
copying formatters into consumers. This is a formatter, not a terminal UI:
no multiline cell wrapping, colour/ANSI styling, or frames.

**Protected:** Keep zero dependencies. These helpers must remain inexpensive to
vendor into multiple CLIs; do not introduce a rendering framework for a local need.

## Collaboration

New agents join the existing maintainers. Codex, the existing lmformat agent,
remains available for design context and the reasoning behind earlier tradeoffs.
Ask when that context would help; routine work should not require a session
handoff. Coordinate edits in shared files before overlapping work, and record
new durable decisions here so the next colleague can work independently too.

## Where to work

[index.js](../index.js) implements the public functions and shared display-width,
padding, and truncation helpers. [index.d.ts](../index.d.ts) is the public TypeScript
contract; change it alongside runtime options. CommonJS and named ESM imports are
both supported. The surface has three parts:

- Tables: `measureColumns` / `renderGrid` for shared layouts;
  `formatTable` / `printTable` for a single table.
- Scalar formatting: compact counts, durations, relative/absolute timestamps,
  percentages, bars, and timers.
- `escapeCell`: sanitize untrusted text before passing it to strict table APIs.
  Table APIs reject control characters, tabs, newlines, and ANSI escape sequences
  (throwing `TypeError`); callers must escape external text (e.g. error messages)
  before formatting.

Tests mirror those areas in [test/](../test/); [examples/](../examples/) shows real
session and rate-limit reports. See [README](../README.md) for signatures and
examples, and [design_checklist.md](design_checklist.md) for the ecosystem's
presentation conventions. Those conventions are caller guidance, not reasons
to hard-code application policy in this library.

## Decisions that are easy to get wrong

**Protected:** Existing defaults stay unchanged when capabilities are added.
Opt-in controls let consumers adopt new presentation deliberately; changing a
default silently changes every report. Bar glyphs illustrate this: `fill`,
`empty`, and `unknown` are selectable, but still default to `#`, space, and `?`.
Custom bar glyphs occupy one terminal column so width remains meaningful.

**Protected:** Keep measurement separate from rendering. Several report sections
need one shared grid even though headings and blank lines sit between them.
Measure their rows/headers together, then render each section with that result.
Measured width is a useful default, not a policy decision. To pin one column:

```js
const widths = measureColumns([runningRows, idleRows]);
widths[1] = 20;
renderGrid(runningRows, { widths });
renderGrid(idleRows, { widths });
```

This already supports narrowing or widening one column. Do not reintroduce a
sparse-width API: it was proposed and explicitly withdrawn as unnecessary.
`max` caps measurement; `renderGrid` rejects `widths` together with `max`.
There is no statistical outlier trimming: the caller decides what needs a cap.

**Protected:** The last populated cell of each row is open-ended by default,
including ragged and single-column rows. It often contains the free text users
need; silently truncating it loses information. `truncateTrailing: true` opts
into bounding it by its column width. `truncate: false` disables all truncation.
Left-aligned trailing cells stay unpadded; right alignment still pads on the left.
Terminal wrapping can occur naturally, but this library never creates wrapped
multiline cells. Reordering columns is another caller-side layout choice.

**Protected:** Reuse terminal display-width logic, not JavaScript string length.
CJK/emoji and combining marks must not shift later columns. The approximation
is documented; it is not full grapheme layout. `ellipsis` defaults to `…`, and
`''` intentionally requests a hard cut. An oversized mark falls back to `…`:
therefore `'...'` does not guarantee ASCII-only output in narrow columns.

Keep README examples verified against actual output. Example blocks serve as
reference output that newcomers and consumers trust; character-level spacing
mismatches in table examples mislead readers about column alignment and padding.

## Decimal alignment

`align: 'decimal'` is opt-in for decimal notation and optional dollar prefixes.
Share both `measureDecimalPlaces(grids)` and `measureColumns(grids, { align,
decimalPlaces })` across sections. Headers and nonnumeric text right-align normally.
Never convert numeric strings through Number or add precision: padding preserves
literal input. Existing left/right defaults, width caps and open-ended tails stay
unchanged; too-narrow widths fall back to ordinary right alignment.

## Make and verify a change

```sh
npm ci
npm test
npm run check
npm run example
npm run example:ratelimit
npm run build
```

The build packages plain JavaScript and declarations into `release/`; it does
not transpile. It checks the package's file allowlist. Add behavioral tests for
new options and assertions that omitted options preserve existing output. For
table changes, cover headers, ragged rows, trailing cells, alignment, Unicode,
and interaction with truncation. Check TypeScript consumers as well as runtime.

**Protected:** Consumer tests must use the changed artifact. Sibling `lmctl-src`
(at `../lmctl-src`) vendors a `.tgz`; editing this checkout cannot change its
installed dependency. Pack the candidate, then test with that tarball installed
in an isolated consumer checkout, or explicitly alias its extracted runtime and
declarations in a temporary test/typecheck configuration. Key CLI suites can be run
via `npm --prefix ../lmctl-src test -- tests/cli/running.test.ts tests/cli/ratelimit.test.ts tests/cli/status.test.ts`.
Check running, rate-limit, status, and listing output assertions; do not refresh
expected output to hide a default drift. Run the consumer's full suite before
accepting a dependency update, and distinguish pre-existing failures from regressions.
Report which artifact was exercised.

lmbee adoption is coordinated by `refact-kimi`; the sibling `lmauto` repository
also vendors lmformat. Coordinate the candidate with that owner, test its affected
reports and full suite before re-vendoring, and keep consumer tarballs/lockfiles
consistent. Do not assume identical version labels mean identical local tarballs.
`lmctl-src` must remain unpushed under the operator's rule; hand off its changes.

## Delivering work

Commit with an intent-first message and useful Lore trailers (`Tested:`,
`Not-tested:`, `Constraint:`). Preserve unrelated work. Push lmformat changes when
the task calls for delivery; report actual checks and remaining gaps.
Git tags trigger npm publication, so a source push is not a release. For release
work, use the [README publishing guide](../README.md#publishing) and existing
[workflows](../.github/workflows/); verify the artifact/version rather than
overwriting an already distributed version. Never commit prompt files, trial logs
(e.g. `durable-memory/*.log`), or credentials.
