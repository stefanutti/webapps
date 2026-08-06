# Split & Bridge Tools Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Split & Bridge workspace compact on mobile and desktop, hide graph tools by default, and expose them through an accessible top-right popover.

**Architecture:** Keep the single-page HTML architecture and existing Settings drawer unchanged. Add a small independent tools-popover state/controller in the UI layer, use the existing `toolDock` as the popover content, and preserve all existing control IDs and application callbacks.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, existing Cytoscape.js and Graphology CDN dependencies.

## Global Constraints

- The dock is hidden at startup on all viewport sizes.
- The popover is aligned below the header on the right and does not resize the graph.
- The help copy is exactly `Select 2 edges or enter their IDs.`.
- Two edge inputs and the `S&B` button remain on one compact row on narrow viewports.
- Existing edge selection, validation, export, toggles, Settings, and `splitAndBridgeEdges` behavior remain unchanged.
- Closed popover controls must not be keyboard reachable.
- Verify with `node --test tests/split_and_bridge.test.js` and manual desktop/mobile checks.

---

### Task 1: Add failing static tests for the compact popover contract

**Files:**
- Modify: `tests/split_and_bridge.test.js`
- Test: `tests/split_and_bridge.test.js`

**Interfaces:**
- Consumes: Existing `html` fixture loaded from `split_and_bridge.html`.
- Produces: Assertions describing the required menu button, initially hidden dock, corrected copy, and narrow-row CSS.

- [ ] **Step 1: Write the failing tests**

Add tests that assert:

```js
test('graph tools are hidden behind an accessible menu button', () => {
  assert.match(html, /id="btnOpenTools"/);
  assert.match(html, /aria-controls="toolDock"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /id="toolDock"[^>]*hidden/);
  assert.match(html, /function setToolsOpen\(open\)/);
});

test('Split & Bridge uses interaction-neutral help copy and compact narrow layout', () => {
  assert.match(html, /Select 2 edges or enter their IDs\./);
  assert.doesNotMatch(html, /Right-click 2 edges or enter their IDs\./);
  assert.match(html, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\) auto/);
});
```

- [ ] **Step 2: Run the focused tests and verify they fail for the missing behavior**

Run: `node --test tests/split_and_bridge.test.js`

Expected: the existing tests pass, while the two new tests fail because the menu button, `hidden` state, controller, copy, and responsive grid have not been added.

### Task 2: Implement the compact markup and CSS

**Files:**
- Modify: `split_and_bridge.html:65-470`

**Interfaces:**
- Consumes: Existing `app-header`, `toolDock`, `command-card`, and `edge-command-row` markup/styles.
- Produces: `btnOpenTools` control, hidden-by-default `toolDock`, popover positioning, and compact Split & Bridge layout.

- [ ] **Step 1: Add the top-right tools button**

Inside `.app-header`, add a button with:

```html
<button id="btnOpenTools" type="button" class="quiet tools-trigger"
        aria-controls="toolDock" aria-expanded="false" aria-label="Open graph tools"
        title="Graph tools">☷</button>
```

Keep the existing `toolDock` controls and IDs unchanged, add `hidden` to the nav initially, and retain `aria-label="Graph tools"`.

- [ ] **Step 2: Make the dock a compact popover**

Change `.tool-dock` from bottom-centered placement to a right-aligned popover below the header:

```css
.tool-dock {
  position: absolute;
  top: .65rem;
  right: .65rem;
  bottom: auto;
  left: auto;
  width: min(20rem, calc(100% - 1.3rem));
  max-width: calc(100% - 1.3rem);
  justify-content: flex-start;
  padding: .45rem;
  border-radius: 12px;
}
```

Preserve wrapping for the controls. Add `.tools-trigger` sizing/centering styles and ensure the header action group aligns the trigger without affecting the title.

- [ ] **Step 3: Reduce Split & Bridge footprint without stacking**

Use smaller panel spacing and make the command row flexible:

```css
.command-card {
  top: .65rem;
  left: .65rem;
  width: min(15rem, calc(100% - 1.3rem));
  padding: .6rem;
}

.command-card h2 {
  margin: .1rem 0 .45rem;
  font-size: .95rem;
}

.edge-command-row {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: .35rem;
}
```

Remove the narrow media query that changes `.edge-command-row` to one column. Reduce mobile-specific panel width/spacing consistently and keep input/button minimum sizes usable.

- [ ] **Step 4: Update the visible help copy**

Replace only the incorrect help sentence with `Select 2 edges or enter their IDs.`.

- [ ] **Step 5: Run the focused tests**

Run: `node --test tests/split_and_bridge.test.js`

Expected: the new markup/CSS/copy assertions pass; any failure must be corrected in `split_and_bridge.html`, not weakened in the tests.

### Task 3: Implement tools popover behavior and accessibility

**Files:**
- Modify: `split_and_bridge.html:541-650`
- Test: `tests/split_and_bridge.test.js`

**Interfaces:**
- Consumes: `toolDock`, `btnOpenTools`, existing Settings controller, and existing global keydown/event patterns.
- Produces: `setToolsOpen(open)` and `initializeToolsPopover()` with focus restoration, Escape handling, and outside-click handling.

- [ ] **Step 1: Add behavior assertions before implementation**

Extend the static tests with:

```js
test('tools popover controller closes on Escape and outside pointer interaction', () => {
  assert.match(html, /function setToolsOpen\(open\)/);
  assert.match(html, /function handleToolsKeydown\(event\)/);
  assert.match(html, /event\.key === 'Escape'/);
  assert.match(html, /toolDock\.contains\(event\.target\)/);
  assert.match(html, /btnOpenTools\.focus\(\)/);
  assert.match(html, /initializeToolsPopover\(\)/);
});
```

- [ ] **Step 2: Run the new behavior test and verify it fails**

Run: `node --test tests/split_and_bridge.test.js`

Expected: the behavior test fails because the tools controller functions do not yet exist.

- [ ] **Step 3: Implement the minimal controller**

Add a separate `toolsOpen` boolean and functions following the Settings pattern:

```js
let toolsOpen = false;

function setToolsOpen(open) {
  const dock = document.getElementById('toolDock');
  const trigger = document.getElementById('btnOpenTools');
  if (!dock || !trigger) return;
  toolsOpen = !!open;
  dock.hidden = !toolsOpen;
  trigger.setAttribute('aria-expanded', String(toolsOpen));
  trigger.setAttribute('aria-label', toolsOpen ? 'Close graph tools' : 'Open graph tools');
  if (!toolsOpen) trigger.focus();
}

function handleToolsKeydown(event) {
  if (event.key === 'Escape' && toolsOpen) {
    event.preventDefault();
    setToolsOpen(false);
  }
}

function initializeToolsPopover() {
  const dock = document.getElementById('toolDock');
  const trigger = document.getElementById('btnOpenTools');
  if (!dock || !trigger) return;
  trigger.onclick = () => setToolsOpen(!toolsOpen);
  document.addEventListener('pointerdown', event => {
    if (toolsOpen && !dock.contains(event.target) && event.target !== trigger) setToolsOpen(false);
  });
  window.addEventListener('keydown', handleToolsKeydown);
  setToolsOpen(false);
}
```

When closing because of outside click, preserve the same focus restoration behavior; when opening, focus the first dock control only if that does not interfere with the existing Settings button workflow.

- [ ] **Step 4: Initialize the controller with the existing UI initialization**

Call `initializeToolsPopover()` exactly once near `initializeSettingsDrawer()` and before graph controls are enabled. Keep Settings state and focus trap independent.

- [ ] **Step 5: Run all tests**

Run: `node --test tests/split_and_bridge.test.js`

Expected: all tests pass with no warnings or failures.

### Task 4: Verify visual behavior and regression safety

**Files:**
- Modify: `split_and_bridge.html` only if verification reveals a defect.
- Modify: `tests/split_and_bridge.test.js` only if an assertion accurately captures an uncovered requirement.

**Interfaces:**
- Consumes: Completed compact layout and tools controller.
- Produces: Verified desktop/mobile interaction and regression-safe final state.

- [ ] **Step 1: Run the complete test command**

Run: `node --test tests/split_and_bridge.test.js`

Expected: all tests pass.

- [ ] **Step 2: Inspect desktop and mobile layouts**

Open `split_and_bridge.html` in a browser at a wide viewport and a phone-sized viewport. Confirm the graph has no bottom dock at startup, the Split & Bridge card stays compact with one command row, and the top-right tools button opens a popover without changing graph dimensions.

- [ ] **Step 3: Verify keyboard and pointer behavior**

Tab to the tools button, open it, press Escape, click outside it, and reopen it. Confirm `aria-expanded` changes, focus returns to the trigger on close, and Settings still opens/closes with its existing focus behavior.

- [ ] **Step 4: Check the final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only the intended HTML, test, and plan changes are present.
