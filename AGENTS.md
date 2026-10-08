# Start here

Read [developer onboarding](durable-memory/developer_onboard.md) before editing;
[durable-memory/](durable-memory/) holds the design rationale. Use
[examples/](examples/) and the [README](README.md) for contracts and release steps.

**Protected:** New display behavior is opt-in; existing defaults must not move.
Keep zero dependencies, terminal display-width measurement, and the last populated
cell open-ended by default. No multiline wrapping, colour, or frames. Callers own
layout policy. Explicit widths belong to `renderGrid`, not `formatTable`/`printTable`.
Read the [layout traps](durable-memory/developer_onboard.md#decisions-that-are-easy-to-get-wrong)
and [decimal rules](durable-memory/developer_onboard.md#decimal-alignment): fractional
padding preserves precision, but ordinary width truncation can still shorten values.

Table APIs intentionally reject control characters; escape untrusted cells with
`escapeCell` at the caller boundary. Keep `index.js` and `index.d.ts` consistent.

## Repository relationships

lmformat depends on **no other project repository** and has no npm dependencies.
Node.js 18+ supplies its runtime and test runner. These are downstream consumers,
not prerequisites for building lmformat:

- **`lmctlhq/lmctl-mono` — `/home/mma/repos/lmctlhq/lmctl-mono`. This is the LIVE consumer**, and it
  vendors lmformat TWICE, at DIFFERENT versions, so a change must be verified against both:
  - `lmbee/package.json` -> `"@lmctl-ai/lmformat": "file:vendor/lmctl-ai-lmformat-0.13.0.tgz"`
  - `lmctl-src/package.json` -> `"@lmctl-ai/lmformat": "file:vendor/lmctl-ai-lmformat-0.14.0.tgz"`
- The standalone checkouts are NOT where to verify any more (corrected 2026-10-08 by math.lmctl):
  - `/home/mma/repos/lmauto` — its GitHub repo is **ARCHIVED and read-only** (`gh repo view
    lmctlhq/lmauto --json isArchived` -> `true`; a push answers 403). Its content moved into
    lmctl-mono. Verifying here proves nothing can ship.
  - `/home/mma/repos/lmctl-src` — slated for deletion; the live tree is `lmctl-mono/lmctl-src/`.
    Nobody should be working in the standalone checkout.

**Protected:** Consumer verification must install the changed tarball in an
isolated checkout; editing lmformat does not update vendored packages. Follow the
[consumer verification guidance](durable-memory/developer_onboard.md#make-and-verify-a-change).
Respect each consumer's Node/devEngines requirement. Do not push `lmctl-src`:
the operator requires a local handoff.

## Delivery traps

- Work intended for newcomers must reach `main`, the default branch.
- Run `npm test` and `npm run check`. `npm run build` creates a checked tarball;
  it does not transpile. Do not run `node scripts/build.js` directly: it needs
  `npm_execpath` supplied by npm.
- A source push is not an npm release. Publishing requires the matching
  `v<package version>` tag; see [publishing](README.md#publishing).
- Never commit prompt files, trial logs, or credentials. Preserve unrelated work.
