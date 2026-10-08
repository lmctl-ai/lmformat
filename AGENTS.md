# Start here

Read [developer onboarding](durable-memory/developer_onboard.md) before editing;
[durable-memory/](durable-memory/) holds the design rationale. Use
[examples/](examples/) and the [README](README.md) for contracts and release steps.

**Protected:** New display behavior is opt-in; existing defaults must not move.
Keep zero dependencies, terminal display-width measurement, and the last populated
cell open-ended by default. No multiline wrapping, colour, or frames. Callers own
layout policy. The onboarding guide explains width overrides, trailing truncation,
and shared decimal alignment; do not replace these with new implicit policies.

Table APIs intentionally reject control characters; escape untrusted cells with
`escapeCell` at the caller boundary. Keep `index.js` and `index.d.ts` consistent.

## Repository relationships

lmformat depends on **no other project repository** and has no npm dependencies.
Node.js 18+ supplies its runtime and test runner. These are downstream consumers,
not prerequisites for building lmformat:

- `mikema3/lmctl-src` — `/home/mma/repos/lmctl-src`.
- `lmctlhq/lmauto` (including lmbee work) — `/home/mma/repos/lmauto`.

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
