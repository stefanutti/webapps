const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'split_and_bridge.html'), 'utf8');

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
  assert.match(html, /Select 2 edges or enter their IDs\./);
  assert.match(html, /class="edge-command-row"/);
  assert.match(html, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\) auto/);
});

test('graph tools open directly into a single settings window', () => {
  assert.match(html, /id="btnOpenSettings"/);
  assert.match(html, /aria-controls="settingsDrawer"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /id="settingsDrawer"[^>]*aria-hidden="true"/);
  assert.doesNotMatch(html, /id="toolDock"/);
  assert.doesNotMatch(html, /id="btnOpenTools"/);
  assert.doesNotMatch(html, /function setToolsOpen/);
  assert.doesNotMatch(html, /function initializeToolsPopover/);
});

test('the Tools section is the first section in the settings window, before Appearance and Physics', () => {
  const controlsMatch = html.match(/<div id="controls">([\s\S]*?)<\/aside>/);
  assert.ok(controlsMatch, 'expected a #controls container inside the settings drawer');
  const toolsIndex = controlsMatch[1].indexOf('id="group-tools"');
  const appearanceIndex = controlsMatch[1].indexOf('id="group-appearance"');
  const physicsIndex = controlsMatch[1].indexOf('id="group-physics"');
  assert.notEqual(toolsIndex, -1);
  assert.ok(toolsIndex < appearanceIndex);
  assert.ok(appearanceIndex < physicsIndex);
});

test('the Tools section holds the Nodes/Physics/Edges/Debug toggles and the Export DOT button', () => {
  const toolsSectionMatch = html.match(/<section class="drawer-section" id="group-tools"[\s\S]*?<\/section>/);
  assert.ok(toolsSectionMatch, 'expected a group-tools drawer section');
  const section = toolsSectionMatch[0];
  assert.match(section, /Nodes<input type="checkbox" id="toggleNodeLabels" \/>/);
  assert.match(section, /Physics<input type="checkbox" id="togglePhysics" \/>/);
  assert.match(section, /Edges<input type="checkbox" id="toggleEdgeLabels" \/>/);
  assert.match(section, /Debug<input type="checkbox" id="toggleDebug" \/>/);
  assert.match(section, /id="btnExportDot"/);
});

test('there is a single trigger and a single window for tools and settings', () => {
  assert.match(html, /function initializeSettingsDrawer\(\)/);
  assert.doesNotMatch(html, /let toolsOpen/);
  assert.doesNotMatch(html, /toolDock/);
  assert.doesNotMatch(html, /btnOpenTools/);
});

test('Split & Bridge uses interaction-neutral help copy and compact narrow layout', () => {
  assert.match(html, /Select 2 edges or enter their IDs\./);
  assert.doesNotMatch(html, /Right-click 2 edges or enter their IDs\./);
  assert.match(html, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\) auto/);
});

test('Split & Bridge uses numeric edge labels and a compact button label', () => {
  assert.match(html, />Edge 1</);
  assert.match(html, />Edge 2</);
  assert.match(html, /<button id="btnSplitEdges" type="button">S&amp;B<\/button>/);
});

test('Split & Bridge keeps edge inputs narrow beside the button', () => {
  assert.match(html, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\) auto/);
});

test('Split & Bridge uses a compact outer panel', () => {
  assert.match(html, /width: min\(15rem, calc\(100% - 1\.3rem\)\)/);
});

test('mobile viewport keeps the app fixed without page scrolling', () => {
  assert.match(html, /html \{[\s\S]*?height: 100%;[\s\S]*?overflow: hidden;/);
  assert.match(html, /height: 100dvh;[\s\S]*?min-height: 0;[\s\S]*?overflow: hidden;/);
});

test('node labels are plain and match the default edge label size', () => {
  assert.match(html, /nodeLabelFontSize: 9/);
  assert.doesNotMatch(html, /'text-background-color': '#171d23'/);
  assert.doesNotMatch(html, /'text-border-color': '#34414c'/);
});

test('node labels overlay the vertex center with the edge-label outline effect', () => {
  assert.match(html, /'text-valign': 'center'/);
  assert.match(html, /'text-halign': 'center'/);
  assert.match(html, /'text-margin-y': 0/);
  assert.match(html, /'text-outline-color': '#11161b'/);
  assert.match(html, /'text-outline-width': 2/);
  assert.match(html, /'text-outline-opacity': 1/);
});

test('settings opens as a fixed centered modal over the graph', () => {
  assert.match(html, /\.settings-backdrop \{[\s\S]*?position: fixed;/);
  assert.match(html, /\.settings-drawer \{[\s\S]*?position: fixed;/);
  assert.match(html, /\.settings-drawer \{[\s\S]*?top: 50%;/);
  assert.match(html, /\.settings-drawer \{[\s\S]*?left: 50%;/);
  assert.match(html, /translate\(-50%, -50%\)/);
});

test('the visible application copy is in English', () => {
  for (const phrase of [
    'Waiting for graph',
    'Interactive planar graph',
    'Select 2 edges or enter their IDs.',
    'Export DOT',
    'Settings',
    'Appearance',
    'Physics',
    'Reset to default',
    'Transformation completed.'
  ]) {
    assert.match(html, new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')));
  }
  for (const phrase of ['In attesa del grafo', 'Impostazioni', 'Esporta DOT', 'Trasformazione completata.']) {
    assert.doesNotMatch(html, new RegExp(phrase));
  }
});

test('the main toolbar exposes a physics toggle', () => {
  assert.match(html, /Physics<input type="checkbox" id="togglePhysics" \/>/);
  assert.match(html, /physicsEnabled: false/);
  assert.match(html, /function setPhysicsEnabled\(enabled\)/);
  assert.match(html, /if \(state && state\.physicsEnabled === false\) return;/);
});

test('enabled physics has active defaults and is not stopped by a timer', () => {
  assert.match(html, /repulsion: 0\.002/);
  assert.match(html, /springStrength: 2\.08/);
  assert.match(html, /springLength: 1\.2/);
  assert.match(html, /damping: 0\.3/);
  assert.match(html, /id="cfgPhysicsRepulsion"[^>]*step="0\.001"[^>]*value="0\.002"/);
  assert.match(html, /id="cfgPhysicsDamping"[^>]*value="0\.3"/);
  assert.doesNotMatch(html, /physics\.stopTimer = window\.setTimeout\(\(\) =>/);
});

test('graph gestures are unified for mouse and touch', () => {
  assert.match(html, /#graph-container \{[\s\S]*?touch-action: none;/);
  assert.match(html, /state\.cy\.on\('tap', 'edge', event => \{[\s\S]*?selectSplitEdge\(edgeId\)/);
  assert.match(html, /state\.cy\.on\('tapstart', 'edge', beginEdgeBendDrag\)/);
  assert.match(html, /state\.cy\.on\('tapdrag', updateEdgeBendDrag\)/);
  assert.doesNotMatch(html, /state\.cy\.on\('cxttap', 'edge', handleEdgeContextSelection\)/);
});
