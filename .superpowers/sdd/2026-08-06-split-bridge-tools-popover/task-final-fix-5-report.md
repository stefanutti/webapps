# Final Settings click-bubbling fix report

## Status

- Updated the tools document-level `click` handler to return before evaluating `settingsOpen` when the event target is inside `settingsDrawer` or is `settingsBackdrop`.
- This prevents a Settings Close or backdrop click from being reclassified as a tools outside click after Settings has closed.
- Preserved the tools-only outside-click close path, Settings Escape handling, and existing focus restoration behavior.

## Regression coverage

- Updated the existing Settings coordination assertion to require the target guard before the `settingsOpen` guard.
- Added static assertions covering both the `settingsDrawer` descendant exclusion and the `settingsBackdrop` exclusion.

## Test-first evidence

- Before the implementation, `node --test tests/split_and_bridge.test.js` reported 19 passing and 3 failing checks because the click handler did not exclude Settings targets before reading `settingsOpen`.
- After the minimal handler change, the required test command reported 22 passing and 0 failing checks.

## Tests

```text
node --test tests/split_and_bridge.test.js
22 passed, 0 failed
```

## Concerns

- The regression checks are intentionally static/source-level, consistent with the existing suite; they validate guard ordering rather than simulating browser event bubbling.
