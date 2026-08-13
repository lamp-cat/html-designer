const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js', 'studio-app.js'), 'utf8');
const previewHost = fs.readFileSync(path.join(root, 'preview-host.html'), 'utf8');
const polish = fs.readFileSync(path.join(root, 'css', 'studio-polish.css'), 'utf8');

test('separates the guarded editable canvas from the isolated interactive browser canvas', () => {
  const editFrame = index.match(/<iframe id="design-canvas"[^>]*>/)?.[0] || '';
  const browseFrame = index.match(/<iframe id="browse-canvas"[^>]*>/)?.[0] || '';
  assert.match(editFrame, /allow-same-origin/);
  assert.match(editFrame, /allow-scripts/);
  assert.match(browseFrame, /allow-scripts/);
  assert.doesNotMatch(browseFrame, /allow-same-origin/);
  assert.match(app, /script-src 'none'/);
  assert.match(app, /data-hd-inert-events/);
  assert.match(app, /data-hd-script-placeholder/);
  assert.match(app, /placeholder\.content\.append/);
  assert.match(app, /restoreEditableArtifacts/);
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

test('keeps a fixed device viewport and fits it without changing HTML layout width', () => {
  assert.match(index, /id="canvas-stage"[^>]*data-device="desktop"/);
  assert.match(app, /desktop: \{ width: 1440, height: 900/);
  assert.match(app, /tablet: \{ width: 820, height: 1180/);
  assert.match(app, /mobile: \{ width: 390, height: 844/);
  assert.match(app, /availableWidth \/ viewport\.width/);
  assert.match(app, /availableHeight \/ viewport\.height/);
  assert.match(app, /canvasFitMode/);
  assert.match(polish, /width: var\(--canvas-width\); height: var\(--canvas-height\)/);
  assert.doesNotMatch(polish, /calc\(100% \/ var\(--canvas-scale\)\)/);
});

test('keeps the complete page visible beside AI Design and across edit and browse modes', () => {
  assert.match(polish, /--ai-drawer-width: clamp\(/);
  assert.match(polish, /\.studio\.ai-open \.studio-grid \{[^}]*margin-left: var\(--ai-drawer-width\)/);
  assert.match(polish, /\.studio\.ai-open\.browse-mode \.studio-grid,/);
  assert.match(app, /let canvasPageMode = true/);
  assert.match(app, /setCanvasPageMode\(true, \{ announce: false \}\)/);
  assert.match(app, /if \(canvasPageMode && canvasPageHeight > viewport\.height\)/);
  assert.match(app, /message\.type === 'html-designer-preview-size'/);
  assert.match(app, /scheduleFullPageMeasurement\(state\)/);
  assert.match(app, /model\.mode === 'browse'\) canvas\.measureBrowsePage\(\)/);
  assert.match(previewHost, /html-designer-measure-preview-size/);
  assert.match(previewHost, /html-designer-preview-size/);
  assert.match(previewHost, /documentHeight: documentHeight\(\)/);
});

test('keeps canvas zoom controls available while browsing', () => {
  assert.match(index, /id="zoom-out-button"[^>]*aria-label="缩小画布"/);
  assert.match(index, /id="zoom-in-button"[^>]*aria-label="放大画布"/);
  assert.doesNotMatch(polish, /\.studio\.browse-mode \.canvas-hud\s*(?:,|\{)[^}]*display: none/);
  assert.match(polish, /\.studio\.browse-mode #hud-insert-button,/);
  assert.match(polish, /\.studio\.preview-mode #hud-insert-button,/);
  assert.match(app, /zoom-out-button'\)\.onclick = \(\) => setCanvasZoom\(canvasZoom - \.1\)/);
  assert.match(app, /zoom-in-button'\)\.onclick = \(\) => setCanvasZoom\(canvasZoom \+ \.1\)/);
});

test('tracks saved content independently from undo position and bounds every history source', () => {
  assert.match(app, /this\.savedHtml =/);
  assert.match(app, /updateDirty\(html = this\.currentText\(\)\)/);
  assert.match(app, /String\(html \|\| ''\) !== String\(this\.savedHtml \|\| ''\)/);
  assert.match(app, /pushHistory\(html, label/);
  assert.doesNotMatch(app, /this\.setDirty\(next !== 0\)/);
  assert.doesNotMatch(app, /model\.history\.push\(\{ html: model\.sourceText/);
});

test('uses an isolated external preview and reviews AI candidates before applying', () => {
  assert.match(app, /external-preview\.html\?channel=/);
  assert.match(app, /new BroadcastChannel/);
  assert.doesNotMatch(app, /window\.open\(url, '_blank'/);
  assert.match(app, /modal\.reviewChange/);
  assert.match(app, /AI Design · 组件/);
  assert.match(app, /resolvePathInDocument/);
  assert.match(app, /serializeEditableElement\(model\.selected\)/);
  assert.match(app, /prepareEditableFragment\(candidateElement\.outerHTML/);
});

test('preserves nested component markup and duplicate identity relationships', () => {
  assert.match(app, /name: 'richText'/);
  assert.match(app, /serializeEditableElement\(textTarget, true\)/);
  assert.match(app, /prepareEditableFragment\(values\.richText/);
  assert.match(app, /prepareDuplicate\(copy\)/);
  assert.match(app, /aria-labelledby/);
  assert.doesNotMatch(app, /element\.replaceChildren\(\.\.\.lines\.map/);
});

test('moves selected components freely without limiting them to DOM drop targets', () => {
  assert.match(index, /id="selection-frame"[^>]*tabindex="-1"/);
  assert.match(index, /id="selection-reset-position"[^>]*data-command="reset-position"/);
  assert.match(index, /aria-label="自由移动组件"/);
  assert.match(app, /freeTranslateOffset\(element/);
  assert.match(app, /setFreePosition\(element, x, y/);
  assert.match(app, /this\.freePositionOrigins = new WeakMap\(\)/);
  assert.match(app, /hasFreePositionChange\(element/);
  assert.match(app, /restoreInlineProperty\(element, 'translate', origin\.value, origin\.priority\)/);
  assert.doesNotMatch(app, /element\.style\.setProperty\('translate', 'none'\)/);
  assert.match(app, /style\.setProperty\('translate'/);
  assert.match(app, /自由移动组件 · 按住 Shift/);
  assert.match(app, /nudgeSelected\(dx, dy\)/);
  assert.match(app, /group\('自由位置'/);
  assert.match(app, /element === model\.doc\?\.body \? null : group\('自由位置'/);
  const freeMove = app.match(/beginMove\(event,[\s\S]*?\n  updateResize\(event\)/)?.[0] || '';
  assert.doesNotMatch(freeMove, /target\.before|target\.after|target\.append/);
});

test('keeps double-click text editing available after an element is selected', () => {
  assert.match(index, /aria-label="拖动选中组件，双击编辑文字"/);
  assert.match(app, /doc\.addEventListener\('dblclick'/);
  assert.match(app, /this\.editText\(resolveComponentTarget\(event\.target\)\)/);
  assert.match(app, /this\.frame\.dataset\.movable = String\(canMove\)/);
  assert.match(polish, /\.selection-frame \{[^}]*pointer-events: none/);
});

test('uses atomic controls and turns multiple selections into reusable custom composites', () => {
  assert.match(index, /data-panel="library"[\s\S]*?<span>基础<\/span>/);
  assert.match(index, /data-panel="snippets"[\s\S]*?<span>自定义<\/span>/);
  assert.match(index, /id="multi-selection-layer"/);
  assert.match(index, /id="multi-selection-count"/);
  assert.match(index, /id="create-composite-button"/);
  assert.match(index, /Shift、Ctrl 或 ⌘ 点击画布控件进行多选/);
  assert.match(app, /this\.selection = \[\]/);
  assert.match(app, /selectedElements\(\)/);
  assert.match(app, /model\.select\(target, \{ toggle: true \}\)/);
  assert.match(app, /if \(model\.selectedElements\(\)\.length !== 1\) return/);
  assert.match(app, /function compositeSelectionElements\(\)/);
  assert.match(app, /async function createCompositeControl\(\)/);
  assert.match(app, /wrapper\.setAttribute\('data-hd-composite', 'true'\)/);
  assert.match(app, /elements\.forEach\(element => wrapper\.append\(element\.cloneNode\(true\)\)\)/);
  assert.match(app, /kind: 'composite'/);
  assert.match(app, /this\.prepareDuplicate\(this\.createNode\(snippetHtml\)\)/);
  assert.match(app, /canvas\.prepareDuplicate\(canvas\.createNode\(snippet\.html\)\)/);
  assert.match(app, /if \(selection\.length > 1\) \{[\s\S]*?多选用于创建组合控件/);
  assert.doesNotMatch(app, /\['组件', '卡片'/);
  assert.doesNotMatch(app, /\['布局', '双栏'/);
  assert.doesNotMatch(app, /\['导航', '导航栏'/);
  assert.match(polish, /\.multi-selection-frame/);
  assert.match(polish, /\.multi-selection-bar/);
  assert.match(polish, /\.tree-row\.multi-selected/);
});

test('hands the current browse route, view state, and open overlays back to editing', () => {
  assert.match(app, /captureBrowseState\(\)/);
  assert.match(app, /applyBrowseStateToEditor\(state\)/);
  assert.match(app, /BROWSE_PRESENTATION_MARKER/);
  assert.match(app, /collectBrowsePresentationChanges/);
  assert.match(app, /dialog\.showModal\(\)/);
  assert.match(app, /当前视图：\$\{pageLabel\}/);
  assert.match(previewHost, /html-designer-capture-preview-state/);
  assert.match(previewHost, /html-designer-preview-state/);
  assert.match(previewHost, /html-designer-restore-preview-state/);
  assert.match(previewHost, /presentationChanges\(\)/);
  assert.match(previewHost, /dialog:modal/);
  assert.match(previewHost, /window\.addEventListener\('message', handleMessage\)/);
});

test('protects the document body from invalid component operations', () => {
  assert.match(app, /const isRoot = element === model\.doc\?\.body/);
  assert.match(app, /duplicate: !isRoot/);
  assert.match(app, /remove: !isRoot/);
  assert.match(app, /页面主体不能执行此操作/);
  assert.match(app, /'duplicate-button': Boolean\(selected\) && !isRoot/);
  assert.match(app, /model\.selected === model\.doc\?\.body/);
  assert.match(app, /handle\.disabled = isRoot/);
  assert.match(app, /element === model\.doc\?\.body\) return/);
  assert.match(app, /summary-edit-button'\)\.disabled = !componentInfo\(element\)\.canEditText/);
});

test('warns when a single-file import depends on unresolved project paths', () => {
  assert.match(app, /function countProjectRelativeReferences/);
  assert.match(app, /个相对路径，请设置 <base> 或改用内联资源/);
});
