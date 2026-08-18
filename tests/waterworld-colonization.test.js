const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'waterworld-colonization.html'),
  'utf8',
);

function growthAlgorithm() {
  const start = html.indexOf('const DELTA =');
  const end = html.indexOf('/* ---------- v15:', start);
  assert.notEqual(start, -1, 'growth algorithm start not found');
  assert.notEqual(end, -1, 'growth algorithm end not found');

  return html
    .slice(start, end)
    .replace("addEventListener('resize', resize); resize();", '');
}

function historyAlgorithm() {
  const start = html.indexOf('const DELTA =');
  const end = html.indexOf('/* ---------- projection onto the fixed sphere ----------', start);
  assert.notEqual(start, -1, 'growth algorithm start not found');
  assert.notEqual(end, -1, 'history algorithm end not found');

  return html
    .slice(start, end)
    .replace("addEventListener('resize', resize); resize();", '');
}

function measureFirstGrowthStep() {
  const algorithm = growthAlgorithm();

  const run = new Function(`${algorithm}
    const btnRun = { disabled: false, classList: { remove() {} } };
    const btnClose = { disabled: false, title: '' };
    const closeToast = { classList: { add() {}, remove() {} } };
    const fullToast = { classList: { add() {}, remove() {} } };
    function setRunIcon() {}
    function resetLog() {}
    function syncControls() {}
    function hideFullToast() {}

    reset();
    const initialRadius = maxR;
    attemptMove();
    return { initialRadius, radiusAfterFirstFace: maxR };
  `);

  return run();
}

function measureLargestFace({ landDegrees, oceanDegree }) {
  const algorithm = growthAlgorithm();
  const largestFaceStart = algorithm.indexOf('function largestFaceDegree()');
  assert.notEqual(largestFaceStart, -1, 'largest-face calculation not found');

  const run = new Function(`${algorithm}
    const btnRun = { disabled: false, classList: { remove() {} } };
    const btnClose = { disabled: false, title: '' };
    const closeToast = { classList: { add() {}, remove() {} } };
    const fullToast = { classList: { add() {}, remove() {} } };
    function setRunIcon() {}
    function resetLog() {}
    function syncControls() {}
    function hideFullToast() {}

    faces = ${JSON.stringify(landDegrees)}.map(n => ({ n }));
    coast = new Array(${oceanDegree});
    return largestFaceDegree();
  `);

  return run();
}

function measureDetailedStatistics() {
  const algorithm = growthAlgorithm();
  assert.notEqual(algorithm.indexOf('function detailedStatistics()'), -1, 'detailed statistics not found');

  const run = new Function(`${algorithm}
    const points = [
      { x: 1, y: 0 }, { x: .5, y: Math.sqrt(3) / 2 },
      { x: -.5, y: Math.sqrt(3) / 2 }, { x: -1, y: 0 },
      { x: -.5, y: -Math.sqrt(3) / 2 }, { x: .5, y: -Math.sqrt(3) / 2 },
      { x: 2, y: 0 }, { x: 3, y: 0 },
    ];
    faces = [
      { n: 2, sealed: false, vertices: [points[0], points[1]] },
      { n: 3, sealed: true,  vertices: [points[1], points[2], points[6]] },
      { n: 4, sealed: false, vertices: [points[2], points[3], points[6], points[7]] },
      { n: 5, sealed: true,  vertices: [points[3], points[4], points[5], points[0], points[6]] },
      { n: 6, sealed: false, vertices: points.slice(0, 6) },
      { n: 7, sealed: false, vertices: [...points.slice(0, 6), points[7]] },
    ];
    const shoreIndexes = [0, 0, 2, 2, 4, 5];
    coast = points.slice(0, 6).map((point, i) => ({
      a: point,
      b: points[(i + 1) % 6],
      pts: [],
      face: faces[shoreIndexes[i]],
    }));
    moves = 12;
    fallbackCount = 3;
    invOK = true;
    sumLand = 12;
    return { statistics: detailedStatistics(), visibleRows: visibleFaceCountRows({
      f2: 0, f3: 2, f4: 0, f5: 4, f6: 0, above6: 1,
    }) };
  `);

  return run();
}

function seededMath(seed) {
  const math = Object.create(Math);
  math.random = () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  return math;
}

function closeGeneratedMap(maximizeOcean) {
  const run = new Function('Math', 'maximizeOcean', `${growthAlgorithm()}
    const btnRun = { disabled: false, classList: { remove() {} } };
    const btnClose = { disabled: false, title: '' };
    const closeToast = { classList: { add() {}, remove() {} } };
    const fullToast = { classList: { add() {}, remove() {} } };
    function setRunIcon() {}
    function resetLog() {}
    function syncControls() {}
    function hideFullToast() {}

    reset();
    for (let step = 0; step < 240; step++) attemptMove();

    let closeSteps = 0;
    while (!tryPromotionMove(maximizeOcean)) {
      if (++closeSteps > 10000) throw new Error('close strategy did not terminate');
    }

    return {
      oceanDegree: coast.length,
      minimumLandDegree: Math.min(...faces.map(face => face.n)),
      invariantHolds: invOK,
    };
  `);

  return run(seededMath(7), maximizeOcean);
}

function closingFaceDegrees(maximizeOcean) {
  const run = new Function('Math', 'maximizeOcean', `${growthAlgorithm()}
    const btnRun = { disabled: false, classList: { remove() {} } };
    const btnClose = { disabled: false, title: '' };
    const closeToast = { classList: { add() {}, remove() {} } };
    const fullToast = { classList: { add() {}, remove() {} } };
    function setRunIcon() {}
    function resetLog() {}
    function syncControls() {}
    function hideFullToast() {}

    reset();
    for (let step = 0; step < 240; step++) attemptMove();

    const createdDegrees = [];
    let closeSteps = 0;
    while (true) {
      const previousFaceCount = faces.length;
      const complete = tryPromotionMove(maximizeOcean);
      for (const face of faces.slice(previousFaceCount)) createdDegrees.push(face.n);
      if (complete) break;
      if (++closeSteps > 10000) throw new Error('close strategy did not terminate');
    }
    return createdDegrees;
  `);

  return run(seededMath(7), maximizeOcean);
}

function visibleYoungClosingFaceDegrees(maximizeOcean) {
  const run = new Function('Math', 'maximizeOcean', `${growthAlgorithm()}
    const btnRun = { disabled: false, classList: { remove() {} } };
    const btnClose = { disabled: false, title: '' };
    const closeToast = { classList: { add() {}, remove() {} } };
    const fullToast = { classList: { add() {}, remove() {} } };
    function setRunIcon() {}
    function resetLog() {}
    function syncControls() {}
    function hideFullToast() {}

    reset();
    for (let step = 0; step < 10; step++) attemptMove();
    closing = true;
    closeDone = false;
    closingMaximizeOcean = maximizeOcean;

    const visibleDegrees = [];
    for (let step = 0; step < 6 && !closeDone; step++) {
      const previousFaceCount = faces.length;
      closeStep();
      for (const face of faces.slice(previousFaceCount)) visibleDegrees.push(face.n);
    }
    clearTimeout(closeToastTimer);
    return visibleDegrees;
  `);

  return run(seededMath(4), maximizeOcean);
}

function closeMoveTrace({ seed, growthSteps, closeSteps, maximizeOcean }) {
  const run = new Function('Math', 'maximizeOcean', 'growthSteps', 'closeSteps', `${growthAlgorithm()}
    const btnRun = { disabled: false, classList: { remove() {} } };
    const btnClose = { disabled: false, title: '' };
    const closeToast = { classList: { add() {}, remove() {} } };
    const fullToast = { classList: { add() {}, remove() {} } };
    function setRunIcon() {}
    function resetLog() {}
    function syncControls() {}
    function hideFullToast() {}

    reset();
    for (let step = 0; step < growthSteps; step++) attemptMove();

    const trace = [];
    const executeMove = execStandardMove;
    let actualK = null;
    execStandardMove = (i, k, sp, sq) => {
      actualK = k;
      executeMove(i, k, sp, sq);
    };

    for (let step = 0; step < closeSteps; step++) {
      const C = coast.length;
      const deficient = [];
      const defFaces = new Set();
      for (let i = 0; i < C; i++) {
        if (coast[i].face.n < 5) {
          deficient.push(i);
          defFaces.add(coast[i].face);
        }
      }
      let points = 0;
      for (const face of defFaces) points += 5 - face.n;

      const k1Legal = deficient.some(i =>
        coast[(i + 2) % C].face.n < 5 && canSealWholes(wholesOf(i, 1))
      );
      const standardLegal = [];
      const maxK = C - 3 - points;
      for (let k = 2; k <= maxK; k++) {
        const legal = deficient.some(d =>
          [d, (d - k - 1 + C) % C].some(i => canSealWholes(wholesOf(i, k)))
        );
        if (legal) standardLegal.push(k);
      }

      let expectedK;
      if (points === 0 && C >= 5 && new Set(coast.map(edge => edge.face)).size >= 2) {
        expectedK = maximizeOcean || C === 5 ? null : C - 4;
      } else if (standardLegal.length) {
        expectedK = maximizeOcean ? standardLegal[0] : standardLegal.at(-1);
      } else if (k1Legal) {
        expectedK = 1;
      } else {
        expectedK = 0;
      }

      actualK = null;
      const complete = tryPromotionMove(maximizeOcean);
      trace.push({ expectedK, actualK, standardLegal });
      if (complete) break;
    }
    return trace;
  `);

  return run(seededMath(seed), maximizeOcean, growthSteps, closeSteps);
}

function restoredCloseStrategy({ closingSnapshot, pendingPreference }) {
  const run = new Function('closingSnapshot', 'pendingPreference', `${historyAlgorithm()}
    const btnRun = { disabled: false, classList: { remove() {} } };
    const btnClose = { disabled: false, title: '' };
    const closeToast = { classList: { add() {}, remove() {} } };
    const fullToast = { classList: { add() {}, remove() {} } };
    const maximizeOceanEl = { checked: false };
    function setRunIcon() {}
    function syncControls() {}
    function hideFullToast() {}

    reset();
    closing = closingSnapshot;
    closingMaximizeOcean = true;
    const saved = snapshot();
    closingMaximizeOcean = false;
    maximizeOceanEl.checked = pendingPreference;
    restore(saved);
    return { closingMaximizeOcean, checkboxChecked: maximizeOceanEl.checked };
  `);

  return run(closingSnapshot, pendingPreference);
}

function exerciseSpeedPopover() {
  const start = html.indexOf('function setSpeedPopover(open)');
  const end = html.indexOf("document.getElementById('closeToastX')", start);
  assert.notEqual(start, -1, 'speed popover handlers not found');
  assert.notEqual(end, -1, 'speed popover handler boundary not found');

  const run = new Function(
    'speedToggle', 'speedPopover', 'speedEl', 'statsToggle', 'statsPopup', 'listeners',
    'addEventListener', 'HTMLInputElement', 'manualStep', 'updateDetailedStatistics',
    `${html.slice(start, end)}
      const speedState = () => ({
        hidden: speedPopover.hidden,
        expanded: speedToggle.attributes['aria-expanded'],
        sliderFocuses: speedEl.focuses,
        toggleFocuses: speedToggle.focuses,
      });
      const statsState = () => ({
        hidden: statsPopup.hidden,
        expanded: statsToggle.attributes['aria-expanded'],
        popupFocuses: statsPopup.focuses,
        toggleFocuses: statsToggle.focuses,
        updates: statsPopup.updates,
      });
      const stopEvent = { stopPropagation() {} };
      speedToggle.onclick(stopEvent);
      const speedOpened = speedState();
      speedToggle.onclick(stopEvent);
      const speedClosedByToggle = speedState();
      speedToggle.onclick(stopEvent);
      for (const handler of listeners.click) handler();
      const speedClosedOutside = speedState();
      speedToggle.onclick(stopEvent);
      for (const handler of listeners.keydown) handler({ key: 'Escape' });
      const speedClosedByEscape = speedState();

      statsToggle.onclick(stopEvent);
      const statsOpened = statsState();
      statsToggle.onclick(stopEvent);
      const statsClosedByToggle = statsState();
      statsToggle.onclick(stopEvent);
      for (const handler of listeners.click) handler();
      const statsClosedOutside = statsState();
      statsToggle.onclick(stopEvent);
      for (const handler of listeners.keydown) handler({ key: 'Escape' });
      const statsClosedByEscape = statsState();
      return {
        speed: {
          opened: speedOpened, closedByToggle: speedClosedByToggle,
          closedOutside: speedClosedOutside, closedByEscape: speedClosedByEscape,
        },
        statistics: {
          opened: statsOpened, closedByToggle: statsClosedByToggle,
          closedOutside: statsClosedOutside, closedByEscape: statsClosedByEscape,
        },
      };
    `,
  );

  const listeners = {};
  const speedToggle = {
    attributes: { 'aria-expanded': 'false' },
    focuses: 0,
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focuses++; },
  };
  const speedPopover = { hidden: true };
  const speedEl = { focuses: 0, focus() { this.focuses++; } };
  const statsToggle = {
    attributes: { 'aria-expanded': 'false' },
    focuses: 0,
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focuses++; },
  };
  const statsPopup = { hidden: true, focuses: 0, updates: 0, focus() { this.focuses++; } };
  const addEventListener = (type, handler) => { (listeners[type] ||= []).push(handler); };
  const updateDetailedStatistics = () => { statsPopup.updates++; };

  return run(
    speedToggle, speedPopover, speedEl, statsToggle, statsPopup, listeners,
    addEventListener, class {}, () => {}, updateDetailedStatistics,
  );
}

function frameBatchCalls(speedValue) {
  const start = html.indexOf('function frame(now){');
  const end = html.indexOf('\nupdateStats();', start);
  assert.notEqual(start, -1, 'animation frame not found');
  assert.notEqual(end, -1, 'animation frame boundary not found');

  const run = new Function('speedValue', `
    let running = true, last = 0, acc = 0, statT = 0;
    const speedEl = { value: speedValue, max: 40 };
    let clock = 0, calls = 0;
    const performance = { now() { return clock++; } };
    function canStepForward() { return true; }
    function stepForward() { calls++; running = false; return true; }
    function draw() {}
    function updateStats() {}
    function requestAnimationFrame() {}
    const FRAME_BUDGET_MS = 14;
    ${html.slice(start, end)}
    frame(1000);
    return calls;
  `);

  return run(speedValue);
}

function exerciseCameraPointers(events) {
  const cameraStart = html.indexOf('let zoom = 1;');
  const cameraEnd = html.indexOf("\n\naddEventListener('resize', resize);", cameraStart);
  const interactionStart = html.indexOf('const CLICK_SLOP =');
  const interactionEnd = html.indexOf('\nreset();', interactionStart);
  assert.notEqual(cameraStart, -1, 'camera math not found');
  assert.notEqual(cameraEnd, -1, 'camera math boundary not found');
  assert.notEqual(interactionStart, -1, 'camera interaction handlers not found');
  assert.notEqual(interactionEnd, -1, 'camera interaction boundary not found');

  const run = new Function('events', `
    const W = 390, H = 844, Rs = 620;
    const scale = Math.min(W, H) * .46 / Rs;
    ${html.slice(cameraStart, cameraEnd)}

    const canvasListeners = {}, windowListeners = {};
    const canvas = {
      addEventListener(type, handler) { (canvasListeners[type] ||= []).push(handler); },
      setPointerCapture() {},
      classList: { add() {}, remove() {} },
    };
    function addEventListener(type, handler) { (windowListeners[type] ||= []).push(handler); }
    const performance = { now() { return 100; } };
    let colorPickerOpens = 0;
    function faceAt() { return {}; }
    function openColorPicker() { colorPickerOpens++; }
    function unprojectClick() { return { x: 0, y: 0 }; }

    ${html.slice(interactionStart, interactionEnd)}

    const dispatch = event => {
      const listeners = event.target === 'window' ? windowListeners : canvasListeners;
      const payload = { preventDefault() {}, ...event };
      for (const handler of listeners[event.type] || []) handler(payload);
    };
    const initialCamera = camGet();
    for (const event of events) dispatch(event);
    return { initialCamera, camera: camGet(), zoom, colorPickerOpens };
  `);

  return run(events);
}

function closeReplayBehavior() {
  const run = new Function('Math', `${historyAlgorithm()}
    const btnRun = { disabled: false, classList: { remove() {} } };
    const btnClose = { disabled: false, title: '' };
    const closeToast = {
      visible: false,
      classList: {
        add() { closeToast.visible = true; },
        remove() { closeToast.visible = false; },
      },
    };
    const fullToast = { classList: { add() {}, remove() {} } };
    const maximizeOceanEl = { checked: true };
    function setRunIcon() {}
    function syncControls() {}
    function hideFullToast() {}

    reset();
    for (let step = 0; step < 12; step++) stepForward();

    closingMaximizeOcean = true;
    closing = true;
    closeDone = false;
    running = true;
    let guard = 0;
    while (!closeDone) {
      if (!stepForward()) throw new Error('closing failed to advance');
      if (++guard > 1000) throw new Error('closing did not terminate');
    }
    clearTimeout(closeToastTimer);

    const terminalLogIdx = logIdx;
    const terminalFaceCount = faces.length;
    const terminalMoves = moves;
    const terminalSmallFaces = faces.filter(face => face.n < 5).map(face => face.n);

    if (!stepBack()) throw new Error('missing pre-closure history state');
    running = true;
    let automaticReplaySteps = 0;
    while (running && automaticReplaySteps < 6) {
      stepForward();
      automaticReplaySteps++;
    }
    const replay = {
      steps: automaticReplaySteps,
      running,
      faceCount: faces.length,
      moves,
      smallFaces: faces.filter(face => face.n < 5).map(face => face.n),
    };

    restore(moveLog[terminalLogIdx]);
    logIdx = terminalLogIdx;
    moveLog.length = terminalLogIdx + 1;
    running = true;
    const explicitAdvanced = stepForward();
    const explicitResume = {
      advanced: explicitAdvanced,
      closeDone,
      closeToastVisible: closeToast.visible,
      faceCount: faces.length,
      moves,
    };

    return {
      terminal: {
        faceCount: terminalFaceCount,
        moves: terminalMoves,
        smallFaces: terminalSmallFaces,
      },
      replay,
      explicitResume,
    };
  `);

  return run(seededMath(11));
}

test('growth advances three units beyond an unchanged 50-unit seed', () => {
  const { initialRadius, radiusAfterFirstFace } = measureFirstGrowthStep();

  assert.equal(initialRadius, 50);
  assert.ok(
    Math.abs(radiusAfterFirstFace - 53) < 1e-9,
    `expected the first shell at radius 53, got ${radiusAfterFirstFace}`,
  );
});

test('minimum-ocean closing finishes with a pentagonal ocean and no small faces', () => {
  const result = closeGeneratedMap(false);

  assert.equal(result.oceanDegree, 5);
  assert.ok(result.minimumLandDegree >= 5);
  assert.equal(result.invariantHolds, true);
});

test('maximum-ocean closing preserves more coast without leaving small faces', () => {
  const minimum = closeGeneratedMap(false);
  const maximum = closeGeneratedMap(true);

  assert.ok(maximum.oceanDegree > minimum.oceanDegree);
  assert.ok(maximum.minimumLandDegree >= 5);
  assert.equal(maximum.invariantHolds, true);
});

test('closing a mature map never creates a face smaller than F5', () => {
  for (const maximizeOcean of [false, true]) {
    const createdDegrees = closingFaceDegrees(maximizeOcean);
    assert.ok(
      createdDegrees.every(degree => degree >= 5),
      `closing created ${createdDegrees.filter(degree => degree < 5).join(', ')}`,
    );
  }
});

test('one visible closing step never exposes a newly created face below F5', () => {
  for (const maximizeOcean of [false, true]) {
    const visibleDegrees = visibleYoungClosingFaceDegrees(maximizeOcean);
    assert.ok(
      visibleDegrees.every(degree => degree >= 5),
      `visible closing step exposed ${visibleDegrees.filter(degree => degree < 5).join(', ')}`,
    );
  }
});

test('closing strategies choose their globally preferred legal move', () => {
  for (const maximizeOcean of [false, true]) {
    const trace = closeMoveTrace({ seed: 4, growthSteps: 10, closeSteps: 12, maximizeOcean });
    assert.deepEqual(
      trace.map(({ expectedK, actualK }) => actualK),
      trace.map(({ expectedK }) => expectedK),
    );
  }
});

test('restoring history synchronizes the visible ocean strategy', () => {
  assert.deepEqual(restoredCloseStrategy({ closingSnapshot: true, pendingPreference: false }), {
    closingMaximizeOcean: true,
    checkboxChecked: true,
  });
});

test('ordinary history navigation preserves a pending ocean preference', () => {
  assert.deepEqual(restoredCloseStrategy({ closingSnapshot: false, pendingPreference: false }), {
    closingMaximizeOcean: true,
    checkboxChecked: false,
  });
});

test('Ship log largest face includes the ocean', () => {
  assert.equal(measureLargestFace({ landDegrees: [5, 8, 11], oceanDegree: 14 }), 14);
});

test('Ship log largest face still reports a larger land face', () => {
  assert.equal(measureLargestFace({ landDegrees: [5, 17, 11], oceanDegree: 14 }), 17);
});

test('detailed statistics include the ocean, topology, and measures', () => {
  const { statistics } = measureDetailedStatistics();

  assert.deepEqual(statistics.faceCounts, {
    f2: 1, f3: 1, f4: 1, f5: 1, f6: 2, above6: 1,
  });
  assert.equal(statistics.vertices, 8);
  assert.equal(statistics.edges, 13);
  assert.equal(statistics.internalFaces, 2);
  assert.equal(statistics.oceanFacingFaces, 4);
  assert.equal(statistics.minimumFaceDegree, 2);
  assert.ok(Math.abs(statistics.averageFaceDegree - 33 / 7) < 1e-12);
  assert.equal(statistics.maximumFaceDegree, 7);
  assert.equal(statistics.oceanDegree, 6);
  assert.ok(Math.abs(statistics.oceanPerimeter - 6) < 1e-12);
  assert.equal(statistics.moves, 12);
  assert.equal(statistics.fallbacks, 3);
  assert.deepEqual(statistics.invariant, { valid: true, value: 6 });
});

test('zero-valued face classes are omitted from detailed statistics', () => {
  assert.deepEqual(measureDetailedStatistics().visibleRows, [
    ['F3', 2], ['F5', 4], ['> F6', 1],
  ]);
});

test('Ship log exposes an accessible statistics popup', () => {
  const ledger = html.match(/<div class="panel ledger">[\s\S]*?<\/div>\s*<\/div>/)?.[0];
  assert.ok(ledger, 'Ship log panel not found');
  assert.match(ledger, /<button id="statsToggle"[^>]*aria-expanded="false"[^>]*aria-haspopup="dialog"/);
  assert.match(ledger, /<div id="statsPopup"[^>]*role="dialog"[^>]*hidden>/);
  assert.match(ledger, /id="faceDistribution"/);
  assert.match(ledger, /id="topologyStatistics"/);
  assert.match(ledger, /id="measureStatistics"/);
});

test('statistics popup omits ocean perimeter, moves, and invariant', () => {
  const start = html.indexOf('<div id="statsPopup"');
  const end = html.indexOf('\n</div>\n\n<div class="panel full-toast"', start);
  assert.notEqual(start, -1, 'statistics popup not found');
  assert.notEqual(end, -1, 'statistics popup boundary not found');
  const popup = html.slice(start, end);
  assert.doesNotMatch(popup, /Ocean perimeter|id="dOceanPerimeter"/);
  assert.doesNotMatch(popup, />Moves<|id="dMoves"/);
  assert.doesNotMatch(popup, />Invariant<|id="dInvariant"/);
});

test('controls expose a checked icon-only Maximize ocean flag', () => {
  const label = html.match(/<label class="close-option"[\s\S]*?<\/label>/)?.[0];

  assert.ok(label, 'ocean strategy control not found');
  assert.match(label, /title="Maximize ocean"/);
  assert.match(label, /<input id="maximizeOcean" type="checkbox" checked aria-label="Maximize ocean">/);
  assert.doesNotMatch(label, /<span>/);
});

test('primary controls are ordered Previous, Play, Close, Next', () => {
  const group = html.match(/<div class="ctrl-group primary-controls">[\s\S]*?<\/div>/)?.[0];
  assert.ok(group, 'primary controls not found');

  const orderedIds = ['btnPrev', 'btnRun', 'btnClose', 'btnNext'];
  const positions = orderedIds.map(id => group.indexOf(`id="${id}"`));
  assert.ok(positions.every(position => position >= 0), 'one or more primary controls are missing');
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test('speed control opens as a hidden vertical popover', () => {
  const control = html.match(/<div class="ctrl-group pace">[\s\S]*?<\/div>\s*<\/div>/)?.[0];
  assert.ok(control, 'speed popover control not found');
  assert.match(control, /<button id="speedToggle"[^>]*aria-expanded="false"[^>]*>/);
  assert.match(control, /aria-haspopup="dialog"/);
  assert.match(control, /<div id="speedPopover"[^>]*hidden>/);
  assert.match(control, /<input id="speed" type="range"[^>]*aria-orientation="vertical"/);
  assert.match(html, /#speedPopover[^}]*position:absolute[^}]*bottom:/);
  assert.match(html, /#speed[^}]*writing-mode:vertical-lr/);
});

test('speed popover toggles, closes outside, and returns focus on Escape', () => {
  assert.deepEqual(exerciseSpeedPopover().speed, {
    opened: { hidden: false, expanded: 'true', sliderFocuses: 1, toggleFocuses: 0 },
    closedByToggle: { hidden: true, expanded: 'false', sliderFocuses: 1, toggleFocuses: 0 },
    closedOutside: { hidden: true, expanded: 'false', sliderFocuses: 2, toggleFocuses: 0 },
    closedByEscape: { hidden: true, expanded: 'false', sliderFocuses: 3, toggleFocuses: 1 },
  });
});

test('statistics popup toggles, refreshes, closes outside, and returns focus on Escape', () => {
  assert.deepEqual(exerciseSpeedPopover().statistics, {
    opened: { hidden: false, expanded: 'true', popupFocuses: 1, toggleFocuses: 0, updates: 1 },
    closedByToggle: { hidden: true, expanded: 'false', popupFocuses: 1, toggleFocuses: 0, updates: 1 },
    closedOutside: { hidden: true, expanded: 'false', popupFocuses: 2, toggleFocuses: 0, updates: 2 },
    closedByEscape: { hidden: true, expanded: 'false', popupFocuses: 3, toggleFocuses: 1, updates: 3 },
  });
});

test('a frame stops batching as soon as closing stops the run', () => {
  assert.deepEqual([frameBatchCalls(40), frameBatchCalls(39)], [1, 1]);
});

test('two touch pointers pinch without rotating the globe', () => {
  const result = exerciseCameraPointers([
    { target: 'canvas', type: 'pointerdown', pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 422 },
    { target: 'canvas', type: 'pointerdown', pointerId: 2, pointerType: 'touch', clientX: 260, clientY: 422 },
    { target: 'canvas', type: 'touchmove', touches: [
      { clientX: 130, clientY: 422 }, { clientX: 260, clientY: 422 },
    ] },
    { target: 'canvas', type: 'pointermove', pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 422 },
    { target: 'canvas', type: 'pointermove', pointerId: 2, pointerType: 'touch', clientX: 270, clientY: 422 },
    { target: 'canvas', type: 'touchmove', touches: [
      { clientX: 120, clientY: 422 }, { clientX: 270, clientY: 422 },
    ] },
  ]);

  assert.ok(Math.abs(result.zoom - 150 / 130) < 1e-12, `expected one pinch ratio, got ${result.zoom}`);
  assert.deepEqual(result.camera, result.initialCamera);
});

test('one touch pointer still rotates the globe', () => {
  const result = exerciseCameraPointers([
    { target: 'canvas', type: 'pointerdown', pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 422 },
    { target: 'canvas', type: 'pointermove', pointerId: 1, pointerType: 'touch', clientX: 135, clientY: 422 },
  ]);

  assert.ok(Math.abs(result.camera[0] - 0.9995579484716745) < 1e-12);
  assert.ok(Math.abs(result.camera[2] - 0.02609104239963213) < 1e-12);
});

test('a stationary single-touch tap still opens the color picker', () => {
  const result = exerciseCameraPointers([
    { target: 'canvas', type: 'pointerdown', pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 422 },
    { target: 'window', type: 'pointerup', pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 422 },
  ]);

  assert.equal(result.colorPickerOpens, 1);
});

test('the wheel still zooms the globe', () => {
  const result = exerciseCameraPointers([
    { target: 'canvas', type: 'wheel', deltaY: -100 },
  ]);

  assert.ok(Math.abs(result.zoom - Math.exp(0.12)) < 1e-12);
});

test('double-click still applies its zoom step', () => {
  const result = exerciseCameraPointers([
    { target: 'canvas', type: 'dblclick', clientX: 195, clientY: 422 },
  ]);

  assert.equal(result.zoom, 2.4);
});

test('the remaining finger resumes dragging from its current position after a pinch', () => {
  const result = exerciseCameraPointers([
    { target: 'canvas', type: 'pointerdown', pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 422 },
    { target: 'canvas', type: 'pointerdown', pointerId: 2, pointerType: 'touch', clientX: 260, clientY: 422 },
    { target: 'canvas', type: 'pointermove', pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 422 },
    { target: 'canvas', type: 'pointermove', pointerId: 2, pointerType: 'touch', clientX: 270, clientY: 422 },
    { target: 'window', type: 'pointerup', pointerId: 2, pointerType: 'touch', clientX: 270, clientY: 422 },
    { target: 'canvas', type: 'pointermove', pointerId: 1, pointerType: 'touch', clientX: 125, clientY: 422 },
  ]);
  const expectedCamera = [
    0.9995357800271572, 0.014606550537931104, 0.0267371114162553,
    0, 0.8775825618903728, -0.479425538604203,
    -0.030466776093022785, 0.47920297969369197, 0.8771751705373246,
  ];

  result.camera.forEach((value, index) => {
    assert.ok(
      Math.abs(value - expectedCamera[index]) < 1e-12,
      `camera entry ${index} started from the wrong post-pinch position`,
    );
  });
});

test('a cancelled pinch also rebases dragging to the remaining finger', () => {
  const result = exerciseCameraPointers([
    { target: 'canvas', type: 'pointerdown', pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 422 },
    { target: 'canvas', type: 'pointerdown', pointerId: 2, pointerType: 'touch', clientX: 260, clientY: 422 },
    { target: 'canvas', type: 'pointermove', pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 422 },
    { target: 'canvas', type: 'pointermove', pointerId: 2, pointerType: 'touch', clientX: 270, clientY: 422 },
    { target: 'canvas', type: 'pointercancel', pointerId: 2, pointerType: 'touch', clientX: 270, clientY: 422 },
    { target: 'canvas', type: 'pointermove', pointerId: 1, pointerType: 'touch', clientX: 125, clientY: 422 },
  ]);

  assert.ok(Math.abs(result.camera[0] - 0.9995357800271572) < 1e-12);
  assert.ok(Math.abs(result.camera[2] - 0.0267371114162553) < 1e-12);
});

test('an unrelated touch release cannot consume a canvas tap', () => {
  const result = exerciseCameraPointers([
    { target: 'canvas', type: 'pointerdown', pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 422 },
    { target: 'window', type: 'pointerup', pointerId: 99, pointerType: 'touch', clientX: 300, clientY: 200 },
    { target: 'window', type: 'pointerup', pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 422 },
  ]);

  assert.equal(result.colorPickerOpens, 1);
});

test('an unrelated pointer cancellation cannot interrupt an active pinch', () => {
  const result = exerciseCameraPointers([
    { target: 'canvas', type: 'pointerdown', pointerId: 1, pointerType: 'touch', clientX: 130, clientY: 422 },
    { target: 'canvas', type: 'pointerdown', pointerId: 2, pointerType: 'touch', clientX: 260, clientY: 422 },
    { target: 'canvas', type: 'pointercancel', pointerId: 99, pointerType: 'mouse', clientX: 300, clientY: 200 },
    { target: 'canvas', type: 'pointermove', pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 422 },
    { target: 'canvas', type: 'pointermove', pointerId: 2, pointerType: 'touch', clientX: 270, clientY: 422 },
  ]);

  assert.ok(Math.abs(result.zoom - 150 / 130) < 1e-12, `expected uninterrupted pinch, got ${result.zoom}`);
});

test('automatic history replay stops on the completed closure snapshot', () => {
  const { terminal, replay } = closeReplayBehavior();

  assert.deepEqual(terminal.smallFaces, []);
  assert.deepEqual(replay, {
    steps: 1,
    running: false,
    faceCount: terminal.faceCount,
    moves: terminal.moves,
    smallFaces: [],
  });
});

test('explicit growth from a completed closure invalidates the closed state', () => {
  const { terminal, explicitResume } = closeReplayBehavior();

  assert.equal(explicitResume.advanced, true);
  assert.equal(explicitResume.closeDone, false);
  assert.equal(explicitResume.closeToastVisible, false);
  assert.ok(explicitResume.faceCount > terminal.faceCount);
  assert.ok(explicitResume.moves > terminal.moves);
});
