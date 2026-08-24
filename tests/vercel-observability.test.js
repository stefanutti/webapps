const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pages = [
  'index.html',
  'aikido.html',
  'split_and_bridge.html',
  'waterworld-colonization.html',
];

const integrations = [
  {
    name: 'Web Analytics',
    bootstrap: 'window.va',
    queue: 'window.vaq',
    script: '/_vercel/insights/script.js',
  },
  {
    name: 'Speed Insights',
    bootstrap: 'window.si',
    queue: 'window.siq',
    script: '/_vercel/speed-insights/script.js',
  },
];

function assignmentCount(html, globalName) {
  const escapedName = globalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`${escapedName}\\s*=`, 'g'))?.length ?? 0;
}

for (const page of pages) {
  test(`${page} enables Vercel Web Analytics and Speed Insights in the head`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);

    assert.ok(head, `${page} should contain a head element`);
    assert.doesNotMatch(html, /<unique-path>/, `${page} should not contain Vercel placeholder paths`);

    for (const integration of integrations) {
      for (const globalName of [integration.bootstrap, integration.queue]) {
        const globalOccurrences = assignmentCount(html, globalName);
        assert.equal(
          globalOccurrences,
          1,
          `${page} should initialize ${globalName} exactly once`,
        );
      }

      const scriptOccurrences = html.split(integration.script).length - 1;
      assert.equal(
        scriptOccurrences,
        1,
        `${page} should load ${integration.name} exactly once`,
      );

      const scriptTag = `<script defer src="${integration.script}"></script>`;
      assert.ok(
        head[1].includes(scriptTag),
        `${page} should load ${integration.name} with defer inside the head`,
      );
    }
  });
}
