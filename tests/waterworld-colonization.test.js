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

function measureShipLogStatistics() {
  const algorithm = growthAlgorithm();
  assert.notEqual(algorithm.indexOf('function shipLogStatistics()'), -1, 'Ship log statistics not found');

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
    return shipLogStatistics();
  `);

  return run();
}

function categoryFillStates() {
  const algorithm = growthAlgorithm();
  assert.notEqual(
    algorithm.indexOf('const categoryColorEnabled='),
    -1,
    'category color state not found',
  );

  const run = new Function(`${algorithm}
    categoryColorEnabled.f5 = false;
    const result = {
      exposed: faceFill({ n: 5, sealed: false, color: null }),
      sealed: faceFill({ n: 5, sealed: true, color: null }),
      enabled: faceFill({ n: 6, sealed: false, color: null }),
      custom: faceFill({ n: 5, sealed: false, color: '#123456' }),
    };
    catColors.f5 = '#123456';
    categoryColorEnabled.f5 = true;
    result.restored = faceFill({ n: 5, sealed: false, color: null });
    return result;
  `);

  return run();
}

function classifiedVertexFixture() {
  const algorithm = growthAlgorithm();
  assert.notEqual(
    algorithm.indexOf('function vertexConfigurations()'),
    -1,
    'vertex configuration classifier not found',
  );

  const run = new Function(`${algorithm}
    const coastal={name:'coastal'}, internal={name:'internal'};
    const shore=[coastal,{name:'s1'},{name:'s2'},{name:'s3'},{name:'s4'},{name:'s5'}];
    const fillers=Array.from({length:12},(_,i)=>({name:'p'+i}));
    faces=[
      {n:7,vertices:[internal,...fillers.slice(0,6)]},
      {n:5,vertices:[coastal,internal,...fillers.slice(6,9)]},
      {n:6,vertices:[internal,...fillers.slice(0,5)]},
      {n:5,vertices:[coastal,...fillers.slice(2,6)]},
    ];
    coast=shore.map((a,i)=>({a,b:shore[(i+1)%shore.length]}));
    return vertexConfigurations()
      .filter(item=>item.vertex===coastal || item.vertex===internal)
      .map(item=>({name:item.vertex.name,degrees:item.degrees,signature:item.signature}))
      .sort((a,b)=>a.name.localeCompare(b.name));
  `);

  return run();
}

function classifiedVertexCounts() {
  const algorithm = growthAlgorithm();
  const run = new Function(`${algorithm}
    const coastal={name:'coastal'}, internal={name:'internal'};
    const shore=[coastal,{name:'s1'},{name:'s2'},{name:'s3'},{name:'s4'},{name:'s5'}];
    const fillers=Array.from({length:18},(_,i)=>({name:'p'+i}));
    faces=[
      {n:7,sealed:false,vertices:[internal,...fillers.slice(0,6)]},
      {n:5,sealed:false,vertices:[coastal,internal,...fillers.slice(6,9)]},
      {n:6,sealed:true,vertices:[internal,...fillers.slice(9,14)]},
      {n:5,sealed:false,vertices:[coastal,...fillers.slice(14,18)]},
    ];
    coast=shore.map((a,i)=>({a,b:shore[(i+1)%shore.length]}));
    return shipLogStatistics().vertexCounts;
  `);

  return run();
}

function renderShipLogStatistics() {
  const start = html.indexOf('function updateStats()');
  const end = html.indexOf('\nconst FRAME_BUDGET_MS', start);
  assert.notEqual(start, -1, 'Ship log update not found');
  assert.notEqual(end, -1, 'Ship log update boundary not found');

  const elements = Object.fromEntries([
    'sF', 'sC', 's2', 's3', 's4', 's5', 's6', 'sW', 'sMax',
    'sVertices', 'sEdges', 'sInternal', 'sFB', 'sInv',
    'sV555', 'sV556', 'sV557', 'sV558', 'sV559', 'sV566', 'sV567',
    'row2', 'row3', 'row4', 'rowFB',
  ].map(id => [id, {
    textContent: '',
    className: '',
    classes: {},
    classList: { toggle(name, force) { elements[id].classes[name] = force; } },
  }]));
  const document = { getElementById: id => elements[id] };
  const statistics = {
    faceCounts: { f2: 0, f3: 2, f4: 1, f5: 2, f6: 0, above6: 1 },
    vertices: 19,
    edges: 31,
    internalFaces: 7,
    vertexCounts: { 555: 1, 556: 2, 557: 3, 558: 4, 559: 5, 566: 6, 567: 7 },
  };
  const faces = [{ n: 5 }];
  const coast = new Array(5);

  const run = new Function(
    'document', 'elements', 'faces', 'coast', 'fallbackCount', 'moves', 'invOK', 'sumLand',
    'shipLogStatistics', 'largestFaceDegree', 'syncControls', 'VERTEX_CONFIGURATION_TYPES',
    `${html.slice(start, end)}
      updateStats();
      return {
        values: Object.fromEntries(Object.entries(elements).map(([id, el]) => [id, el.textContent])),
        hidden: Object.fromEntries(['row2', 'row3', 'row4'].map(id => [id, elements[id].classes.hidden])),
      };
    `,
  );

  return run(
    document, elements, faces, coast, 0, 1, true, 11,
    () => statistics, () => 5, () => {}, ['555','556','557','558','559','566','567'],
  );
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
  const functionStart = html.indexOf('function setSpeedPopover(open)');
  const handlerStart = html.indexOf('speedToggle.onclick', functionStart);
  const handlerEnd = html.indexOf('function setShipLogView(view)', handlerStart);
  const keydownStart = html.indexOf("addEventListener('keydown'", handlerEnd);
  const keydownEnd = html.indexOf("document.getElementById('closeToastX')", keydownStart);
  assert.notEqual(functionStart, -1, 'speed popover function not found');
  assert.notEqual(handlerStart, -1, 'speed popover handlers not found');
  assert.notEqual(handlerEnd, -1, 'speed popover handler boundary not found');
  assert.notEqual(keydownStart, -1, 'keyboard handler not found');
  assert.notEqual(keydownEnd, -1, 'keyboard handler boundary not found');
  const source = html.slice(functionStart, handlerEnd)
    + html.slice(keydownStart, keydownEnd);

  const run = new Function(
    'speedToggle', 'speedPopover', 'speedEl', 'listeners', 'addEventListener',
    'HTMLInputElement', 'manualStep', 'setCategoryColorPopover', 'setVertexFilterPopover',
    `${source}
      const speedState = () => ({
        hidden: speedPopover.hidden,
        expanded: speedToggle.attributes['aria-expanded'],
        sliderFocuses: speedEl.focuses,
        toggleFocuses: speedToggle.focuses,
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
      return {
        speed: {
          opened: speedOpened, closedByToggle: speedClosedByToggle,
          closedOutside: speedClosedOutside, closedByEscape: speedClosedByEscape,
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
  const addEventListener = (type, handler) => { (listeners[type] ||= []).push(handler); };
  let categoryPopoverCloses = 0;
  let vertexPopoverCloses = 0;
  const setCategoryColorPopover = cat => { if(cat===null) categoryPopoverCloses++; };
  const setVertexFilterPopover = open => { if(open===false) vertexPopoverCloses++; };

  const result = run(
    speedToggle, speedPopover, speedEl, listeners, addEventListener, class {}, () => {},
    setCategoryColorPopover, setVertexFilterPopover,
  );
  result.categoryPopoverCloses=categoryPopoverCloses;
  result.vertexPopoverCloses=vertexPopoverCloses;
  return result;
}

function exerciseShipLogViewToggle() {
  const start = html.indexOf('let shipLogView=');
  const end = html.indexOf("\naddEventListener('keydown'", start);
  assert.notEqual(start, -1, 'Ship log view toggle not found');
  assert.notEqual(end, -1, 'Ship log view toggle boundary not found');

  const shipLog = {
    classes: new Set(),
    classList: {
      toggle(name, force) {
        if (force) shipLog.classes.add(name); else shipLog.classes.delete(name);
      },
      contains(name) { return shipLog.classes.has(name); },
    },
  };
  const logViewToggle = {
    title: "Show extended ship's log",
    attributes: { 'aria-label': "Show extended ship's log" },
    setAttribute(name, value) { this.attributes[name] = value; },
  };
  const run = new Function('shipLog', 'logViewToggle', `${html.slice(start, end)}
    const state = () => ({
      view: shipLogView,
      extended: shipLog.classList.contains('extended'),
      collapsed: shipLog.classList.contains('collapsed'),
      title: logViewToggle.title,
      ariaLabel: logViewToggle.attributes['aria-label'],
    });
    const initial = state();
    logViewToggle.onclick();
    const expanded = state();
    logViewToggle.onclick();
    const collapsed = state();
    logViewToggle.onclick();
    return { initial, expanded, collapsed, basic: state() };
  `);

  return run(shipLog, logViewToggle);
}

function compactSelectorIsHidden(selector) {
  const start = html.indexOf('@media (max-width:760px)');
  const end = html.indexOf('@media (max-width:360px)', start);
  assert.notEqual(start, -1, 'compact media query not found');
  assert.notEqual(end, -1, 'compact media query boundary not found');
  const rules = [...html.slice(start, end).matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  return rules.some(([, selectors, body]) =>
    selectors.split(',').map(value => value.trim()).includes(selector)
      && /(?:^|;)\s*display\s*:\s*none\s*(?:;|$)/.test(body),
  );
}

function exerciseCategoryColorPopover() {
  const start = html.indexOf('function syncCategoryColorControl(cat)');
  const end = html.indexOf('\nfunction setVertexFilterPopover(open)', start);
  assert.notEqual(start, -1, 'category color controls not found');
  assert.notEqual(end, -1, 'category color control boundary not found');

  const makeButton = () => {
    const classes = new Set();
    return {
      attributes: { 'aria-expanded': 'false' },
      classList: {
        toggle(name, force) { if(force) classes.add(name); else classes.delete(name); },
        contains(name) { return classes.has(name); },
      },
      style: {}, title: '', focuses: 0,
      setAttribute(name, value) { this.attributes[name] = value; },
      focus() { this.focuses++; },
    };
  };
  const colorSwatches = new Map([['f5', makeButton()], ['f6', makeButton()], ['f7', makeButton()]]);
  const colorPopover = {
    hidden: true, attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
  };
  const categoryColorPicker = { value: '', attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } };
  const colorEnabledToggle = { title: '', attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } };
  const colorDisabledSlash = { hidden: true };
  const categoryColorEnabled = { f5: true, f6: true, f7: true };
  const catColors = { small: '#93C3E2', f5: '#FF2E2E', f6: '#22E04A', f7: '#2E7DFF' };
  const CATEGORY_LABELS = { f5: 'F5', f6: 'F6', f7: '> F6' };
  const listeners = {};
  const addEventListener = (type, handler) => { (listeners[type] ||= []).push(handler); };
  const speedPopoverStates = [];
  const vertexPopoverStates = [];
  const setSpeedPopover = open => speedPopoverStates.push(open);
  const setVertexFilterPopover = open => vertexPopoverStates.push(open);

  const run = new Function(
    'colorSwatches', 'colorPopover', 'categoryColorPicker', 'colorEnabledToggle',
    'colorDisabledSlash', 'categoryColorEnabled', 'catColors', 'CATEGORY_LABELS',
    'listeners', 'addEventListener', 'setSpeedPopover', 'setVertexFilterPopover',
    'speedPopoverStates', 'vertexPopoverStates', 'activeColorCategory',
    `${html.slice(start, end)}
      const snapshot = cat => ({
        activeColorCategory,
        popoverHidden: colorPopover.hidden,
        expanded: colorSwatches.get(cat).attributes['aria-expanded'],
        disabled: colorSwatches.get(cat).classList.contains('disabled'),
        swatchColor: colorSwatches.get(cat).style.backgroundColor,
        toggleLabel: colorEnabledToggle.attributes['aria-label'],
        togglePressed: colorEnabledToggle.attributes['aria-pressed'],
        slashHidden: colorDisabledSlash.hidden,
        pickerValue: categoryColorPicker.value,
      });
      const event = { stopPropagation() {} };
      colorSwatches.get('f5').onclick(event);
      const opened = snapshot('f5');
      colorEnabledToggle.onclick(event);
      const disabled = snapshot('f5');
      categoryColorPicker.value = '#123456';
      categoryColorPicker.oninput();
      const recoloredWhileDisabled = snapshot('f5');
      colorEnabledToggle.onclick(event);
      const reenabled = snapshot('f5');
      colorSwatches.get('f5').onclick(event);
      const closed = snapshot('f5');
      colorSwatches.get('f5').onclick(event);
      for (const handler of listeners.keydown || []) handler({ key: 'Escape' });
      const closedByEscape = {
        ...snapshot('f5'),
        swatchFocuses: colorSwatches.get('f5').focuses,
      };
      return {
        opened, disabled, recoloredWhileDisabled, reenabled, closed, closedByEscape,
        speedPopoverStates, vertexPopoverStates,
      };
    `,
  );

  return run(
    colorSwatches, colorPopover, categoryColorPicker, colorEnabledToggle,
    colorDisabledSlash, categoryColorEnabled, catColors, CATEGORY_LABELS,
    listeners, addEventListener, setSpeedPopover, setVertexFilterPopover,
    speedPopoverStates, vertexPopoverStates, null,
  );
}

function exerciseVertexFilterPopover() {
  const start = html.indexOf('function setVertexFilterPopover(open)');
  const end = html.indexOf('\nlet pendingColorFace', start);
  assert.notEqual(start, -1, 'vertex filter controls not found');
  assert.notEqual(end, -1, 'vertex filter control boundary not found');

  const makeButton = signature => {
    const classes = new Set();
    return {
      dataset: signature ? { signature } : {},
      attributes: signature ? { 'aria-pressed': 'false' } : { 'aria-expanded': 'false' },
      classList: {
        toggle(name, force) { if(force) classes.add(name); else classes.delete(name); },
        contains(name) { return classes.has(name); },
      },
      title: '', focuses: 0,
      setAttribute(name, value) { this.attributes[name] = value; },
      focus() { this.focuses++; },
    };
  };
  const vertexFilterToggle = makeButton();
  const vertexFilterPopover = { hidden: true };
  const vertexFilterOptions = ['555','556','557','558','559','566','567'].map(makeButton);
  const selectedVertexConfigurations = new Set();
  const listeners = {};
  const addEventListener = (type, handler) => { (listeners[type] ||= []).push(handler); };
  const speedPopoverStates=[];
  const categoryPopoverStates=[];
  const setSpeedPopover = open => speedPopoverStates.push(open);
  const setCategoryColorPopover = cat => categoryPopoverStates.push(cat);

  const run = new Function(
    'vertexFilterToggle', 'vertexFilterPopover', 'vertexFilterOptions',
    'selectedVertexConfigurations', 'listeners', 'addEventListener',
    'setSpeedPopover', 'setCategoryColorPopover', 'speedPopoverStates', 'categoryPopoverStates',
    `${html.slice(start, end)}
      const snapshot = () => ({
        hidden: vertexFilterPopover.hidden,
        expanded: vertexFilterToggle.attributes['aria-expanded'],
        active: vertexFilterToggle.classList.contains('active'),
        label: vertexFilterToggle.attributes['aria-label'],
        title: vertexFilterToggle.title,
        selected: [...selectedVertexConfigurations],
        pressed: Object.fromEntries(vertexFilterOptions.map(option=>[
          option.dataset.signature, option.attributes['aria-pressed'],
        ])),
        toggleFocuses: vertexFilterToggle.focuses,
      });
      const event={stopPropagation(){}};
      vertexFilterToggle.onclick(event);
      const opened=snapshot();
      vertexFilterOptions[0].onclick(event);
      vertexFilterOptions[6].onclick(event);
      const twoSelected=snapshot();
      vertexFilterOptions[0].onclick(event);
      const oneSelected=snapshot();
      vertexFilterToggle.onclick(event);
      vertexFilterToggle.onclick(event);
      const reopened=snapshot();
      for(const handler of listeners.keydown || []) handler({key:'Escape'});
      return {
        opened,twoSelected,oneSelected,reopened,closedByEscape:snapshot(),
        speedPopoverStates,categoryPopoverStates,
      };
    `,
  );

  return run(
    vertexFilterToggle, vertexFilterPopover, vertexFilterOptions,
    selectedVertexConfigurations, listeners, addEventListener,
    setSpeedPopover, setCategoryColorPopover, speedPopoverStates, categoryPopoverStates,
  );
}

function renderedVertexHighlights(selectedSignatures, zoom=1) {
  const start = html.indexOf('function drawVertexHighlights()');
  const end = html.indexOf('\nfunction draw(){', start);
  assert.notEqual(start, -1, 'vertex highlight renderer not found');
  assert.notEqual(end, -1, 'vertex highlight renderer boundary not found');

  const ctx = {
    globalAlpha:1, fillStyle:'', current:[], marks:[], stack:[],
    save(){ this.stack.push({globalAlpha:this.globalAlpha,fillStyle:this.fillStyle}); },
    restore(){ Object.assign(this,this.stack.pop()); },
    beginPath(){ this.current=[]; },
    arc(x,y,r){ this.current.push({x,y,r}); },
    fill(){
      for(const arc of this.current){
        this.marks.push({...arc,r:Number(arc.r.toFixed(6)),alpha:this.globalAlpha,color:this.fillStyle});
      }
    },
  };
  const configurations = [
    {vertex:{x:10,y:20,v:true},signature:'555'},
    {vertex:{x:30,y:40,v:false},signature:'567'},
    {vertex:{x:50,y:60,v:true},signature:'556'},
  ];
  const run = new Function(
    'ctx','scale','zoom','selectedVertexConfigurations','vertexConfigurations','projTo','clamp',
    `${html.slice(start,end)}
      drawVertexHighlights();
      return ctx.marks;
    `,
  );
  return run(
    ctx, 2, zoom, new Set(selectedSignatures), () => configurations,
    (vertex,out) => Object.assign(out,vertex),
    (value,min,max) => Math.max(min,Math.min(max,value)),
  );
}

function selectedConfigurationsAcrossLifecycle() {
  const run = new Function('Math', `${historyAlgorithm()}
    const btnRun={disabled:false,classList:{remove(){}}};
    const btnClose={disabled:false,title:''};
    const closeToast={classList:{add(){},remove(){}}};
    const fullToast={classList:{add(){},remove(){}}};
    const maximizeOceanEl={checked:true};
    const selectedVertexConfigurations=new Set(['555','567']);
    function setRunIcon(){}
    function syncControls(){}
    function hideFullToast(){}
    const state=()=>[...selectedVertexConfigurations];

    reset();
    const afterInitialReset=state();
    stepForward();
    const afterGrowth=state();
    stepBack();
    const afterStepBack=state();
    stepForward();
    const afterStepForward=state();
    reset();
    return {afterInitialReset,afterGrowth,afterStepBack,afterStepForward,afterRestart:state()};
  `);
  return run(seededMath(11));
}

function narrowPhoneBreakpoint() {
  const marker=html.indexOf('.icon-btn{padding:4px}');
  assert.notEqual(marker,-1,'narrow-phone icon sizing not found');
  const mediaStart=html.lastIndexOf('@media (max-width:',marker);
  const match=html.slice(mediaStart,marker).match(/@media \(max-width:(\d+)px\)/);
  assert.ok(match,'narrow-phone breakpoint not found');
  return Number(match[1]);
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
    const ACCUMULATOR_EPSILON = 1e-9;
    ${html.slice(start, end)}
    frame(1000);
    return calls;
  `);

  return run(speedValue);
}

function movesAcrossTenSeconds(speedValue) {
  const start = html.indexOf('function frame(now){');
  const end = html.indexOf('\nupdateStats();', start);
  assert.notEqual(start, -1, 'animation frame not found');
  assert.notEqual(end, -1, 'animation frame boundary not found');

  const run = new Function('speedValue', `
    let running = true, last = 0, acc = 0, statT = 0;
    const speedEl = { value: speedValue, max: 40 };
    let calls = 0;
    const performance = { now() { return 0; } };
    function canStepForward() { return true; }
    function stepForward() { calls++; return true; }
    function draw() {}
    function updateStats() {}
    function requestAnimationFrame() {}
    const FRAME_BUDGET_MS = 14;
    const ACCUMULATOR_EPSILON = 1e-9;
    ${html.slice(start, end)}
    for (let frameNumber = 1; frameNumber <= 600; frameNumber++) {
      frame(frameNumber * 1000 / 60);
    }
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

test('Ship log statistics include the ocean and topology', () => {
  const statistics = measureShipLogStatistics();

  assert.deepEqual(statistics.faceCounts, {
    f2: 1, f3: 1, f4: 1, f5: 1, f6: 2, above6: 1,
  });
  assert.equal(statistics.vertices, 8);
  assert.equal(statistics.edges, 13);
  assert.equal(statistics.internalFaces, 2);
});

test('disabled category colors use neutral blue without overriding custom face colors', () => {
  assert.deepEqual(categoryFillStates(), {
    exposed: '#93C3E2',
    sealed: '#516b7c',
    enabled: '#22E04A',
    custom: '#123456',
    restored: '#123456',
  });
});

test('vertex configurations are sorted and include the ocean as an adjacent face', () => {
  assert.deepEqual(classifiedVertexFixture(), [
    { name: 'coastal', degrees: [5, 5, 6], signature: '556' },
    { name: 'internal', degrees: [5, 6, 7], signature: '567' },
  ]);
});

test('compact cartouche leaves only the Waterworld colonization title visible', () => {
  assert.equal(compactSelectorIsHidden('.eyebrow'), true);
  assert.equal(compactSelectorIsHidden('.subtitle'), true);
  assert.equal(compactSelectorIsHidden('.title'), false);
  assert.match(html, /<div class="title">Waterworld colonization<\/div>/);
});

test('Ship log exposes title-only, basic, and extended inline views', () => {
  const ledger = html.match(/<div class="panel ledger"[^>]*>[\s\S]*?<\/div>\s*<\/div>/)?.[0];
  assert.ok(ledger, 'Ship log panel not found');
  assert.match(ledger, /id="shipLog"/);
  assert.match(ledger, /<button id="logViewToggle"[^>]*title="Show extended ship's log"[^>]*aria-label="Show extended ship's log"[^>]*aria-controls="shipLogBody"/);
  assert.doesNotMatch(ledger, /id="logViewToggle"[^>]*aria-expanded/);
  assert.match(ledger, /<div class="ledger-body" id="shipLogBody">/);
  assert.match(ledger, /class="[^"]*extended-only[^"]*" id="row2"/);
  assert.match(ledger, /class="[^"]*extended-only[^"]*" id="row3"/);
  assert.match(ledger, /class="[^"]*extended-only[^"]*" id="row4"/);
  assert.match(ledger, /id="sVertices"/);
  assert.match(ledger, /id="sEdges"/);
  assert.match(ledger, /id="sInternal"/);
  for(const signature of ['555','556','557','558','559','566','567']){
    assert.match(ledger, new RegExp(`Vertices ${signature}[\\s\\S]*?id="sV${signature}"`));
  }
  assert.match(html, /\.ledger\.collapsed \.ledger-body\{display:none\}/);
  assert.doesNotMatch(ledger, /statsPopup|Statistics/);
});

test('Ship log classifies unavoidable vertex sets, including the ocean face', () => {
  assert.deepEqual(classifiedVertexCounts(), {
    555: 0, 556: 1, 557: 0, 558: 0, 559: 0, 566: 0, 567: 1,
  });
});

test('Ship log uses ocean-inclusive face counts and hides empty extended classes', () => {
  const { values, hidden } = renderShipLogStatistics();
  assert.deepEqual(
    { f2: values.s2, f3: values.s3, f4: values.s4, f5: values.s5, f6: values.s6, above6: values.sW },
    { f2: 0, f3: 2, f4: 1, f5: 2, f6: 0, above6: 1 },
  );
  assert.deepEqual(
    { vertices: values.sVertices, edges: values.sEdges, internalFaces: values.sInternal },
    { vertices: 19, edges: 31, internalFaces: 7 },
  );
  assert.deepEqual(
    Object.fromEntries(['555','556','557','558','559','566','567'].map(type => [type, values['sV'+type]])),
    { 555: 1, 556: 2, 557: 3, 558: 4, 559: 5, 566: 6, 567: 7 },
  );
  assert.deepEqual(hidden, { row2: true, row3: false, row4: false });
});

test('controls explain the checked ocean-closing preference', () => {
  const label = html.match(/<label class="close-option"[\s\S]*?<\/label>/)?.[0];

  assert.ok(label, 'ocean strategy control not found');
  assert.match(label, /title="Keep the ocean as large as possible"/);
  assert.match(label, /<input id="maximizeOcean" type="checkbox" checked aria-label="Keep the ocean as large as possible">/);
  assert.doesNotMatch(label, /<span>/);
});

test('category swatches share one color-settings popover without extra checkboxes', () => {
  const controls = html.match(/<div class="ctrl-group swatches">[\s\S]*?<\/div>\s*<\/div>/)?.[0];
  assert.ok(controls, 'category color controls not found');
  assert.match(controls, /<button[^>]*data-category="f5"/);
  assert.match(controls, /<button[^>]*data-category="f6"/);
  assert.match(controls, /<button[^>]*data-category="f7"/);
  assert.match(controls, /<div id="colorPopover"[^>]*role="dialog"[^>]*hidden>/);
  assert.match(controls, /<input id="categoryColorPicker" type="color"/);
  assert.match(controls, /<button id="colorEnabledToggle"/);
  assert.doesNotMatch(controls, /type="checkbox"/);
});

test('category color popover toggles state and remembers a changed color', () => {
  assert.deepEqual(exerciseCategoryColorPopover(), {
    opened: {
      activeColorCategory: 'f5', popoverHidden: false, expanded: 'true', disabled: false,
      swatchColor: '#FF2E2E', toggleLabel: 'Disable F5 color', togglePressed: 'true',
      slashHidden: true, pickerValue: '#FF2E2E',
    },
    disabled: {
      activeColorCategory: 'f5', popoverHidden: false, expanded: 'true', disabled: true,
      swatchColor: '#FF2E2E', toggleLabel: 'Enable F5 color', togglePressed: 'false',
      slashHidden: false, pickerValue: '#FF2E2E',
    },
    recoloredWhileDisabled: {
      activeColorCategory: 'f5', popoverHidden: false, expanded: 'true', disabled: true,
      swatchColor: '#123456', toggleLabel: 'Enable F5 color', togglePressed: 'false',
      slashHidden: false, pickerValue: '#123456',
    },
    reenabled: {
      activeColorCategory: 'f5', popoverHidden: false, expanded: 'true', disabled: false,
      swatchColor: '#123456', toggleLabel: 'Disable F5 color', togglePressed: 'true',
      slashHidden: true, pickerValue: '#123456',
    },
    closed: {
      activeColorCategory: null, popoverHidden: true, expanded: 'false', disabled: false,
      swatchColor: '#123456', toggleLabel: 'Disable F5 color', togglePressed: 'true',
      slashHidden: true, pickerValue: '#123456',
    },
    closedByEscape: {
      activeColorCategory: null, popoverHidden: true, expanded: 'false', disabled: false,
      swatchColor: '#123456', toggleLabel: 'Disable F5 color', togglePressed: 'true',
      slashHidden: true, pickerValue: '#123456', swatchFocuses: 1,
    },
    speedPopoverStates: [false, false, false],
    vertexPopoverStates: [false, false, false],
  });
});

test('vertex configurations use one accessible multi-select popover', () => {
  const control = html.match(/<div class="ctrl-group vertex-filter">[\s\S]*?<\/div>\s*<\/div>/)?.[0];
  assert.ok(control, 'vertex filter control not found');
  assert.match(control, /<button id="vertexFilterToggle"[^>]*title="Unavoidable sets"[^>]*aria-haspopup="dialog"[^>]*aria-expanded="false"/);
  assert.match(control, /<div id="vertexFilterPopover"[^>]*role="dialog"[^>]*hidden>/);
  for(const signature of ['555','556','557','558','559','566','567']){
    assert.match(control, new RegExp(`data-signature="${signature}"[^>]*aria-pressed="false"[^>]*>${signature}<`));
  }
  assert.doesNotMatch(control, /type="checkbox"|<select/);
});

test('vertex configuration popover keeps independent selections and closes on Escape', () => {
  const state=exerciseVertexFilterPopover();
  assert.deepEqual(state.opened, {
    hidden:false, expanded:'true', active:false,
    label:'Highlight vertex configurations', title:'Unavoidable sets', selected:[],
    pressed:{555:'false',556:'false',557:'false',558:'false',559:'false',566:'false',567:'false'},
    toggleFocuses:0,
  });
  assert.deepEqual(state.twoSelected, {
    hidden:false, expanded:'true', active:true,
    label:'2 vertex configurations highlighted', title:'Unavoidable sets', selected:['555','567'],
    pressed:{555:'true',556:'false',557:'false',558:'false',559:'false',566:'false',567:'true'},
    toggleFocuses:0,
  });
  assert.deepEqual(state.oneSelected, {
    hidden:false, expanded:'true', active:true,
    label:'1 vertex configuration highlighted', title:'Unavoidable sets', selected:['567'],
    pressed:{555:'false',556:'false',557:'false',558:'false',559:'false',566:'false',567:'true'},
    toggleFocuses:0,
  });
  assert.deepEqual(state.reopened, state.oneSelected);
  assert.deepEqual(state.closedByEscape, {
    ...state.oneSelected, hidden:true, expanded:'false', toggleFocuses:1,
  });
  assert.deepEqual(state.speedPopoverStates,[false,false,false]);
  assert.deepEqual(state.categoryPopoverStates,[null,null,null]);
});

test('selected vertex configurations render gold markers on both hemispheres', () => {
  assert.deepEqual(renderedVertexHighlights(['555','567'],8), [
    {x:30,y:40,r:3,alpha:0.28,color:'#D3A330'},
    {x:30,y:40,r:1.2,alpha:0.28,color:'#FFF6D6'},
    {x:10,y:20,r:3,alpha:1,color:'#D3A330'},
    {x:10,y:20,r:1.2,alpha:1,color:'#FFF6D6'},
  ]);
  assert.deepEqual(renderedVertexHighlights([]), []);
});

test('vertex markers grow smoothly from 3px to 6px as the map zooms in', () => {
  const radii=zoom=>renderedVertexHighlights(['555'],zoom).map(mark=>mark.r);
  assert.deepEqual(radii(1),[1.5,0.6]);
  assert.deepEqual(radii(2),[2,0.8]);
  assert.deepEqual(radii(4),[2.5,1]);
  assert.deepEqual(radii(8),[3,1.2]);
});

test('vertex configuration selections survive growth, history navigation, and Restart', () => {
  const selected=['555','567'];
  assert.deepEqual(selectedConfigurationsAcrossLifecycle(), {
    afterInitialReset:selected,
    afterGrowth:selected,
    afterStepBack:selected,
    afterStepForward:selected,
    afterRestart:selected,
  });
});

test('the tightened phone toolbar breakpoint includes a 360px viewport', () => {
  assert.ok(narrowPhoneBreakpoint()>=360);
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
  assert.match(control, /<path d="M13 2 4 14h7l-1 8 9-12h-7z"\/>/);
  assert.doesNotMatch(control, /<circle/);
  assert.match(control, /aria-haspopup="dialog"/);
  assert.match(control, /<div id="speedPopover"[^>]*hidden>/);
  assert.match(control, /<input id="speed" type="range"[^>]*aria-orientation="vertical"/);
  assert.match(html, /#speedPopover[^}]*position:absolute[^}]*bottom:/);
  assert.match(html, /#speed[^}]*writing-mode:vertical-lr/);
});

test('speed popover toggles, closes outside, and returns focus on Escape', () => {
  const result=exerciseSpeedPopover();
  assert.deepEqual(result.speed, {
    opened: { hidden: false, expanded: 'true', sliderFocuses: 1, toggleFocuses: 0 },
    closedByToggle: { hidden: true, expanded: 'false', sliderFocuses: 1, toggleFocuses: 0 },
    closedOutside: { hidden: true, expanded: 'false', sliderFocuses: 2, toggleFocuses: 0 },
    closedByEscape: { hidden: true, expanded: 'false', sliderFocuses: 3, toggleFocuses: 1 },
  });
  assert.equal(result.categoryPopoverCloses, 4);
  assert.equal(result.vertexPopoverCloses, 4);
});

test("Ship log cycles from basic to extended to title-only and back", () => {
  assert.deepEqual(exerciseShipLogViewToggle(), {
    initial: {
      view: 'base', extended: false, collapsed: false,
      title: "Show extended ship's log", ariaLabel: "Show extended ship's log",
    },
    expanded: {
      view: 'extended', extended: true, collapsed: false,
      title: "Collapse ship's log", ariaLabel: "Collapse ship's log",
    },
    collapsed: {
      view: 'collapsed', extended: false, collapsed: true,
      title: "Show basic ship's log", ariaLabel: "Show basic ship's log",
    },
    basic: {
      view: 'base', extended: false, collapsed: false,
      title: "Show extended ship's log", ariaLabel: "Show extended ship's log",
    },
  });
});

test('a frame stops batching as soon as closing stops the run', () => {
  assert.deepEqual([frameBatchCalls(40), frameBatchCalls(39)], [1, 1]);
});

test('non-maximum speed stays linear at twice the slider value', () => {
  assert.deepEqual(
    [movesAcrossTenSeconds(1), movesAcrossTenSeconds(7), movesAcrossTenSeconds(39)],
    [20, 140, 780],
  );
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
