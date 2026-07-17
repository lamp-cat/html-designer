const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js', 'studio-app.js'), 'utf8');
const previewHost = fs.readFileSync(path.join(root, 'preview-host.html'), 'utf8');

test('separates the editable DOM canvas from the isolated interactive browser canvas', () => {
  const editFrame = index.match(/<iframe id="design-canvas"[^>]*>/)?.[0] || '';
  const browseFrame = index.match(/<iframe id="browse-canvas"[^>]*>/)?.[0] || '';
  assert.match(editFrame, /allow-same-origin/);
  assert.doesNotMatch(editFrame, /allow-scripts/);
  assert.match(browseFrame, /allow-scripts/);
  assert.doesNotMatch(browseFrame, /allow-same-origin/);
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
  assert.match(app, /preview-host\.html\?session=/);
  assert.match(app, /html-designer-preview-ready/);
  assert.match(previewHost, /html-designer-render-preview/);
  assert.match(previewHost, /html-designer-preview-rendered/);
  assert.match(previewHost, /document\.write\(message\.html\)/);
  assert.match(app, /页面链接、表单和脚本交互已启用/);
});

test('edit clicks resolve semantic components and expose component-specific settings', () => {
  assert.match(index, /id="selection-component-kind"/);
  assert.match(index, /id="component-settings-button"/);
  assert.match(app, /function resolveComponentTarget\(node\)/);
  assert.match(app, /closest\('button, a\[href\]/);
  assert.match(app, /function componentInfo\(element\)/);
  assert.match(app, /\[data-component\]/);
  assert.match(app, /'首屏区块'/);
  assert.match(app, /component-settings/);
  assert.match(app, /openComponentEditor\(element/);
  assert.match(app, /编辑\$\{escapeText\(info\.name\)\}/);
  assert.match(app, /add-option/);
  assert.match(app, /toggle-details/);
});

test('serializes mode transitions and cancels stale canvas loads', () => {
  assert.match(app, /let modeTransition = Promise\.resolve\(\)/);
  assert.match(app, /queueModeTransition/);
  assert.match(app, /performModeChange/);
  assert.match(app, /let modeGeneration = 0/);
  assert.match(app, /generation !== modeGeneration/);
  assert.match(app, /this\.pendingLoad\?\.cancel\(\)/);
  assert.match(app, /sequence !== this\.loadSequence/);
  assert.match(app, /模式切换失败 · 已恢复编辑画布/);
});
