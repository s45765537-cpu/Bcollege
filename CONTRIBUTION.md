# Contributing merge requests

The MR template ([`.gitlab/merge_request_templates/default.md`](.gitlab/merge_request_templates/default.md)) has checkboxes for changelog title, self-review, linking work, CI/checks, manual testing, screenshots, docs, breaking changes, and credits. This file has command-line and workflow detail.

## MR title and changelog

The merge request **title** is reused in release changelog entries. Prefer a **clear, short, user-facing** line.

- Asset-heavy changes: something like `Adds new items: glorb and foo` is enough.
- Put implementation notes, file lists, and edge cases in the **MR description**, not the title.

If the change bundles work from multiple people or combined projects, say so in the description and credits.

## Checks before opening

A bot runs checks on incoming merge requests when it can. On GitGud it is **whitelist-based**, so **new contributors may not get CI automatically**. Running the same checks locally avoids surprises.

From a shell, with **Node.js 20+** installed:

```sh
cd BondageClub
npm install
npm run checks
```

This mirrors what CI runs: asset configuration, scripts linting, whitespace-related checks, and related tooling output.

### Fixing common whitespace / lint issues

Many reported issues can be auto-fixed:

```sh
cd BondageClub
npm run assets:lint:fix scripts:lint:fix
```

Then review `git diff` and commit the fixes.

### Help

If a check fails and the message is unclear, or you cannot run Node locally, ask in **Bondage Club’s `#programming` Discord channel**.

## Related docs

- Git / fork workflow for newcomers: [`Markdown/Contribute.md`](Markdown/Contribute.md)
