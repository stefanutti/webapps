# Split & Bridge Row Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put both edge inputs and the Split & Bridge button on one compact row while removing redundant panel copy and selection count.

**Architecture:** Keep the existing two-input state synchronization and graph command unchanged. Update only the command-card markup, responsive CSS, and the harmless DOM guard in `updateSplitSelectionUi`.

**Tech Stack:** Standalone HTML/CSS/JavaScript and Node.js built-in test runner.

## Global Constraints

- Preserve right-click selection and `splitAndBridgeEdges` behavior.
- Remove `selectionStatus` from markup and its count update from JavaScript.
- Keep the compact layout usable on narrow screens.

---

### Task 1: Define the revised panel contract

**Files:**
- Modify: `tests/split_and_bridge_v2.test.js`

- [ ] Add assertions for absent `Trasformazione`, absent `selectionStatus`, abbreviated hint text, and `.edge-command-row`.
- [ ] Run `node --test tests/split_and_bridge_v2.test.js` and confirm the new assertions fail against the current markup.
- [ ] Commit the red test with `git add tests/split_and_bridge_v2.test.js && git commit -m "test: define split bridge row layout"`.

### Task 2: Implement the compact row

**Files:**
- Modify: `split_and_bridge_v2.html`

- [ ] Replace the eyebrow, wrap the two fields and button in `.edge-command-row`, remove `selectionStatus`, and use the shorter hint.
- [ ] Add a three-column grid for the two fields and button; add a narrow-screen media query that stacks the controls.
- [ ] Remove the count update from `updateSplitSelectionUi` while preserving the two input assignments.
- [ ] Run `node --test tests/split_and_bridge_v2.test.js` and confirm all assertions pass.
- [ ] Commit with `git add split_and_bridge_v2.html tests/split_and_bridge_v2.test.js && git commit -m "feat: streamline split bridge controls"`.

### Task 3: Final verification

- [ ] Run `node --check tests/split_and_bridge_v2.test.js && node --test tests/split_and_bridge_v2.test.js && git diff --check`.
- [ ] Confirm `git status --short --branch` is clean and inspect the latest diff stat.
