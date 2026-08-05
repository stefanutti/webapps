# Split & Bridge Compact Edge Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Split & Bridge command card more compact and replace its combined edge-ID input with two separate accessible fields.

**Architecture:** Keep `state.selectedSplitEdges` and the existing `splitAndBridgeEdges(tokenA, tokenB)` operation. Change only the command-card markup, its compact CSS, and the two synchronization/command handlers that currently read and write `edgeSplitInput`.

**Tech Stack:** Standalone HTML, CSS, and browser JavaScript in `split_and_bridge_v2.html`; Node.js built-in assertions for static behavior checks.

## Global Constraints

- Preserve right-click edge selection and the existing `state.selectedSplitEdges` model.
- Preserve the existing `splitAndBridgeEdges` operation and status messages.
- Do not modify unrelated graph, physics, or visualization behavior.
- Do not include the pre-existing untracked `split_and_bridge_v2.html` in any design-doc commit; the implementation will intentionally modify it.

---

### Task 1: Add a failing regression check for the two-field contract

**Files:**
- Create: `tests/split_and_bridge_v2.test.js`
- Read: `split_and_bridge_v2.html:450-645`

**Interfaces:**
- Consumes: the HTML source as a UTF-8 string.
- Produces: a repeatable Node.js check for two labeled edge inputs, absence of the old single-input contract, and separate-value command parsing.

- [ ] **Step 1: Write the failing test**

Create a Node test using `node:test`, `node:assert/strict`, and `fs`. Assert that the HTML contains `edgeSplitInputA`, `edgeSplitInputB`, labels associated with both IDs, and a command handler that reads both IDs. Also assert that the old `id="edgeSplitInput"` is absent.

```js
const html = fs.readFileSync(new URL('../split_and_bridge_v2.html', import.meta.url), 'utf8');
assert.match(html, /id="edgeSplitInputA"/);
assert.match(html, /id="edgeSplitInputB"/);
assert.match(html, /for="edgeSplitInputA"/);
assert.match(html, /for="edgeSplitInputB"/);
assert.doesNotMatch(html, /id="edgeSplitInput"(?:\s|>)/);
assert.match(html, /getElementById\('edgeSplitInputA'\)/);
assert.match(html, /getElementById\('edgeSplitInputB'\)/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/split_and_bridge_v2.test.js`

Expected: FAIL because the current HTML still contains the single `edgeSplitInput` field.

- [ ] **Step 3: Commit the failing test**

Run: `git add tests/split_and_bridge_v2.test.js && git commit -m "test: define split bridge edge field contract"`

### Task 2: Replace the single edge input and compact the panel

**Files:**
- Modify: `split_and_bridge_v2.html:100-160` for command-card sizing and compact layout styles.
- Modify: `split_and_bridge_v2.html:465-480` for the two edge fields.

**Interfaces:**
- Consumes: the existing command-card markup and CSS variables.
- Produces: two labeled edge-ID inputs with responsive layout and a visually smaller command card.

- [ ] **Step 1: Write the minimal markup and CSS change**

Replace the single label/input pair with a `.edge-input-grid` containing:

```html
<div class="edge-input-grid">
  <div class="field">
    <label class="field-label" for="edgeSplitInputA">Primo edge</label>
    <input id="edgeSplitInputA" type="text" placeholder="0" autocomplete="off" />
  </div>
  <div class="field">
    <label class="field-label" for="edgeSplitInputB">Seconda edge</label>
    <input id="edgeSplitInputB" type="text" placeholder="1" autocomplete="off" />
  </div>
</div>
```

Reduce `.command-card` width to `min(19rem, calc(100% - 2rem))`, padding to `.8rem`, and heading/field spacing by roughly one step. Add `.edge-input-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; }` plus a media query at `max-width: 420px` that changes it to one column.

- [ ] **Step 2: Run the regression check**

Run: `node --test tests/split_and_bridge_v2.test.js`

Expected: FAIL only on the JavaScript handler assertions, proving the markup contract is now present while behavior wiring remains to be updated.

### Task 3: Wire synchronization and command handling to both fields

**Files:**
- Modify: `split_and_bridge_v2.html:610-642` in `syncSplitEdgeSelectionToInput`, `clearSplitEdgeSelection`, and `handleSplitAndBridgeCommand`.
- Test: `tests/split_and_bridge_v2.test.js`

**Interfaces:**
- Consumes: `state.selectedSplitEdges`, `getEdgeInputToken`, and `splitAndBridgeEdges`.
- Produces: synchronized `edgeSplitInputA`/`edgeSplitInputB` values and two-token command invocation.

- [ ] **Step 1: Extend the failing test with the behavior contract**

Assert the source assigns the first two normalized tokens to the two inputs, clears both inputs in the clear function, reads both fields in the command handler, and rejects when either token is missing.

```js
assert.match(html, /inputA\.value = normalizedTokens\[0\]/);
assert.match(html, /inputB\.value = normalizedTokens\[1\]/);
assert.match(html, /const rawA = inputA \? inputA\.value : ''/);
assert.match(html, /const rawB = inputB \? inputB\.value : ''/);
assert.match(html, /splitAndBridgeEdges\(partsA\[0\], partsB\[0\]\)/);
```

- [ ] **Step 2: Run test to verify the new assertions fail**

Run: `node --test tests/split_and_bridge_v2.test.js`

Expected: FAIL because the handler still reads and writes `edgeSplitInput` as a comma-separated value.

- [ ] **Step 3: Implement the minimal handler change**

Use two DOM references in the synchronization function. Set each input to its corresponding normalized token or an empty string. In the command handler, trim each field independently, require one non-empty token per field, and call `splitAndBridgeEdges(partsA[0], partsB[0])`. Keep the existing error/status wording unless a message must mention both fields.

- [ ] **Step 4: Run the regression check**

Run: `node --test tests/split_and_bridge_v2.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the implementation**

Run: `git add split_and_bridge_v2.html tests/split_and_bridge_v2.test.js && git commit -m "feat: compact split bridge edge controls"`

### Task 4: Verify layout and repository state

**Files:**
- Verify: `split_and_bridge_v2.html`
- Verify: `tests/split_and_bridge_v2.test.js`

- [ ] **Step 1: Run static checks**

Run: `node --check tests/split_and_bridge_v2.test.js && node --test tests/split_and_bridge_v2.test.js && git diff --check`

Expected: syntax check succeeds, all tests pass, and `git diff --check` reports no whitespace errors.

- [ ] **Step 2: Inspect the final diff and status**

Run: `git show --stat --oneline HEAD && git status --short --branch`

Expected: the latest commit contains only the Split & Bridge HTML and its regression test; the pre-existing untracked `split_and_bridge_v2.html` condition will be resolved by the implementation commit, while no unrelated files are staged.

- [ ] **Step 3: Perform visual verification**

Open `split_and_bridge_v2.html` in a browser and verify that the card is visibly smaller, the two fields are side by side at normal width, they stack on narrow width, right-click selection fills them in order, and the button still performs the operation.
