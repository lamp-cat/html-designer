const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js', 'studio-app.js'), 'utf8');

test('separates the editable DOM canvas from the isolated interactive browser canvas', () => {
  const editFrame = index.match(/<iframe id="design-canvas"[^>]*>/)?.[0] || '';
  const browseFrame = index.match(/<iframe id="browse-canvas"[^>]*>/)?.[0] || '';
  assert.match(editFrame, /allow-same-origin/);
  assert.doesNotMatch(editFrame, /allow-scripts/);
  assert.match(browseFrame, /allow-scripts/);
  assert.match(browseFrame, /allow-same-origin/);
  assert.match(index, /data-mode="visual"/);
  assert.match(index, /data-mode="browse"/);
  assert.match(index, /data-mode="source"/);
});

test('new documents use an independent interactive HTML example', () => {
  const starter = app.match(/const EMPTY_DOCUMENT = `([\s\S]*?)`;\n\nconst BLOCKS/)?.[1] || '';
  assert.match(starter, /Signal House/);
  assert.match(starter, /data-open-signup/);
  assert.match(starter, /signup-dialog/);
  assert.match(starter, /<script>/);
  assert.doesNotMatch(starter, /HTML Designer|Editable starter|Design directly on the page/);
});

test('edit clicks expose an upward action menu and browse mode uses a separate document', () => {
  assert.match(index, /id="selection-menu-title"/);
  assert.match(index, /data-command="deselect"/);
  assert.match(app, /showSelectionMenu\(\)/);
  assert.match(app, /data:text\/html;charset=utf-8/);
  assert.match(app, /a\[href\^="#"\]/);
  assert.match(app, /scrollIntoView/);
  assert.match(app, /页面链接、表单和脚本交互已启用/);
});
