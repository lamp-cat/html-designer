const { execFile } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');

const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  shell,
  session,
} = require('electron');

const execFileAsync = promisify(execFile);
const preloadPath = path.join(__dirname, 'preload.js');
const linkedFiles = new Map();
const pendingOpenFiles = [];

let appOrigin = '';
let localServer = null;
let mainWindow = null;

app.setName('HTML Designer');

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    queueFileOpen(filePath);
  });

  app.on('second-instance', (_event, argv) => {
    focusMainWindow();
    argv.filter(isHtmlPath).forEach(queueFileOpen);
  });

  app.whenReady().then(boot).catch((error) => {
    dialog.showErrorBox('HTML Designer 无法启动', error?.stack || error?.message || String(error));
    app.quit();
  });
}

async function boot() {
  await enrichShellPath();
  const { listenLocalServer } = require('../server');
  const started = await listenLocalServer({ host: '127.0.0.1', port: 0 });
  localServer = started.server;
  appOrigin = `http://127.0.0.1:${started.port}`;

  registerDesktopFileHandlers();
  configureSessionSecurity();
  Menu.setApplicationMenu(createApplicationMenu());
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    else focusMainWindow();
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1080,
    minHeight: 720,
    show: false,
    backgroundColor: '#10131a',
    title: 'HTML Designer',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });

  protectWindow(mainWindow);
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.webContents.on('did-finish-load', flushPendingOpenFiles);
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.loadURL(`${appOrigin}/`);
  return mainWindow;
}

function protectWindow(window) {
  window.webContents.on('will-attach-webview', (event) => event.preventDefault());
  window.webContents.on('will-navigate', (event, url) => {
    if (isInternalUrl(url)) return;
    event.preventDefault();
    openExternalUrl(url);
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternalUrl(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1240,
          height: 840,
          minWidth: 720,
          minHeight: 520,
          backgroundColor: '#10131a',
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
          },
        },
      };
    }
    openExternalUrl(url);
    return { action: 'deny' };
  });
  window.webContents.on('did-create-window', (child) => protectWindow(child));
}

function configureSessionSecurity() {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
}

function isInternalUrl(value) {
  try {
    return new URL(value).origin === appOrigin;
  } catch (_) {
    return false;
  }
}

function openExternalUrl(value) {
  try {
    const url = new URL(value);
    if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) return;
    if (url.protocol !== 'mailto:' && url.origin === appOrigin) return;
    void shell.openExternal(url.toString());
  } catch (_) {}
}

function createApplicationMenu() {
  const template = [
    {
      label: 'HTML Designer',
      submenu: [
        { role: 'about', label: '关于 HTML Designer' },
        { type: 'separator' },
        { role: 'services', label: '服务' },
        { type: 'separator' },
        { role: 'hide', label: '隐藏 HTML Designer' },
        { role: 'hideOthers', label: '隐藏其他' },
        { role: 'unhide', label: '全部显示' },
        { type: 'separator' },
        { role: 'quit', label: '退出 HTML Designer' },
      ],
    },
    {
      label: '文件',
      submenu: [
        { label: '新建设计', accelerator: 'CmdOrCtrl+N', click: () => sendCommand('new') },
        { label: '打开 HTML…', accelerator: 'CmdOrCtrl+O', click: () => sendCommand('open') },
        { type: 'separator' },
        { label: '保存', accelerator: 'CmdOrCtrl+S', click: () => sendCommand('save') },
        { label: '导出副本…', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendCommand('export') },
        { type: 'separator' },
        { role: 'close', label: '关闭窗口' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '显示',
      submenu: [
        { label: '命令面板', accelerator: 'CmdOrCtrl+K', click: () => sendCommand('command-palette') },
        { label: '返回产品首页', click: () => sendCommand('home') },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '进入全屏幕' },
        ...(app.isPackaged ? [] : [
          { type: 'separator' },
          { role: 'reload', label: '重新载入' },
          { role: 'toggleDevTools', label: '开发者工具' },
        ]),
      ],
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: '缩放' },
        { type: 'separator' },
        { role: 'front', label: '前置全部窗口' },
      ],
    },
    {
      role: 'help',
      label: '帮助',
      submenu: [
        { label: '图文教程', click: () => openAppPage('tutorial.html') },
        { label: '使用指南', click: () => openAppPage('guide.html') },
        { label: '快捷键速查', accelerator: 'CmdOrCtrl+/', click: () => sendCommand('shortcuts') },
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
}

function openAppPage(relativePath) {
  const window = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 720,
    minHeight: 520,
    backgroundColor: '#f4f5f7',
    title: 'HTML Designer',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  protectWindow(window);
  window.loadURL(`${appOrigin}/${relativePath}`);
}

function sendCommand(command) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('desktop:command', command);
  focusMainWindow();
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function registerDesktopFileHandlers() {
  ipcMain.handle('desktop:open-html', async (event) => {
    assertTrustedSender(event);
    const owner = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    const result = await dialog.showOpenDialog(owner, {
      title: '打开 HTML 文件',
      properties: ['openFile'],
      filters: [
        { name: 'HTML 文档', extensions: ['html', 'htm'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return registerLinkedFile(result.filePaths[0]);
  });

  ipcMain.handle('desktop:read-html', async (event, token) => {
    assertTrustedSender(event);
    return readLinkedFile(token);
  });

  ipcMain.handle('desktop:write-html', async (event, token, html) => {
    assertTrustedSender(event);
    const filePath = resolveLinkedFile(token);
    await fs.promises.writeFile(filePath, validateHtml(html), 'utf8');
    return readLinkedFile(token);
  });

  ipcMain.handle('desktop:save-html', async (event, payload = {}) => {
    assertTrustedSender(event);
    const owner = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    const fileName = safeHtmlName(payload.suggestedName);
    const result = await dialog.showSaveDialog(owner, {
      title: payload.link ? '保存 HTML 文件' : '导出 HTML 副本',
      defaultPath: path.join(app.getPath('documents'), fileName),
      filters: [{ name: 'HTML 文档', extensions: ['html'] }],
      properties: ['showOverwriteConfirmation', 'createDirectory'],
    });
    if (result.canceled || !result.filePath) return null;
    await fs.promises.writeFile(result.filePath, validateHtml(payload.html), 'utf8');
    return registerLinkedFile(result.filePath);
  });
}

function assertTrustedSender(event) {
  const frameUrl = event.senderFrame?.url || event.sender?.getURL?.() || '';
  if (!isInternalUrl(frameUrl)) throw new Error('不允许从当前页面执行本地文件操作。');
}

function validateHtml(value) {
  if (typeof value !== 'string') throw new TypeError('HTML 内容无效。');
  if (Buffer.byteLength(value, 'utf8') > 128 * 1024 * 1024) throw new Error('HTML 文件超过 128 MB，无法保存。');
  return value;
}

function safeHtmlName(value) {
  const base = path.basename(String(value || 'untitled.html')).replace(/[\0/:]/g, '-');
  return /\.html?$/i.test(base) ? base : `${base || 'untitled'}.html`;
}

function isHtmlPath(value) {
  return typeof value === 'string' && /\.html?$/i.test(value);
}

function resolveLinkedFile(token) {
  const filePath = linkedFiles.get(String(token || ''));
  if (!filePath) throw new Error('文件连接已失效，请重新打开文件。');
  return filePath;
}

async function registerLinkedFile(filePath) {
  if (!isHtmlPath(filePath)) throw new Error('请选择 .html 或 .htm 文件。');
  const resolved = path.resolve(filePath);
  const token = crypto.randomUUID();
  linkedFiles.set(token, resolved);
  return { token, ...(await readHtmlFile(resolved)) };
}

async function readLinkedFile(token) {
  return { token, ...(await readHtmlFile(resolveLinkedFile(token))) };
}

async function readHtmlFile(filePath) {
  const [html, stat] = await Promise.all([
    fs.promises.readFile(filePath, 'utf8'),
    fs.promises.stat(filePath),
  ]);
  return {
    name: path.basename(filePath),
    html,
    size: stat.size,
    lastModified: stat.mtimeMs,
  };
}

function queueFileOpen(filePath) {
  if (!isHtmlPath(filePath)) return;
  pendingOpenFiles.push(path.resolve(filePath));
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isLoading()) flushPendingOpenFiles();
}

async function flushPendingOpenFiles() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  while (pendingOpenFiles.length) {
    const filePath = pendingOpenFiles.shift();
    try {
      const file = await registerLinkedFile(filePath);
      mainWindow.webContents.send('desktop:open-file', file);
      focusMainWindow();
    } catch (error) {
      dialog.showErrorBox('无法打开 HTML 文件', error?.message || String(error));
    }
  }
}

async function enrichShellPath() {
  const marker = '__HTML_DESIGNER_PATH__';
  const current = String(process.env.PATH || '');
  let loginPath = '';
  const userShell = process.env.SHELL;
  if (userShell && path.isAbsolute(userShell) && fs.existsSync(userShell)) {
    try {
      const { stdout } = await execFileAsync(userShell, ['-ilc', `printf '${marker}%s' "$PATH"`], {
        timeout: 6000,
        maxBuffer: 1024 * 1024,
      });
      const markerIndex = stdout.lastIndexOf(marker);
      if (markerIndex >= 0) loginPath = stdout.slice(markerIndex + marker.length).trim();
    } catch (_) {}
  }
  const home = os.homedir();
  const commonPaths = [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    path.join(home, '.local', 'bin'),
    path.join(home, '.npm-global', 'bin'),
    path.join(home, '.volta', 'bin'),
    path.join(home, '.asdf', 'shims'),
    path.join(home, '.bun', 'bin'),
  ];
  process.env.PATH = [...new Set(`${loginPath}:${commonPaths.join(':')}:${current}`.split(':').filter(Boolean))].join(':');
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (localServer?.listening) localServer.close();
});

