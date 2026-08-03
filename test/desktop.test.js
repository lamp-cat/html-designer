const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const main = fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron', 'preload.js'), 'utf8');
const studio = fs.readFileSync(path.join(root, 'js', 'studio-app.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

test('defines a reproducible macOS application and DMG build', () => {
  assert.equal(packageJson.main, 'electron/main.js');
  assert.equal(packageJson.build.appId, 'io.github.lamp-cat.html-designer');
  assert.equal(packageJson.build.mac.category, 'public.app-category.developer-tools');
  assert.deepEqual(packageJson.build.fileAssociations[0].ext, ['html', 'htm']);
  assert.match(packageJson.scripts['desktop:build'], /electron-builder --mac dmg/);
});

test('keeps the desktop renderer isolated from Node and arbitrary navigation', () => {
  assert.match(main, /contextIsolation: true/);
  assert.match(main, /nodeIntegration: false/);
  assert.match(main, /sandbox: true/);
  assert.match(main, /setWindowOpenHandler/);
  assert.match(main, /assertTrustedSender\(event\)/);
  assert.doesNotMatch(preload, /require\(['"]node:fs['"]\)/);
});

test('uses a token-scoped native file bridge and an ephemeral loopback server', () => {
  assert.match(main, /linkedFiles = new Map\(\)/);
  assert.match(main, /desktop:open-html/);
  assert.match(main, /desktop:write-html/);
  assert.match(preload, /contextBridge\.exposeInMainWorld\('htmlDesignerDesktop'/);
  assert.match(studio, /model\.desktopFileToken/);
  assert.match(server, /listenLocalServer\(options = \{\}\)/);
  assert.match(main, /listenLocalServer\(\{ host: '127\.0\.0\.1', port: 0 \}\)/);
});
