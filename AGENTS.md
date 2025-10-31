# Repository Guidelines

## Project Structure & Module Organization
- `index.html` is the simulator shell that wires Bootstrap, CodeMirror, and `assets/js/TagRugby-core.js`.
- `AI/` stores behaviour presets (`AI0.js`, `AI5.js`, etc.) plus their coordinate seeds under `pos_AI*`. Add new playbooks next to the current numbering so the dropdown continues to map correctly.
- `assets/` hosts vendor code (`codemirror/`), theme files in `css/`, sprites in `img/`, and the shared engine under `js/`.
- `automatch.php` and `upload.php` back file upload flows; leave them at the web root to keep relative paths intact.
- `test.html` boots the engine without the editor, useful for quick behavioural checks.

## Build, Test, and Development Commands
- `php -S 127.0.0.1:8000` — start a local server from the repository root; open `/index.html` for the editor or `/test.html` for the harness.
- `npx serve .` — static fallback when PHP is unavailable; PHP endpoints are skipped in this mode.
- `zip -r tagrugby-highschool.zip assets AI index.html` — rebuild the distributable archive after updating client assets or AI scripts.

## Coding Style & Naming Conventions
- JavaScript files use tab-indented blocks with single spaces around operators; keep coefficient declarations vertically tidy.
- Prefer `const` for fixed parameters and `let` for evolving state; avoid `var`.
- Functions and globals use `camelCase`; exported AI hooks must remain in `rugby_AI.AI#` so the loader resolves them.
- Comment only when clarifying tactics or data flow, not restating the code.

## Testing Guidelines
- Manual smoke tests: open `/test.html`, cycle through tag phases, and confirm player paths for each `AI#` selection.
- After tuning coefficients, swap between the edited and reference `AI*.js` entries via the dropdown to confirm intent.
- Validate upload workflows by running the PHP server and posting the sample `AI/pos_*` CSVs; ensure responses stay 200 OK.

## Commit & Pull Request Guidelines
- Use imperative, present-tense subjects (e.g., `Adjust AI5 defensive spacing`) and group related tweaks into focused commits.
- Reference tracked issues or lesson plans in descriptions, and note which `AI#` presets change and why.
- PRs should include reproduction steps, screenshots or clips for UI edits, and confirmation that both `index.html` and `test.html` were exercised.

## Agent Tips
- Duplicate the closest `pos_AI*` folder before editing positions so you can diff actual changes cleanly.
- Keep third-party updates scoped to `assets/` and note version bumps in the PR body for traceability.
