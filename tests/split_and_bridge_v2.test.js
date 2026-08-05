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

test('Split & Bridge keeps the two fields synchronized with command parsing', () => {
  assert.match(html, /inputA\.value = normalizedTokens\[0\]/);
  assert.match(html, /inputB\.value = normalizedTokens\[1\]/);
  assert.match(html, /const rawA = inputA \? inputA\.value : ''/);
  assert.match(html, /const rawB = inputB \? inputB\.value : ''/);
  assert.match(html, /splitAndBridgeEdges\(partsA\[0\], partsB\[0\]\)/);
});

test('Split & Bridge uses a compact single-row command layout', () => {
  assert.doesNotMatch(html, />Trasformazione</);
  assert.doesNotMatch(html, /id="selectionStatus"/);
  assert.match(html, /Clic destro su 2 archi o inserisci gli ID\./);
  assert.match(html, /class="edge-command-row"/);
  assert.match(html, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\) auto/);
});
