const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const guide = fs.readFileSync(path.join(root, 'guide.html'), 'utf8');
const guideScript = fs.readFileSync(path.join(root, 'js', 'guide.js'), 'utf8');
const tutorial = fs.readFileSync(path.join(root, 'tutorial.html'), 'utf8');
const tutorialScript = fs.readFileSync(path.join(root, 'js', 'tutorial.js'), 'utf8');
const tutorialStyle = fs.readFileSync(path.join(root, 'css', 'tutorial.css'), 'utf8');

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

test('offers a highlighted visual tutorial for the complete product workflow', () => {
  assert.match(index, /href="tutorial\.html"[^>]*>图文教程</);
  assert.match(guide, /href="tutorial\.html"[^>]*>图文教程</);
  assert.equal((tutorial.match(/class="tutorial-step"/g) || []).length, 10);
  assert.equal((tutorial.match(/assets\/tutorial\/step-\d{2}[^"]+\.png/g) || []).length, 10);
  assert.ok((tutorial.match(/class="spotlight primary"/g) || []).length >= 10);
  assert.match(tutorialScript, /IntersectionObserver/);
  assert.match(tutorialScript, /lightbox\.showModal\(\)/);
  assert.match(tutorialStyle, /\.spotlight\.primary/);
  assert.match(tutorialStyle, /@media \(max-width: 760px\)/);
});
