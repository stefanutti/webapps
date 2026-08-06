# Final focus-restoration fix report

## Scope completed

- Moved the document-level tools outside-close handler from `pointerdown` to `click`.
- Preserved the existing Settings guard, so Settings retains ownership of its focus and backdrop behavior.
- Kept the existing close path unchanged: `setToolsOpen(false)` restores focus to `btnOpenTools` after the browser has applied focus to the outside clicked control.
- Updated static assertions from outside-pointer to outside-click behavior and added a regression that rejects the former guarded `pointerdown` closer.

## Test-first evidence

- Before the implementation change, `node --test tests/split_and_bridge.test.js` reported 19 passing and 2 failing assertions because the handler still used `pointerdown`.
- After changing only the listener event, the required test command reports 21 passing and 0 failing assertions.
- `git diff --check` exits successfully.

## Changed files

- `split_and_bridge.html`
- `tests/split_and_bridge.test.js`
- `.superpowers/sdd/2026-08-06-split-bridge-tools-popover/task-final-fix-4-report.md`

## Concerns

- The regression suite is intentionally source-level, matching the existing test style. It asserts the event-timing contract and guards against reintroducing `pointerdown`, but does not run a browser focus simulation.
