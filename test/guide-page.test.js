const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const guide = fs.readFileSync(path.join(root, 'guide.html'), 'utf8');
const guideScript = fs.readFileSync(path.join(root, 'js', 'guide.js'), 'utf8');

test('opens the user guide through a rendered HTML page', () => {
  assert.match(index, /href="guide\.html"[^>]*>使用指南</);
  assert.doesNotMatch(index, /href="HTML_DESIGNER_USER_GUIDE\.md"[^>]*>使用指南</);
  assert.match(guide, /id="guide-content"/);
  assert.match(guide, /src="js\/guide\.js/);
  assert.match(guide, /href="css\/guide\.css/);
});

test('loads the Markdown source and renders navigation and rich blocks', () => {
  assert.match(guideScript, /fetch\('HTML_DESIGNER_USER_GUIDE\.md'/);
  assert.match(guideScript, /function renderMarkdown/);
  assert.match(guideScript, /function renderToc/);
  assert.match(guideScript, /guide-table-wrap/);
  assert.match(guideScript, /guide-code/);
  assert.match(guideScript, /IntersectionObserver/);
});
