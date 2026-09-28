# Start here

- Read [developer onboarding](durable-memory/developer_onboard.md) before taking a task.
- Read [durable design guidance](durable-memory/) and the [CLI output checklist](durable-memory/design_checklist.md).
- Use [examples](examples/) for runnable output and the [README](README.md) for API and release details.

**Protected:** Preserve the onboarding guide's protected invariants: display changes
are opt-in, dependencies stay at zero, and the trailing cell stays open-ended by
default. These protect consumer output; do not "simplify" them away.

Verify consumers against the changed package, not their old vendored copy. Do not
push `lmctl-src`; its operator requires a local handoff.
