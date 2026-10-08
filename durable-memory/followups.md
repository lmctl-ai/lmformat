# Deferred maintenance

- Consider ignoring `durable-memory/*.log` to reduce accidental staging of trial
  output. The current no-log-commits policy is intentional but is not enforced by
  `.gitignore`. Record this as a separate change; the onboarding audit only edited
  documentation and left the existing untracked trial log untouched.
