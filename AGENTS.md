# Repository Guidelines

## Project Structure & Module Organization
Keep `index.html` as the primary simulator shell; it wires Bootstrap, CodeMirror, and `assets/js/TagRugby-core.js`. AI playbooks live in `AI/` with paired coordinate seeds inside matching `pos_AI*` folders—extend numbering sequentially so dropdown indices stay aligned. Shared engine code and vendor libraries sit under `assets/` (`js/`, `css/`, `img/`, `codemirror/`). Retain `automatch.php` and `upload.php` at the repository root because the client expects those relative paths. Use `test.html` for a lightweight harness when you only need to validate in-game behaviour.

## Build, Test, and Development Commands
Run `php -S 127.0.0.1:8000` from the repo root to serve the PHP endpoints and open `/index.html` or `/test.html`. When PHP is unavailable, `npx serve .` provides a static fallback (PHP routes will be skipped). Package updated client assets with `zip -r tagrugby-highschool.zip assets AI index.html` before distribution.

## Coding Style & Naming Conventions
Use tab-indented JavaScript with single spaces around operators. Prefer `const` for fixed coefficients and `let` for evolving state; avoid `var`. Functions, globals, and exported hooks stay in `camelCase`, and AI entry points must remain `rugby_AI.AI#` to keep the loader working. Comment sparingly—focus on tactical intent or data flow rather than restating logic.

## Testing Guidelines
Manual verification is the norm: open `/test.html`, cycle through all tag phases, and confirm each `AI#` option follows the intended routes. After adjusting coefficients, compare behaviour by swapping between modified and baseline `AI*.js` files via the dropdown. Exercise upload workflows through the PHP server by posting sample `AI/pos_*` CSVs and confirm `200 OK` responses.

## Commit & Pull Request Guidelines
Write imperative, present-tense commit subjects (e.g., `Tighten AI5 chase spacing`) and group related edits together. In PR descriptions, call out which `AI#` presets changed, the tactical goal, and any linked lesson plans or issues. Include reproduction steps, relevant screenshots or clips, and state that both `index.html` and `test.html` were exercised.

## Security & Configuration Tips
Store `OPENAI_API_KEY` in your environment or `.env`; never commit the key. Confirm the PHP cURL extension is enabled before calling `chat.php`, and avoid modifying third-party libraries under `assets/` unless documenting the version bump.
