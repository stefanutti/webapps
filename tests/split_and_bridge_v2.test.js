const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'split_and_bridge_v2.html'), 'utf8');

test('Split & Bridge exposes two separate edge fields', () => {
  assert.match(html, /id="edgeSplitInputA"/);
  assert.match(html, /id="edgeSplitInputB"/);
  assert.match(html, /for="edgeSplitInputA"/);
  assert.match(html, /for="edgeSplitInputB"/);
  assert.doesNotMatch(html, /id="edgeSplitInput"(?:\s|>)/);
  assert.match(html, /getElementById\('edgeSplitInputA'\)/);
  assert.match(html, /getElementById\('edgeSplitInputB'\)/);
});
