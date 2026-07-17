const byId = (id) => document.getElementById(id);
const pick = (selector, root = document) => root.querySelector(selector);
const pickAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const STORAGE = Object.freeze({
  draft: 'html-designer.v1.draft',
  snippets: 'html-designer.v1.snippets',
  theme: 'html-designer.v1.theme',
  ai: 'html-designer.v1.ai',
});

const EMPTY_DOCUMENT = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Untitled design</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f3f5f0; color: #142017; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    .page { width: min(1120px, calc(100% - 40px)); margin: 0 auto; }
    .hero { display: grid; min-height: 72vh; grid-template-columns: 1.1fr .9fr; gap: 48px; align-items: center; padding: 72px 0; }
    .eyebrow { color: #26723b; font-size: 13px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 16px 0 22px; font-size: clamp(48px, 8vw, 92px); letter-spacing: -.065em; line-height: .92; }
    .lead { max-width: 640px; color: #566159; font-size: 19px; line-height: 1.7; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
    .button { display: inline-flex; min-height: 46px; padding: 0 20px; align-items: center; justify-content: center; border: 1px solid #142017; border-radius: 999px; color: #142017; font-weight: 750; text-decoration: none; }
    .button.primary { background: #142017; color: white; }
    .card { padding: 32px; border: 1px solid rgba(20,32,23,.14); border-radius: 24px; background: white; box-shadow: 0 32px 90px rgba(20,32,23,.12); }
    .card-mark { display: grid; aspect-ratio: 4 / 3; margin-bottom: 24px; place-items: center; border-radius: 16px; background: #dff6df; color: #26723b; font-size: 64px; }
    .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 0 0 72px; }
    .feature { min-height: 180px; padding: 24px; border: 1px solid rgba(20,32,23,.12); border-radius: 18px; background: rgba(255,255,255,.68); }
    @media (max-width: 800px) { .hero { grid-template-columns: 1fr; } .features { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div>
        <span class="eyebrow">Editable starter</span>
        <h1>Design directly on the page.</h1>
        <p class="lead">选择任何元素，修改文字、布局和样式。你也可以从左侧拖入新组件，或切换到源码模式进行精确编辑。</p>
        <div class="actions"><a class="button primary" href="#features">开始编辑</a><a class="button" href="#">了解更多</a></div>
      </div>
      <article class="card"><div class="card-mark">✦</div><h2>HTML Designer</h2><p>这是一个可以自由替换的示例卡片。</p></article>
    </section>
    <section class="features" id="features">
      <article class="feature"><h3>Visual</h3><p>直接在渲染结果上选择和调整。</p></article>
      <article class="feature"><h3>Local</h3><p>通过浏览器权限保存回本地文件。</p></article>
      <article class="feature"><h3>Flexible</h3><p>随时切换到完整 HTML 源码。</p></article>
    </section>
  </main>
</body>
</html>`;

const BLOCKS = [
  ['文字', '标题', 'H', '<h2 style="margin:0 0 12px;font-size:40px;line-height:1.05;">新的标题</h2>'],
  ['文字', '正文', '¶', '<p style="max-width:680px;margin:0 0 16px;line-height:1.7;">在这里输入正文内容。</p>'],
  ['文字', '引言', '“', '<blockquote style="margin:24px 0;padding:18px 22px;border-left:4px solid #5f7cff;background:#f4f6ff;font-size:20px;">值得强调的一段话。</blockquote>'],
  ['文字', '代码块', '</>', '<pre style="overflow:auto;padding:18px;border-radius:12px;background:#111827;color:#e5e7eb;"><code>const hello = "world";</code></pre>'],
  ['布局', '内容区块', '□', '<section style="padding:64px 24px;"><div style="width:min(1080px,100%);margin:0 auto;"><h2>Section title</h2><p>Section content</p></div></section>'],
  ['布局', '双栏', '▥', '<section style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;"><div style="padding:24px;background:#f5f5f5;">左侧</div><div style="padding:24px;background:#eeeeee;">右侧</div></section>'],
  ['布局', '三栏', '▦', '<section style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;"><div style="padding:20px;background:#f5f5f5;">一</div><div style="padding:20px;background:#eeeeee;">二</div><div style="padding:20px;background:#e7e7e7;">三</div></section>'],
  ['布局', '分隔线', '—', '<hr style="margin:32px 0;border:0;border-top:1px solid #d9dce2;">'],
  ['组件', '卡片', '▣', '<article style="padding:24px;border:1px solid #dfe3e9;border-radius:16px;background:white;box-shadow:0 18px 50px rgba(20,30,50,.08);"><h3 style="margin-top:0;">Card title</h3><p style="margin-bottom:0;color:#667085;">Card description</p></article>'],
  ['组件', '主按钮', '→', '<a href="#" style="display:inline-flex;min-height:44px;padding:0 20px;align-items:center;justify-content:center;border-radius:999px;background:#111827;color:white;font-weight:700;text-decoration:none;">Primary action</a>'],
  ['组件', '徽标', '●', '<span style="display:inline-flex;padding:6px 10px;border-radius:999px;background:#e7f8eb;color:#26723b;font-size:12px;font-weight:800;">NEW</span>'],
  ['组件', '提示框', '!', '<aside role="note" style="padding:16px 18px;border:1px solid #bcd4ff;border-radius:12px;background:#eef5ff;color:#244778;"><strong>提示</strong><p style="margin:6px 0 0;">这里是一条重要说明。</p></aside>'],
  ['组件', '详情折叠', '⌄', '<details style="padding:16px;border:1px solid #dfe3e9;border-radius:12px;"><summary style="cursor:pointer;font-weight:700;">展开查看详情</summary><p>隐藏的详细内容。</p></details>'],
  ['媒体', '图片', '◫', '<img src="https://picsum.photos/1000/620" alt="示例图片" style="display:block;width:100%;height:auto;border-radius:16px;">'],
  ['媒体', '视频', '▶', '<video controls style="display:block;width:100%;border-radius:16px;"><source src="" type="video/mp4">浏览器不支持视频。</video>'],
  ['列表', '无序列表', '•', '<ul style="padding-left:22px;line-height:1.8;"><li>第一项</li><li>第二项</li><li>第三项</li></ul>'],
  ['列表', '步骤列表', '1', '<ol style="padding-left:22px;line-height:1.8;"><li>第一步</li><li>第二步</li><li>第三步</li></ol>'],
  ['表单', '输入框', '⌨', '<label style="display:grid;gap:7px;max-width:420px;"><span style="font-weight:700;">字段名称</span><input name="field" placeholder="请输入" style="height:44px;padding:0 12px;border:1px solid #cfd4dc;border-radius:10px;"></label>'],
  ['表单', '文本域', '≡', '<label style="display:grid;gap:7px;max-width:520px;"><span style="font-weight:700;">详细内容</span><textarea rows="5" style="padding:12px;border:1px solid #cfd4dc;border-radius:10px;"></textarea></label>'],
  ['表单', '选择器', '⌄', '<select style="height:44px;padding:0 12px;border:1px solid #cfd4dc;border-radius:10px;background:white;"><option>选项一</option><option>选项二</option></select>'],
  ['导航', '导航栏', '☰', '<nav aria-label="主导航" style="display:flex;padding:18px 24px;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;"><a href="#" style="color:inherit;font-weight:800;text-decoration:none;">Brand</a><div style="display:flex;gap:20px;"><a href="#">首页</a><a href="#">功能</a><a href="#">联系</a></div></nav>'],
  ['导航', '页脚', '▁', '<footer style="padding:40px 24px;background:#111827;color:#c7ceda;text-align:center;">© 2026 Your product</footer>'],
  ['数据', '数据表格', '▦', '<table style="width:100%;border-collapse:collapse;"><caption style="padding:0 0 12px;text-align:left;font-weight:800;">数据概览</caption><thead><tr><th style="padding:12px;text-align:left;border-bottom:2px solid #111827;">项目</th><th style="padding:12px;text-align:left;border-bottom:2px solid #111827;">状态</th></tr></thead><tbody><tr><td style="padding:12px;border-bottom:1px solid #e5e7eb;">Alpha</td><td style="padding:12px;border-bottom:1px solid #e5e7eb;">完成</td></tr><tr><td style="padding:12px;">Beta</td><td style="padding:12px;">进行中</td></tr></tbody></table>'],
  ['数据', '价格表', '$', '<table style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #dfe3e9;border-radius:14px;overflow:hidden;"><thead><tr style="background:#f6f7f9;"><th style="padding:16px;text-align:left;">方案</th><th style="padding:16px;text-align:left;">价格</th><th style="padding:16px;text-align:left;">项目数</th></tr></thead><tbody><tr><td style="padding:16px;border-top:1px solid #dfe3e9;">Starter</td><td style="padding:16px;border-top:1px solid #dfe3e9;">¥0</td><td style="padding:16px;border-top:1px solid #dfe3e9;">3</td></tr><tr><td style="padding:16px;border-top:1px solid #dfe3e9;">Pro</td><td style="padding:16px;border-top:1px solid #dfe3e9;">¥99</td><td style="padding:16px;border-top:1px solid #dfe3e9;">不限</td></tr></tbody></table>'],
];

const VOID_TAGS = new Set(['AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR']);
const FORBIDDEN_SELECT = new Set(['HTML', 'HEAD', 'META', 'LINK', 'STYLE', 'SCRIPT', 'TITLE', 'BASE']);
const FLOW_CONTAINERS = new Set(['BODY', 'MAIN', 'SECTION', 'ARTICLE', 'ASIDE', 'NAV', 'HEADER', 'FOOTER', 'DIV', 'FORM', 'FIGURE', 'FIGCAPTION', 'BLOCKQUOTE', 'DETAILS', 'DIALOG', 'FIELDSET', 'LI', 'DD', 'TD', 'TH']);
const PHRASING_CONTAINERS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'BUTTON', 'LABEL', 'SPAN', 'STRONG', 'EM', 'SMALL', 'MARK', 'SUMMARY', 'DT']);
const PHRASING_CONTENT = new Set(['A', 'ABBR', 'B', 'BDI', 'BDO', 'BR', 'BUTTON', 'CITE', 'CODE', 'DATA', 'DEL', 'EM', 'I', 'IMG', 'INPUT', 'INS', 'KBD', 'LABEL', 'MARK', 'Q', 'S', 'SAMP', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP', 'TIME', 'U', 'VAR', 'WBR']);

function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function iconMarkup(name, className = 'icon') {
  return `<svg class="${escapeText(className)}" aria-hidden="true"><use href="#i-${escapeText(name)}"></use></svg>`;
}

async function copyText(value, message = '已复制') {
  try {
    await navigator.clipboard.writeText(String(value || ''));
    toast(message, 'success');
  } catch {
    toast('复制失败，请检查浏览器权限', 'error');
  }
}

function setStatus(message) {
  const target = byId('status-text');
  if (!target) return;
  target.innerHTML = `<i></i>${escapeText(message || '准备就绪')}`;
}

function safeJson(value, fallback) {
  if (value == null || value === '') return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function toast(message, type = '') {
  const item = document.createElement('div');
  item.className = `toast ${type}`.trim();
  item.textContent = message;
  byId('toast-stack').append(item);
  window.setTimeout(() => item.remove(), 3200);
}

class ModalService {
  constructor(root) { this.root = root; }

  close() { this.root.replaceChildren(); }

  async confirm(title, message, confirmLabel = '确认') {
    return new Promise((resolve) => {
      this.root.innerHTML = `<section class="modal-card compact" role="dialog" aria-modal="true"><header class="modal-head"><h2>${escapeText(title)}</h2><button type="button" data-close>×</button></header><div class="modal-body"><p class="modal-copy">${escapeText(message)}</p></div><footer class="modal-foot"><button type="button" data-cancel>取消</button><button class="primary" type="button" data-confirm>${escapeText(confirmLabel)}</button></footer></section>`;
      const finish = (value) => { this.close(); resolve(value); };
      pick('[data-close]', this.root).onclick = () => finish(false);
      pick('[data-cancel]', this.root).onclick = () => finish(false);
      pick('[data-confirm]', this.root).onclick = () => finish(true);
    });
  }

  async prompt(title, message, initial = '') {
    return new Promise((resolve) => {
      this.root.innerHTML = `<section class="modal-card compact" role="dialog" aria-modal="true"><header class="modal-head"><h2>${escapeText(title)}</h2><button type="button" data-close>×</button></header><div class="modal-body"><p class="modal-copy">${escapeText(message)}</p><input class="modal-input" value="${escapeText(initial)}"></div><footer class="modal-foot"><button type="button" data-cancel>取消</button><button class="primary" type="button" data-confirm>确定</button></footer></section>`;
      const input = pick('input', this.root);
      const finish = (value) => { this.close(); resolve(value); };
      pick('[data-close]', this.root).onclick = () => finish(null);
      pick('[data-cancel]', this.root).onclick = () => finish(null);
      pick('[data-confirm]', this.root).onclick = () => finish(input.value.trim() || null);
      input.onkeydown = (event) => { if (event.key === 'Enter') finish(input.value.trim() || null); };
      input.focus();
      input.select();
    });
  }

  diff(oldText, newText, oldLabel = '磁盘文件', newLabel = '编辑器') {
    this.root.innerHTML = `<section class="modal-card" role="dialog" aria-modal="true"><header class="modal-head"><h2>文档对比</h2><button type="button" data-close>×</button></header><div class="modal-body diff-grid"><section class="diff-pane"><h3>${escapeText(oldLabel)}</h3><pre></pre></section><section class="diff-pane"><h3>${escapeText(newLabel)}</h3><pre></pre></section></div><footer class="modal-foot"><button type="button" data-copy>复制编辑器内容</button><button class="primary" type="button" data-close-footer>关闭</button></footer></section>`;
    const panes = pickAll('pre', this.root);
    panes[0].textContent = oldText;
    panes[1].textContent = newText;
    pick('[data-close]', this.root).onclick = () => this.close();
    pick('[data-close-footer]', this.root).onclick = () => this.close();
    pick('[data-copy]', this.root).onclick = async () => {
      await navigator.clipboard.writeText(newText);
      toast('已复制编辑器内容', 'success');
    };
  }

  shortcuts() {
    const rows = [
      ['保存文档', ['⌘', 'S']], ['撤销', ['⌘', 'Z']], ['重做', ['⇧', '⌘', 'Z']],
      ['复制元素', ['⌘', 'D']], ['删除元素', ['⌫']], ['选择父元素', ['⇧', '↑']],
      ['元素上移', ['⌥', '↑']], ['元素下移', ['⌥', '↓']], ['沉浸预览', ['P']],
      ['命令面板', ['⌘', 'K']], ['取消选择 / 退出', ['Esc']], ['快捷键帮助', ['?']],
      ['组件搜索', ['/']], ['快速插入组件', ['I']],
    ];
    this.root.innerHTML = `<section class="modal-card shortcuts" role="dialog" aria-modal="true" aria-label="快捷键"><header class="modal-head"><h2>快捷键</h2><button type="button" data-close aria-label="关闭">×</button></header><div class="modal-body"><p class="shortcut-intro">用键盘完成高频操作。Windows 和 Linux 上请使用 Ctrl 代替 ⌘。</p><div class="shortcut-grid">${rows.map(([label, keys]) => `<div class="shortcut-row"><strong>${escapeText(label)}</strong><span>${keys.map((key) => `<kbd>${escapeText(key)}</kbd>`).join('')}</span></div>`).join('')}</div></div><footer class="modal-foot"><button class="primary" type="button" data-close-footer>知道了</button></footer></section>`;
    pickAll('[data-close], [data-close-footer]', this.root).forEach((button) => { button.onclick = () => this.close(); });
  }
}

const modal = new ModalService(byId('modal-root'));

class StudioModel extends EventTarget {
  constructor() {
    super();
    this.doc = null;
    this.selected = null;
    this.mode = 'visual';
    this.sourceText = '';
    this.sourceBaseline = '';
    this.fileHandle = null;
    this.fileName = 'untitled.html';
    this.fileMtime = null;
    this.dirty = false;
    this.history = [];
    this.cursor = -1;
    this.historyLimit = 36;
    this.autosaveTimer = null;
  }

  signal(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }

  setDirty(value) {
    const next = Boolean(value);
    if (next === this.dirty) return;
    this.dirty = next;
    this.signal('dirty', next);
  }

  select(element) {
    if (element && (FORBIDDEN_SELECT.has(element.tagName) || !element.isConnected)) element = null;
    if (element === this.selected) return;
    this.selected = element;
    this.signal('selection', element);
  }

  elementPath(element = this.selected) {
    if (!element || !this.doc) return null;
    const path = [];
    let node = element;
    while (node && node !== this.doc.documentElement) {
      const parent = node.parentElement;
      if (!parent) return null;
      path.unshift(Array.from(parent.children).indexOf(node));
      node = parent;
    }
    return path;
  }

  resolvePath(path) {
    if (!Array.isArray(path) || !this.doc) return null;
    let node = this.doc.documentElement;
    for (const index of path) {
      node = node?.children?.[index];
      if (!node) return null;
    }
    return node;
  }

  serializeDocument() {
    if (!this.doc?.documentElement) return this.sourceText || '';
    const clone = this.doc.documentElement.cloneNode(true);
    pickAll('[contenteditable], [data-hd-editing]', clone).forEach((element) => {
      element.removeAttribute('contenteditable');
      element.removeAttribute('data-hd-editing');
    });
    const doctype = this.doc.doctype ? `<!doctype ${this.doc.doctype.name}>\n` : '<!doctype html>\n';
    return doctype + clone.outerHTML;
  }

  currentText() {
    if (this.mode === 'source') return byId('source-editor').value;
    if (!this.dirty && this.sourceText) return this.sourceText;
    return this.serializeDocument();
  }

  resetHistory(html = this.serializeDocument()) {
    this.history = [{ html, path: null, label: '载入文档' }];
    this.cursor = 0;
    this.signal('history');
  }

  checkpoint(label) {
    if (!this.doc) return;
    const html = this.serializeDocument();
    const current = this.history[this.cursor];
    if (current?.html === html) return;
    this.history.splice(this.cursor + 1);
    this.history.push({ html, path: this.elementPath(), label });
    if (this.history.length > this.historyLimit) this.history.shift();
    this.cursor = this.history.length - 1;
    this.setDirty(true);
    this.scheduleAutosave();
    this.signal('history');
  }

  async travel(offset) {
    if (this.mode !== 'visual') return;
    const next = this.cursor + offset;
    if (next < 0 || next >= this.history.length) return;
    this.cursor = next;
    const snapshot = this.history[next];
    const selectedPath = snapshot.path;
    await canvas.load(snapshot.html, { preserveHistory: true });
    this.setDirty(next !== 0);
    this.signal('history');
    const restored = this.resolvePath(selectedPath);
    if (restored) this.select(restored);
  }

  scheduleAutosave() {
    window.clearTimeout(this.autosaveTimer);
    this.autosaveTimer = window.setTimeout(() => {
      const payload = { html: this.currentText(), name: this.fileName, savedAt: Date.now() };
      try {
        localStorage.setItem(STORAGE.draft, JSON.stringify(payload));
        byId('autosave-text').textContent = `自动保存 ${new Date(payload.savedAt).toLocaleTimeString()}`;
      } catch { /* Storage may be unavailable. */ }
    }, 1500);
  }
}

const model = new StudioModel();

class CanvasController {
  constructor() {
    this.iframe = byId('design-canvas');
    this.shell = byId('canvas-shell');
    this.layer = byId('selection-layer');
    this.frame = byId('selection-frame');
    this.label = byId('selection-label');
    this.size = byId('selection-size');
    this.actions = byId('selection-actions');
    this.hover = byId('hover-frame');
    this.dropMarker = byId('drop-marker');
    this.preview = false;
    this.resizeSession = null;
    this.moveSession = null;
    this.blockDragSession = null;
    this.dropTarget = null;
    this.initParentEvents();
  }

  initParentEvents() {
    this.actions.addEventListener('click', (event) => {
      const command = event.target.closest('[data-command]')?.dataset.command;
      if (command) this.runCommand(command);
    });
    pickAll('[data-resize]', this.layer).forEach((handle) => {
      handle.addEventListener('pointerdown', (event) => this.beginResize(event, handle.dataset.resize));
    });
    pick('.selection-grip', this.actions)?.addEventListener('pointerdown', (event) => this.beginMove(event));
    document.addEventListener('pointermove', (event) => { this.updateResize(event); this.updateMove(event); this.updateBlockDrag(event); });
    document.addEventListener('pointerup', (event) => { this.endResize(); this.endMove(); this.endBlockDrag(event); });
    document.addEventListener('pointercancel', (event) => this.endBlockDrag(event, true));
    window.addEventListener('resize', () => this.updateOverlay());
    new ResizeObserver(() => { this.updateOverlay(); updateCanvasInfo(); }).observe(this.shell);
  }

  async load(html, options = {}) {
    const source = String(html || '').trim() || EMPTY_DOCUMENT;
    return new Promise((resolve, reject) => {
      this.iframe.onload = () => {
        this.iframe.onload = null;
        try {
          const previousSelection = model.selected;
          model.doc = this.iframe.contentDocument;
          model.selected = null;
          if (previousSelection) model.signal('selection', null);
          this.wireDocument(model.doc);
          this.updateOverlay();
          updateCanvasInfo();
          model.signal('document', model.doc);
          if (!options.preserveHistory) model.resetHistory(source);
          resolve(model.doc);
        } catch (error) { reject(error); }
      };
      this.iframe.srcdoc = source;
    });
  }

  wireDocument(doc) {
    if (!doc?.body) return;
    doc.addEventListener('click', (event) => {
      if (event.target.closest?.('[data-hd-editing="true"]')) return;
      const link = event.target.closest?.('a');
      if (link) {
        event.preventDefault();
        if (this.preview) this.previewLink(link);
      }
      if (this.preview) return;
      event.preventDefault();
      event.stopPropagation();
      const target = event.target.nodeType === Node.ELEMENT_NODE ? event.target : event.target.parentElement;
      model.select(target);
    }, true);
    doc.addEventListener('submit', (event) => event.preventDefault(), true);
    doc.addEventListener('dblclick', (event) => {
      if (this.preview) return;
      if (event.target.closest?.('[data-hd-editing="true"]')) return;
      event.preventDefault();
      this.editText(event.target);
    }, true);
    doc.addEventListener('mousemove', (event) => this.showHover(event.target));
    doc.addEventListener('mouseleave', () => { this.hover.hidden = true; });
    doc.addEventListener('scroll', () => this.updateOverlay(), true);
    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.preview) exitPreview();
    });
    doc.addEventListener('dragover', (event) => this.dragOver(event));
    doc.addEventListener('drop', (event) => this.drop(event));
  }

  previewLink(link) {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      model.doc.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else if (/^(https?:|mailto:|tel:)/i.test(href)) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }

  editableTextTarget(element) {
    if (!element || element.childElementCount === 0) return element;
    const selector = 'h1,h2,h3,h4,h5,h6,p,a,button,span,li,dt,dd,figcaption,summary,strong,em,small';
    return Array.from(element.querySelectorAll(selector)).find((candidate) => candidate.childElementCount === 0 && candidate.textContent.trim()) || element;
  }

  editText(element = model.selected) {
    element = this.editableTextTarget(element);
    if (!element || FORBIDDEN_SELECT.has(element.tagName) || VOID_TAGS.has(element.tagName)) return;
    if (['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(element.tagName)) {
      toast('请在属性检查器中编辑表单内容', 'error');
      return;
    }
    if (element.dataset.hdEditing === 'true') return;
    model.select(element);
    const before = element.innerHTML;
    const spellcheckBefore = element.getAttribute('spellcheck');
    let finished = false;
    element.contentEditable = 'true';
    element.dataset.hdEditing = 'true';
    element.spellcheck = true;
    this.layer.classList.add('editing');
    element.focus();
    const finish = (cancel = false) => {
      if (finished) return;
      finished = true;
      if (cancel) element.innerHTML = before;
      element.removeAttribute('contenteditable');
      if (spellcheckBefore === null) element.removeAttribute('spellcheck'); else element.setAttribute('spellcheck', spellcheckBefore);
      delete element.dataset.hdEditing;
      element.removeEventListener('blur', onBlur);
      element.removeEventListener('keydown', onKey);
      this.layer.classList.remove('editing');
      const changed = element.innerHTML !== before;
      if (!cancel && changed) model.checkpoint('编辑文字');
      renderInspectors();
      this.updateOverlay();
      setStatus(cancel ? '已取消文字编辑' : changed ? '文字已更新' : '文字未修改');
    };
    const onBlur = () => finish(false);
    const onKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); finish(true); }
      if (event.key === 'Enter' && !event.shiftKey && element.tagName !== 'PRE') { event.preventDefault(); element.blur(); }
    };
    element.addEventListener('blur', onBlur, { once: true });
    element.addEventListener('keydown', onKey);
    const range = element.ownerDocument.createRange();
    range.selectNodeContents(element);
    const selection = element.ownerDocument.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    setStatus('正在编辑文字 · Enter 完成 · Esc 取消');
  }

  showHover(element) {
    if (this.preview || !element || element === model.selected || FORBIDDEN_SELECT.has(element.tagName)) {
      this.hover.hidden = true;
      return;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width > this.iframe.clientWidth * 0.92 && rect.height > this.iframe.clientHeight * 0.72) {
      this.hover.hidden = true;
      return;
    }
    Object.assign(this.hover.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    this.hover.hidden = false;
  }

  updateOverlay() {
    const element = model.selected;
    if (!element?.isConnected || this.preview || model.mode !== 'visual') {
      this.layer.hidden = true;
      return;
    }
    renderSelectionContext(element);
    this.layer.hidden = false;
    const rect = element.getBoundingClientRect();
    const left = rect.left;
    const top = rect.top;
    Object.assign(this.frame.style, { left: `${left}px`, top: `${top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    this.label.textContent = this.describe(element);
    Object.assign(this.label.style, { left: `${left}px`, top: `${Math.max(0, top - 20)}px` });
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    this.size.textContent = `${width} × ${height}`;
    const sizeTop = top + rect.height + 24 < this.iframe.clientHeight ? top + rect.height + 5 : Math.max(1, top + rect.height - 20);
    const sizeLeft = Math.min(Math.max(2, left + rect.width - 66), Math.max(2, this.iframe.clientWidth - 68));
    Object.assign(this.size.style, { left: `${sizeLeft}px`, top: `${sizeTop}px` });
    const summarySize = byId('summary-size');
    if (summarySize) summarySize.textContent = `${width} × ${height}`;
    const toolbarTop = top > 42 ? top - 36 : top + rect.height + 7;
    const toolbarLeft = Math.min(Math.max(2, left), Math.max(2, this.iframe.clientWidth - this.actions.offsetWidth - 4));
    Object.assign(this.actions.style, { left: `${toolbarLeft}px`, top: `${Math.max(2, toolbarTop)}px` });
    const knobs = {
      x: [left + rect.width - 5, top + rect.height / 2 - 5],
      y: [left + rect.width / 2 - 5, top + rect.height - 5],
      xy: [left + rect.width - 5, top + rect.height - 5],
    };
    Object.entries(knobs).forEach(([key, [x, y]]) => {
      const handle = pick(`[data-resize="${key}"]`, this.layer);
      Object.assign(handle.style, { left: `${x}px`, top: `${y}px` });
    });
    renderPath();
  }

  describe(element) {
    const id = element.id ? `#${element.id}` : '';
    const classes = Array.from(element.classList).slice(0, 2).map((name) => `.${name}`).join('');
    return `${element.tagName.toLowerCase()}${id}${classes}`;
  }

  runCommand(command) {
    if (command === 'insert') return openInsertPalette();
    const element = model.selected;
    if (!element) return;
    if (command === 'edit') return this.editText(element);
    if (command === 'review') return ai.openReview();
    if (command === 'parent') {
      const parent = element.parentElement;
      if (parent && parent !== model.doc.documentElement) model.select(parent);
      return;
    }
    if (command === 'duplicate') {
      const copy = element.cloneNode(true);
      element.after(copy);
      model.select(copy);
      model.checkpoint('复制元素');
    }
    if (command === 'remove') {
      const next = element.nextElementSibling || element.previousElementSibling || element.parentElement;
      element.remove();
      model.select(next === model.doc.body ? null : next);
      model.checkpoint('删除元素');
    }
    if (command === 'before' && element.previousElementSibling) {
      element.parentElement.insertBefore(element, element.previousElementSibling);
      model.checkpoint('元素上移');
    }
    if (command === 'after' && element.nextElementSibling) {
      element.parentElement.insertBefore(element.nextElementSibling, element);
      model.checkpoint('元素下移');
    }
    if ((command === 'list-before' || command === 'list-after') && element.tagName === 'LI') {
      const item = element.cloneNode(false);
      item.textContent = '新的列表项';
      if (command === 'list-before') element.before(item); else element.after(item);
      model.select(item);
      model.checkpoint('添加列表项');
    }
    if ((command === 'row-before' || command === 'row-after') && element.closest('tr')) {
      const row = element.closest('tr');
      const newRow = row.cloneNode(true);
      Array.from(newRow.cells).forEach((cell) => { cell.textContent = '新单元格'; });
      if (command === 'row-before') row.before(newRow); else row.after(newRow);
      model.select(newRow.cells[0] || newRow);
      model.checkpoint('添加表格行');
    }
    if ((command === 'col-before' || command === 'col-after') && element.closest('tr')) {
      const cell = element.closest('th,td');
      const table = element.closest('table');
      if (cell && table) {
        const index = cell.cellIndex + (command === 'col-after' ? 1 : 0);
        Array.from(table.rows).forEach((row) => {
          const reference = row.cells[Math.min(index, row.cells.length - 1)];
          const newCell = model.doc.createElement(row.parentElement?.tagName === 'THEAD' ? 'th' : 'td');
          if (reference?.getAttribute('style')) newCell.setAttribute('style', reference.getAttribute('style'));
          newCell.textContent = '新单元格';
          if (index >= row.cells.length) row.append(newCell); else row.insertBefore(newCell, row.cells[index]);
        });
        model.checkpoint('添加表格列');
      }
    }
    renderTree();
    setStatus(model.history[model.cursor]?.label || '已更新元素');
    this.updateOverlay();
  }

  beginResize(event, axis) {
    const element = model.selected;
    if (!element) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const rect = element.getBoundingClientRect();
    this.resizeSession = { element, axis, x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, ratio: rect.width / Math.max(1, rect.height), changed: false };
  }

  beginMove(event) {
    const element = model.selected;
    if (!element) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    this.moveSession = { element, x: event.clientX, y: event.clientY, transform: element.style.transform || '', changed: false };
    this.actions.classList.add('moving');
    setStatus('正在移动元素 · 松开鼠标完成');
  }

  updateMove(event) {
    const session = this.moveSession;
    if (!session) return;
    const dx = Math.round((event.clientX - session.x) / canvasZoom);
    const dy = Math.round((event.clientY - session.y) / canvasZoom);
    session.element.style.transform = `${session.transform} translate(${dx}px, ${dy}px)`.trim();
    session.changed = Math.abs(dx) + Math.abs(dy) > 1;
    model.setDirty(true);
    this.updateOverlay();
  }

  endMove() {
    const session = this.moveSession;
    if (!session) return;
    if (!session.changed) session.element.style.transform = session.transform;
    else {
      model.checkpoint('自由移动元素');
      setStatus('已自由移动元素');
      toast('元素位置已更新', 'success');
    }
    this.actions.classList.remove('moving');
    this.moveSession = null;
  }

  updateResize(event) {
    const session = this.resizeSession;
    if (!session) return;
    const dx = event.clientX - session.x;
    const dy = event.clientY - session.y;
    let width = Math.max(12, session.width + dx);
    let height = Math.max(12, session.height + dy);
    if (event.shiftKey && session.axis === 'xy') height = width / session.ratio;
    if (session.axis.includes('x')) session.element.style.width = `${Math.round(width)}px`;
    if (session.axis.includes('y')) session.element.style.height = `${Math.round(height)}px`;
    session.changed = true;
    model.setDirty(true);
    this.updateOverlay();
  }

  endResize() {
    if (!this.resizeSession) return;
    if (this.resizeSession.changed) model.checkpoint('调整尺寸');
    this.resizeSession = null;
  }

  beginBlockDrag(event, index, item) {
    if (event.button !== 0 || event.target.closest('button') || !model.doc) return;
    this.blockDragSession = {
      pointerId: event.pointerId,
      index,
      item,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      node: null,
      target: null,
      position: 'after',
      ghost: null,
    };
    item.setPointerCapture?.(event.pointerId);
  }

  updateBlockDrag(event) {
    const session = this.blockDragSession;
    if (!session || session.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - session.startX, event.clientY - session.startY);
    if (!session.active && distance < 6) return;
    if (!session.active) {
      session.active = true;
      session.node = this.createNode(BLOCKS[session.index]?.[3]);
      session.ghost = session.item.cloneNode(true);
      session.ghost.className = 'block-drag-ghost';
      session.ghost.querySelector('button')?.remove();
      document.body.append(session.ghost);
      session.item.classList.add('dragging');
      document.body.classList.add('dragging-block');
    }
    event.preventDefault();
    Object.assign(session.ghost.style, { left: `${event.clientX + 14}px`, top: `${event.clientY + 14}px` });
    const iframeRect = this.iframe.getBoundingClientRect();
    const inside = event.clientX >= iframeRect.left && event.clientX <= iframeRect.right && event.clientY >= iframeRect.top && event.clientY <= iframeRect.bottom;
    if (!inside || !session.node) {
      session.target = null;
      this.dropMarker.hidden = true;
      return;
    }
    const scaleX = iframeRect.width / Math.max(1, this.iframe.clientWidth);
    const scaleY = iframeRect.height / Math.max(1, this.iframe.clientHeight);
    const localX = (event.clientX - iframeRect.left) / Math.max(.01, scaleX);
    const localY = (event.clientY - iframeRect.top) / Math.max(.01, scaleY);
    let target = model.doc.elementFromPoint(localX, localY);
    if (target?.tagName === 'HTML') target = model.doc.body;
    if (!target || FORBIDDEN_SELECT.has(target.tagName)) {
      session.target = null;
      this.dropMarker.hidden = true;
      return;
    }
    const rect = target.getBoundingClientRect();
    const ratio = (localY - rect.top) / Math.max(1, rect.height);
    let position = ratio < .28 ? 'before' : ratio > .72 ? 'after' : 'inside';
    if (position === 'inside' && !this.canContain(target, session.node)) position = 'after';
    session.target = target;
    session.position = position;
    const y = position === 'before' ? rect.top : position === 'after' ? rect.bottom : rect.top + rect.height / 2;
    Object.assign(this.dropMarker.style, { left: `${rect.left}px`, top: `${y}px`, width: `${Math.max(28, rect.width)}px` });
    this.dropMarker.hidden = false;
  }

  endBlockDrag(event, cancel = false) {
    const session = this.blockDragSession;
    if (!session || session.pointerId !== event.pointerId) return;
    if (session.active) {
      session.item.dataset.blockDragged = 'true';
      window.setTimeout(() => { delete session.item.dataset.blockDragged; }, 0);
      if (!cancel && session.target) {
        const node = this.createNode(BLOCKS[session.index]?.[3]);
        if (this.insertNode(node, session.target, session.position)) {
          const name = BLOCKS[session.index]?.[1] || '组件';
          setStatus(`已拖入${name}`);
          toast(`已拖入${name}`, 'success');
        }
      }
    }
    if (session.item.hasPointerCapture?.(session.pointerId)) session.item.releasePointerCapture(session.pointerId);
    session.item.classList.remove('dragging');
    session.ghost?.remove();
    document.body.classList.remove('dragging-block');
    this.dropMarker.hidden = true;
    this.blockDragSession = null;
  }

  dragOver(event) {
    const blockId = event.dataTransfer.types.includes('application/x-html-designer-block');
    const snippet = event.dataTransfer.types.includes('application/x-html-designer-snippet');
    const path = event.dataTransfer.types.includes('application/x-html-designer-path');
    if (!blockId && !snippet && !path) return;
    event.preventDefault();
    const target = event.target.closest?.('*');
    if (!target || FORBIDDEN_SELECT.has(target.tagName)) return;
    const rect = target.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height * 0.34 ? 'before' : event.clientY > rect.bottom - rect.height * 0.34 ? 'after' : 'inside';
    this.dropTarget = { target, position };
    const y = position === 'before' ? rect.top : position === 'after' ? rect.bottom : rect.top + rect.height / 2;
    Object.assign(this.dropMarker.style, { left: `${rect.left}px`, top: `${y}px`, width: `${Math.max(28, rect.width)}px` });
    this.dropMarker.hidden = false;
  }

  drop(event) {
    if (!this.dropTarget) return;
    event.preventDefault();
    const blockIndex = event.dataTransfer.getData('application/x-html-designer-block');
    const snippetHtml = event.dataTransfer.getData('application/x-html-designer-snippet');
    const movePath = event.dataTransfer.getData('application/x-html-designer-path');
    let node = null;
    if (blockIndex !== '') node = this.createNode(BLOCKS[Number(blockIndex)]?.[3]);
    else if (snippetHtml) node = this.createNode(snippetHtml);
    else if (movePath) node = model.resolvePath(safeJson(movePath, null));
    if (node) this.insertNode(node, this.dropTarget.target, this.dropTarget.position);
    this.dropTarget = null;
    this.dropMarker.hidden = true;
  }

  createNode(html) {
    if (!html || !model.doc) return null;
    const template = model.doc.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
  }

  canContain(element, node = null) {
    if (!element || VOID_TAGS.has(element.tagName)) return false;
    const childTag = node?.tagName;
    if (FLOW_CONTAINERS.has(element.tagName)) return true;
    if (PHRASING_CONTAINERS.has(element.tagName)) return Boolean(childTag && PHRASING_CONTENT.has(childTag));
    if (['UL', 'OL'].includes(element.tagName)) return childTag === 'LI';
    if (element.tagName === 'DL') return ['DT', 'DD'].includes(childTag);
    if (element.tagName === 'TABLE') return ['CAPTION', 'COLGROUP', 'THEAD', 'TBODY', 'TFOOT', 'TR'].includes(childTag);
    if (['THEAD', 'TBODY', 'TFOOT'].includes(element.tagName)) return childTag === 'TR';
    if (element.tagName === 'TR') return ['TD', 'TH'].includes(childTag);
    if (element.tagName === 'SELECT') return ['OPTION', 'OPTGROUP'].includes(childTag);
    if (element.tagName === 'PICTURE') return ['SOURCE', 'IMG'].includes(childTag);
    return false;
  }

  insertNode(node, target = model.selected || model.doc?.body, position = 'inside') {
    if (!node || !target || node === target || node.contains(target)) return false;
    if (position === 'inside' && this.canContain(target, node)) target.append(node);
    else if (position === 'before' && target.parentElement) target.before(node);
    else if (target.parentElement) target.after(node);
    else model.doc.body.append(node);
    model.select(node);
    model.checkpoint('插入元素');
    renderTree();
    return true;
  }

  setPreview(value) {
    this.preview = Boolean(value);
    if (this.preview) {
      this.layer.hidden = true;
      this.hover.hidden = true;
    } else this.updateOverlay();
  }
}

const canvas = new CanvasController();

function renderSelectionContext(element) {
  const root = byId('selection-context');
  const divider = byId('context-divider');
  if (!root || !divider) return;
  const commands = [];
  if (element?.tagName === 'LI') {
    commands.push(['list-before', '上方添加列表项', 'up'], ['list-after', '下方添加列表项', 'down']);
  } else if (element?.closest?.('th,td')) {
    commands.push(['row-after', '下方添加行', 'down'], ['col-after', '右侧添加列', 'external']);
  }
  root.innerHTML = commands.map(([command, label, icon]) => `<button class="tooltip" type="button" data-command="${command}" aria-label="${escapeText(label)}" data-tooltip="${escapeText(label)}">${iconMarkup(icon)}</button>`).join('');
  divider.hidden = !commands.length;
}

function insertBlock(index) {
  const block = BLOCKS[Number(index)];
  if (!block || !model.doc) return false;
  const node = canvas.createNode(block[3]);
  const target = model.selected || model.doc.body;
  const position = !model.selected || canvas.canContain(target, node) ? 'inside' : 'after';
  const inserted = node && canvas.insertNode(node, target, position);
  if (inserted) {
    setStatus(`已插入${block[1]}`);
    toast(`已插入${block[1]}`, 'success');
  }
  return Boolean(inserted);
}

function renderBlocks(filter = '') {
  const root = byId('block-list');
  const query = filter.trim().toLowerCase();
  root.replaceChildren();
  let previousGroup = '';
  let matches = 0;
  BLOCKS.forEach((block, index) => {
    const [group, name, symbol, html] = block;
    if (query && !`${group} ${name} ${html}`.toLowerCase().includes(query)) return;
    matches += 1;
    if (group !== previousGroup) {
      const heading = document.createElement('div');
      heading.className = 'block-group';
      heading.textContent = group;
      root.append(heading);
      previousGroup = group;
    }
    const item = document.createElement('div');
    item.className = 'block-item';
    item.tabIndex = 0;
    item.dataset.blockIndex = String(index);
    const rootTag = html.match(/^\s*<([a-z][a-z0-9-]*)/i)?.[1]?.toLowerCase() || 'html';
    item.innerHTML = `<span class="block-symbol">${escapeText(symbol)}</span><span><strong>${escapeText(name)}</strong><small>${escapeText(rootTag)}</small></span><button class="block-insert" type="button" aria-label="插入${escapeText(name)}">+</button>`;
    item.addEventListener('pointerdown', (event) => canvas.beginBlockDrag(event, index, item));
    item.addEventListener('click', (event) => {
      if (event.target.closest('button') || item.dataset.blockDragged) return;
      insertBlock(index);
    });
    item.addEventListener('keydown', (event) => {
      if (!['Enter', ' '].includes(event.key) || event.target.closest('button')) return;
      event.preventDefault();
      insertBlock(index);
    });
    pick('.block-insert', item).addEventListener('click', (event) => { event.stopPropagation(); insertBlock(index); });
    root.append(item);
  });
  if (!matches) root.innerHTML = emptyStateMarkup('search', '没有找到组件', '试试“卡片”“双栏”或“按钮”。');
}

const collapsedElements = new WeakSet();
let treeDragElement = null;

function clearTreeDropState() {
  pickAll('.tree-row.drag-before, .tree-row.drag-inside, .tree-row.drag-after').forEach((row) => row.classList.remove('drag-before', 'drag-inside', 'drag-after'));
}

function renderTree() {
  const root = byId('element-tree');
  root.replaceChildren();
  if (!model.doc?.body) {
    root.innerHTML = emptyStateMarkup('tree', '结构树等待文档', '打开或新建 HTML 后，页面层级会显示在这里。');
    return;
  }
  const appendElement = (element, depth) => {
    const row = document.createElement('div');
    const collapsed = collapsedElements.has(element);
    row.className = `tree-row${element === model.selected ? ' selected' : ''}${collapsed ? ' collapsed' : ''}`;
    row.style.paddingLeft = `${Math.min(14, depth) * 11}px`;
    row.draggable = element !== model.doc.body;
    const toggle = document.createElement(element.children.length ? 'button' : 'span');
    toggle.className = 'tree-toggle';
    if (element.children.length) toggle.type = 'button';
    toggle.innerHTML = element.children.length ? iconMarkup('down') : '<span class="tree-dot"></span>';
    if (element.children.length) toggle.setAttribute('aria-label', collapsed ? '展开' : '折叠');
    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = canvas.describe(element);
    row.append(toggle, label);
    if (element.children.length) {
      toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        if (collapsedElements.has(element)) collapsedElements.delete(element); else collapsedElements.add(element);
        renderTree();
      });
    }
    row.addEventListener('click', (event) => { if (!event.target.closest('.tree-toggle')) model.select(element); });
    row.addEventListener('dragstart', (event) => {
      treeDragElement = element;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/x-html-designer-path', JSON.stringify(model.elementPath(element)));
      window.setTimeout(() => row.classList.add('dragging'), 0);
    });
    row.addEventListener('dragover', (event) => {
      if (!treeDragElement || treeDragElement === element || treeDragElement.contains(element)) return;
      event.preventDefault();
      event.stopPropagation();
      clearTreeDropState();
      const rect = row.getBoundingClientRect();
      const ratio = (event.clientY - rect.top) / Math.max(1, rect.height);
      const position = ratio < .28 ? 'before' : ratio > .72 || !canvas.canContain(element, treeDragElement) ? 'after' : 'inside';
      row.classList.add(`drag-${position}`);
      row.dataset.dropPosition = position;
      event.dataTransfer.dropEffect = 'move';
    });
    row.addEventListener('dragleave', (event) => {
      if (!row.contains(event.relatedTarget)) row.classList.remove('drag-before', 'drag-inside', 'drag-after');
    });
    row.addEventListener('drop', (event) => {
      if (!treeDragElement) return;
      event.preventDefault();
      event.stopPropagation();
      const position = row.dataset.dropPosition || 'after';
      const moved = canvas.insertNode(treeDragElement, element, position);
      clearTreeDropState();
      treeDragElement = null;
      if (moved) setStatus(`已移动到 ${canvas.describe(element)} ${position === 'inside' ? '内部' : position === 'before' ? '之前' : '之后'}`);
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      clearTreeDropState();
      treeDragElement = null;
    });
    root.append(row);
    if (!collapsed) Array.from(element.children).filter((child) => !['SCRIPT', 'STYLE'].includes(child.tagName)).forEach((child) => appendElement(child, depth + 1));
  };
  appendElement(model.doc.body, 0);
}

function renderPath() {
  const root = byId('selection-path');
  root.replaceChildren();
  let node = model.selected;
  const chain = [];
  while (node && node !== model.doc?.documentElement) { chain.unshift(node); node = node.parentElement; }
  chain.forEach((element) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = canvas.describe(element);
    button.onclick = () => model.select(element);
    root.append(button);
  });
  byId('selection-utilities').hidden = !model.selected;
}

function cssSelectorPath(element = model.selected) {
  if (!element) return '';
  const parts = [];
  let node = element;
  while (node && node.nodeType === 1 && node !== model.doc.documentElement) {
    let part = node.tagName.toLowerCase();
    if (node.id) {
      const safeId = window.CSS?.escape ? window.CSS.escape(node.id) : node.id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
      parts.unshift(`${part}#${safeId}`);
      break;
    }
    const siblings = node.parentElement ? Array.from(node.parentElement.children).filter((item) => item.tagName === node.tagName) : [];
    if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
    parts.unshift(part);
    node = node.parentElement;
  }
  return parts.join(' > ');
}

function updateSourceStats() {
  const source = byId('source-editor')?.value || '';
  const lines = source ? source.split(/\r?\n/).length : 0;
  const target = byId('source-stats');
  if (target) target.textContent = `${lines} 行 · ${source.length.toLocaleString()} 字符`;
}

function emptyStateMarkup(icon, title, copy) {
  return `<div class="product-empty">${iconMarkup(icon, 'icon product-empty-icon')}<strong>${escapeText(title)}</strong><p>${escapeText(copy)}</p></div>`;
}

function renderSelectionSummary(element = model.selected) {
  const root = byId('inspector-summary');
  if (!root) return;
  if (!element?.isConnected) {
    root.hidden = true;
    return;
  }
  const rect = element.getBoundingClientRect();
  byId('summary-tag').textContent = element.tagName.length > 7 ? `${element.tagName.slice(0, 6)}…` : element.tagName;
  byId('summary-name').textContent = canvas.describe(element);
  byId('summary-selector').textContent = cssSelectorPath(element) || element.tagName.toLowerCase();
  byId('summary-size').textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
  byId('summary-edit-button').disabled = VOID_TAGS.has(element.tagName);
  root.hidden = false;
}

function edgeValue(computed, property) {
  const value = computed.getPropertyValue(property).trim();
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? `${Math.round(number)}` : value || '0';
}

function boxModelDiagram(element, computed) {
  const rect = element.getBoundingClientRect();
  const section = document.createElement('section');
  section.className = 'box-model-section';
  const edges = (name) => ({
    top: edgeValue(computed, `${name}-top${name === 'border' ? '-width' : ''}`),
    right: edgeValue(computed, `${name}-right${name === 'border' ? '-width' : ''}`),
    bottom: edgeValue(computed, `${name}-bottom${name === 'border' ? '-width' : ''}`),
    left: edgeValue(computed, `${name}-left${name === 'border' ? '-width' : ''}`),
  });
  const margin = edges('margin');
  const border = edges('border');
  const padding = edges('padding');
  const layer = (name, values, inner = '') => `<div class="box-layer ${name}-layer"><span class="box-caption">${name}</span><i class="edge top">${escapeText(values.top)}</i><i class="edge right">${escapeText(values.right)}</i><i class="edge bottom">${escapeText(values.bottom)}</i><i class="edge left">${escapeText(values.left)}</i>${inner}</div>`;
  const numeric = (property) => Number.parseFloat(computed.getPropertyValue(property)) || 0;
  const contentWidth = Math.max(0, rect.width - numeric('padding-left') - numeric('padding-right') - numeric('border-left-width') - numeric('border-right-width'));
  const contentHeight = Math.max(0, rect.height - numeric('padding-top') - numeric('padding-bottom') - numeric('border-top-width') - numeric('border-bottom-width'));
  const content = `<div class="content-layer"><strong>${Math.round(contentWidth)} × ${Math.round(contentHeight)}</strong><small>content</small></div>`;
  section.innerHTML = `<header><h3>盒模型</h3><small>单位 px</small></header>${layer('margin', margin, layer('border', border, layer('padding', padding, content)))}`;
  return section;
}

function group(title, rows) {
  const section = document.createElement('section');
  section.className = 'control-group';
  const heading = document.createElement('h3');
  heading.textContent = title;
  section.append(heading, ...rows.filter(Boolean));
  return section;
}

function control(label, value, apply, options = {}) {
  const row = document.createElement('div');
  row.className = 'control-row';
  const caption = document.createElement('label');
  caption.textContent = label;
  let input;
  if (options.values) {
    input = document.createElement('select');
    options.values.forEach((item) => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item || '—';
      input.append(option);
    });
  } else {
    input = document.createElement('input');
    input.type = options.type || 'text';
  }
  input.value = value ?? '';
  input.addEventListener(options.live ? 'input' : 'change', () => apply(input.value));
  row.append(caption, input);
  return row;
}

function styleControl(element, label, property, value, options) {
  return control(label, value, (next) => {
    if (next) element.style.setProperty(property, next); else element.style.removeProperty(property);
    if (!element.getAttribute('style')) element.removeAttribute('style');
    model.checkpoint(`样式 ${property}`);
    canvas.updateOverlay();
  }, options);
}

function renderInspectors() {
  const element = model.selected;
  const targets = ['style-inspector', 'attribute-inspector', 'behavior-inspector', 'markup-inspector'].map(byId);
  renderSelectionSummary(element);
  if (!element) {
    const emptyStates = [
      ['sliders', '选择一个元素', '在画布或结构树中选择元素后，可以调整字体、布局、间距和外观。'],
      ['tag', '暂无元素属性', '选择元素后，这里会显示标签、类名和 HTML 属性。'],
      ['bolt', '暂无交互设置', '选择元素后，可以为它配置点击、悬停和表单动作。'],
      ['braces', '暂无 HTML 内容', '选择元素后，可以精确编辑它的内部或外部 HTML。'],
    ];
    targets.forEach((target, index) => { target.innerHTML = emptyStateMarkup(...emptyStates[index]); });
    return;
  }
  renderStyleInspector(element);
  renderAttributeInspector(element);
  renderBehaviorInspector(element);
  renderMarkupInspector(element);
}

function renderStyleInspector(element) {
  const root = byId('style-inspector');
  const computed = element.ownerDocument.defaultView.getComputedStyle(element);
  root.replaceChildren(
    boxModelDiagram(element, computed),
    group('字体', [
      styleControl(element, '字体', 'font-family', element.style.fontFamily || computed.fontFamily, { values: ['', 'system-ui', 'Arial, sans-serif', 'Georgia, serif', 'ui-monospace, monospace'] }),
      styleControl(element, '字号', 'font-size', element.style.fontSize || computed.fontSize),
      styleControl(element, '字重', 'font-weight', element.style.fontWeight || computed.fontWeight, { values: ['', '300', '400', '500', '600', '700', '800', '900'] }),
      styleControl(element, '行高', 'line-height', element.style.lineHeight || ''),
      styleControl(element, '对齐', 'text-align', element.style.textAlign || computed.textAlign, { values: ['', 'left', 'center', 'right', 'justify'] }),
      styleControl(element, '颜色', 'color', rgbToHex(computed.color), { type: 'color' }),
    ]),
    group('布局', [
      styleControl(element, 'Display', 'display', element.style.display || computed.display, { values: ['', 'block', 'inline', 'inline-block', 'flex', 'grid', 'none'] }),
      styleControl(element, 'Position', 'position', element.style.position || computed.position, { values: ['', 'static', 'relative', 'absolute', 'fixed', 'sticky'] }),
      styleControl(element, '宽度', 'width', element.style.width || ''),
      styleControl(element, '高度', 'height', element.style.height || ''),
      styleControl(element, '最大宽度', 'max-width', element.style.maxWidth || ''),
      styleControl(element, 'Gap', 'gap', element.style.gap || ''),
      styleControl(element, '方向', 'flex-direction', element.style.flexDirection || '', { values: ['', 'row', 'column', 'row-reverse', 'column-reverse'] }),
      styleControl(element, '分布', 'justify-content', element.style.justifyContent || '', { values: ['', 'flex-start', 'center', 'flex-end', 'space-between', 'space-around'] }),
      styleControl(element, '对齐', 'align-items', element.style.alignItems || '', { values: ['', 'stretch', 'flex-start', 'center', 'flex-end'] }),
    ]),
    group('间距', [
      styleControl(element, 'Margin', 'margin', element.style.margin || ''),
      styleControl(element, 'Padding', 'padding', element.style.padding || ''),
    ]),
    group('外观', [
      styleControl(element, '背景色', 'background-color', rgbToHex(computed.backgroundColor), { type: 'color' }),
      styleControl(element, '圆角', 'border-radius', element.style.borderRadius || computed.borderRadius),
      styleControl(element, '边框', 'border', element.style.border || ''),
      styleControl(element, '阴影', 'box-shadow', element.style.boxShadow || ''),
      styleControl(element, '透明度', 'opacity', element.style.opacity || computed.opacity),
      styleControl(element, 'Transform', 'transform', element.style.transform || ''),
    ]),
  );
}

function rgbToHex(value) {
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return '#ffffff';
  if (value.startsWith('#')) return value;
  const match = value.match(/\d+/g);
  if (!match || match.length < 3) return '#000000';
  return `#${match.slice(0, 3).map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`;
}

function renderAttributeInspector(element) {
  const root = byId('attribute-inspector');
  root.replaceChildren();
  const basics = group('元素', [
    control('标签', element.tagName.toLowerCase(), (tag) => changeTag(element, tag)),
    control('ID', element.id, (value) => { element.id = value; model.checkpoint('修改 ID'); renderTree(); }),
  ]);
  const classes = group('类名', []);
  const chipList = document.createElement('div');
  chipList.className = 'chip-list';
  Array.from(element.classList).forEach((name) => {
    const chip = document.createElement('span');
    chip.className = 'class-chip';
    chip.innerHTML = `${escapeText(name)}<button type="button">×</button>`;
    pick('button', chip).onclick = () => { element.classList.remove(name); model.checkpoint('删除 class'); renderInspectors(); renderTree(); };
    chipList.append(chip);
  });
  classes.append(chipList, control('添加', '', (value) => {
    value.split(/\s+/).filter(Boolean).forEach((name) => element.classList.add(name.replace(/^\./, '')));
    model.checkpoint('添加 class');
    renderInspectors();
    renderTree();
  }));

  const attributes = group('属性', []);
  Array.from(element.attributes).filter((attribute) => !['class', 'id', 'style', 'contenteditable', 'data-hd-editing'].includes(attribute.name)).forEach((attribute) => {
    const row = document.createElement('div');
    row.className = 'attribute-row';
    const name = document.createElement('input');
    const value = document.createElement('input');
    const remove = document.createElement('button');
    name.value = attribute.name;
    value.value = attribute.value;
    remove.textContent = '×';
    const update = () => {
      const nextName = name.value.trim();
      if (!nextName || /[\s"'<>/=]/.test(nextName)) return;
      element.removeAttribute(attribute.name);
      element.setAttribute(nextName, value.value);
      model.checkpoint('修改属性');
    };
    name.onchange = update;
    value.onchange = update;
    remove.onclick = () => { element.removeAttribute(attribute.name); model.checkpoint('删除属性'); renderInspectors(); };
    row.append(name, value, remove);
    attributes.append(row);
  });
  const add = document.createElement('button');
  add.className = 'wide-button';
  add.type = 'button';
  add.textContent = '添加属性';
  add.onclick = async () => {
    const name = await modal.prompt('添加属性', '输入属性名称，例如 aria-label 或 data-id。');
    if (!name || /[\s"'<>/=]/.test(name)) return;
    element.setAttribute(name, '');
    model.checkpoint('添加属性');
    renderInspectors();
  };
  attributes.append(add);
  root.append(basics, classes, attributes);
}

function changeTag(element, tag) {
  const name = tag.trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]*$/.test(name) || name === element.tagName.toLowerCase()) return;
  const replacement = element.ownerDocument.createElement(name);
  Array.from(element.attributes).forEach((attribute) => replacement.setAttribute(attribute.name, attribute.value));
  while (element.firstChild) replacement.append(element.firstChild);
  element.replaceWith(replacement);
  model.select(replacement);
  model.checkpoint('更换标签');
  renderTree();
}

function renderBehaviorInspector(element) {
  const root = byId('behavior-inspector');
  root.replaceChildren();
  const section = group('事件动作', []);
  const eventRow = control('事件', 'onclick', () => {}, { values: ['onclick', 'ondblclick', 'onmouseenter', 'onmouseleave', 'oninput', 'onchange', 'onsubmit', 'onfocus', 'onblur'] });
  const actionRow = control('动作', 'none', () => {}, { values: ['none', 'link', 'alert', 'toggle', 'toggle-class', 'custom'] });
  const valueRow = control('参数', '', () => {});
  const eventInput = pick('select', eventRow);
  const actionInput = pick('select', actionRow);
  const valueInput = pick('input', valueRow);
  const code = document.createElement('textarea');
  code.placeholder = 'event.preventDefault();\nthis.classList.toggle("active");';
  const sync = () => {
    const eventName = eventInput.value;
    actionInput.value = element.getAttribute(`data-hd-${eventName}-action`) || (element.hasAttribute(eventName) ? 'custom' : 'none');
    valueInput.value = element.getAttribute(`data-hd-${eventName}-value`) || '';
    code.value = element.getAttribute(eventName) || '';
    code.hidden = actionInput.value !== 'custom';
    valueRow.hidden = ['none', 'custom'].includes(actionInput.value);
  };
  eventInput.onchange = sync;
  actionInput.onchange = () => { code.hidden = actionInput.value !== 'custom'; valueRow.hidden = ['none', 'custom'].includes(actionInput.value); };
  const actions = document.createElement('div');
  actions.className = 'control-actions';
  actions.innerHTML = '<button type="button" data-apply>应用</button><button type="button" data-clear>清除</button>';
  pick('[data-apply]', actions).onclick = () => {
    const eventName = eventInput.value;
    const action = actionInput.value;
    const value = valueInput.value.trim();
    const scripts = {
      link: `location.href=${JSON.stringify(value)};`,
      alert: `alert(${JSON.stringify(value)});`,
      toggle: `var t=document.querySelector(${JSON.stringify(value)});if(t)t.hidden=!t.hidden;`,
      'toggle-class': (() => { const [selector, className = 'active'] = value.split(/\s+(?=[^\s]+$)/); return `var t=document.querySelector(${JSON.stringify(selector || 'body')});if(t)t.classList.toggle(${JSON.stringify(className.replace(/^\./, ''))});`; })(),
      custom: code.value,
    };
    if (action === 'none') element.removeAttribute(eventName);
    else element.setAttribute(eventName, scripts[action] || '');
    element.setAttribute(`data-hd-${eventName}-action`, action);
    element.setAttribute(`data-hd-${eventName}-value`, value);
    model.checkpoint('设置交互');
    sync();
  };
  pick('[data-clear]', actions).onclick = () => {
    const eventName = eventInput.value;
    element.removeAttribute(eventName);
    element.removeAttribute(`data-hd-${eventName}-action`);
    element.removeAttribute(`data-hd-${eventName}-value`);
    model.checkpoint('清除交互');
    sync();
  };
  section.append(eventRow, actionRow, valueRow, code, actions);
  root.append(section);
  sync();
}

function renderMarkupInspector(element) {
  const root = byId('markup-inspector');
  root.replaceChildren();
  const outer = group('Outer HTML', []);
  const outerArea = document.createElement('textarea');
  outerArea.value = element.outerHTML;
  const outerActions = document.createElement('div');
  outerActions.className = 'control-actions';
  outerActions.innerHTML = '<button type="button">应用 outer HTML</button>';
  pick('button', outerActions).onclick = () => {
    const template = element.ownerDocument.createElement('template');
    template.innerHTML = outerArea.value.trim();
    if (template.content.children.length !== 1) return toast('Outer HTML 必须只有一个根元素', 'error');
    const replacement = template.content.firstElementChild;
    element.replaceWith(replacement);
    model.select(replacement);
    model.checkpoint('编辑 outer HTML');
    renderTree();
    renderInspectors();
    canvas.updateOverlay();
    setStatus('Outer HTML 已应用');
    toast('元素 HTML 已更新', 'success');
  };
  outer.append(outerArea, outerActions);
  const inner = group('Inner HTML', []);
  const innerArea = document.createElement('textarea');
  innerArea.value = element.innerHTML;
  const innerActions = document.createElement('div');
  innerActions.className = 'control-actions';
  innerActions.innerHTML = '<button type="button">应用 inner HTML</button>';
  pick('button', innerActions).onclick = () => {
    element.innerHTML = innerArea.value;
    model.checkpoint('编辑 inner HTML');
    renderTree();
    renderInspectors();
    canvas.updateOverlay();
    setStatus('Inner HTML 已应用');
    toast('元素内容已更新', 'success');
  };
  inner.append(innerArea, innerActions);
  root.append(outer, inner);
}

class FileController {
  constructor() {
    this.picker = byId('file-picker');
    this.picker.onchange = () => {
      const file = this.picker.files?.[0];
      if (file) this.importFile(file);
      this.picker.value = '';
    };
  }

  get canLink() { return window.isSecureContext && 'showOpenFilePicker' in window; }

  async open() {
    if (!this.canLink) {
      toast('当前浏览器不支持直接写回，将改用导入模式', 'error');
      this.picker.click();
      return;
    }
    try {
      const [handle] = await window.showOpenFilePicker({ multiple: false });
      const file = await handle.getFile();
      await this.load(await file.text(), file.name, handle, file.lastModified);
    } catch (error) {
      if (error.name !== 'AbortError') toast(`无法打开文件：${error.message}`, 'error');
    }
  }

  async importFile(file) { await this.load(await file.text(), file.name, null, null); }

  async load(html, name, handle = null, mtime = null) {
    model.fileName = name || 'untitled.html';
    model.fileHandle = handle;
    model.fileMtime = mtime;
    model.sourceText = html;
    model.mode = 'visual';
    await canvas.load(html);
    model.setDirty(false);
    showStudio();
    updateDocumentState();
    byId('refresh-button').disabled = !handle;
    byId('diff-button').disabled = !handle;
    toast(handle ? `已关联 ${model.fileName}` : `已导入 ${model.fileName}`, 'success');
  }

  async newDocument() {
    model.fileName = 'untitled.html';
    model.fileHandle = null;
    model.fileMtime = null;
    model.sourceText = EMPTY_DOCUMENT;
    model.mode = 'visual';
    await canvas.load(EMPTY_DOCUMENT);
    model.setDirty(false);
    showStudio();
    updateDocumentState();
    byId('refresh-button').disabled = true;
    byId('diff-button').disabled = true;
  }

  async save() {
    const html = model.currentText();
    if (!html) return;
    if (!model.fileHandle) return this.export(html);
    try {
      const latest = await model.fileHandle.getFile();
      if (model.fileMtime && latest.lastModified > model.fileMtime) {
        const overwrite = await modal.confirm('磁盘文件已变化', '文件在其他程序中被修改。是否覆盖磁盘版本？', '仍然覆盖');
        if (!overwrite) return;
      }
      const writable = await model.fileHandle.createWritable();
      await writable.write(html);
      await writable.close();
      model.sourceText = html;
      model.fileMtime = (await model.fileHandle.getFile()).lastModified;
      model.setDirty(false);
      toast('已保存到本地文件', 'success');
    } catch (error) { toast(`保存失败：${error.message}`, 'error'); }
  }

  export(html = model.currentText()) {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = model.fileName || 'untitled.html';
    anchor.click();
    URL.revokeObjectURL(url);
    model.sourceText = html;
    model.setDirty(false);
    toast(`已导出 ${anchor.download}`, 'success');
  }

  async refresh() {
    if (!model.fileHandle) return;
    if (model.dirty && !(await modal.confirm('重新读取文件', '当前未保存修改会被磁盘版本替换。', '放弃修改'))) return;
    const file = await model.fileHandle.getFile();
    await this.load(await file.text(), file.name, model.fileHandle, file.lastModified);
  }

  async showDiff() {
    if (!model.fileHandle) return;
    try {
      const file = await model.fileHandle.getFile();
      const disk = await file.text();
      const current = model.currentText();
      if (disk === current) return toast('编辑器与磁盘文件一致', 'success');
      modal.diff(disk, current);
    } catch (error) { toast(`无法读取磁盘文件：${error.message}`, 'error'); }
  }
}

const files = new FileController();

class AiController {
  constructor() {
    this.drawer = byId('ai-drawer');
    this.log = byId('ai-log');
    this.abortController = null;
    this.reviews = [];
    this.pendingReview = null;
    this.loadSettings();
  }

  open() {
    this.drawer.hidden = false;
    byId('studio').classList.add('ai-open');
    byId('ai-button').classList.add('active');
    this.updateTarget();
    requestAnimationFrame(() => { canvas.updateOverlay(); updateCanvasInfo(); });
    byId('ai-input').focus();
  }

  close() {
    this.drawer.hidden = true;
    byId('studio').classList.remove('ai-open');
    byId('ai-button').classList.remove('active');
    requestAnimationFrame(() => { canvas.updateOverlay(); updateCanvasInfo(); });
    byId('ai-button').focus();
  }

  append(text, role = 'assistant') {
    const message = document.createElement('div');
    message.className = `ai-message ${role}`;
    message.textContent = text;
    this.log.append(message);
    this.log.scrollTop = this.log.scrollHeight;
    return message;
  }

  updateTarget() { byId('ai-target').textContent = model.selected ? `目标：${canvas.describe(model.selected)}` : '目标：整个页面'; }

  setConnection(state, title, detail = '') {
    const root = byId('ai-connection');
    root.dataset.state = state;
    pick('strong', root).textContent = title;
    pick('small', root).textContent = detail;
  }

  async responseError(response) {
    const text = await response.text();
    const data = safeJson(text, {});
    const detail = [data.error || `HTTP ${response.status}`, data.hint].filter(Boolean).join(' · ');
    const error = new Error(detail);
    error.code = data.code || `HTTP_${response.status}`;
    error.attempts = data.attempts || [];
    return error;
  }

  loadSettings() {
    const settings = safeJson(localStorage.getItem(STORAGE.ai), {});
    byId('ai-endpoint').value = settings.endpoint || '/api/ai-design';
    byId('ai-cli').value = settings.cli || 'codex';
    byId('ai-model').value = settings.model || '';
    byId('ai-fallback').checked = settings.fallback !== false;
  }

  saveSettings(notify = true) {
    localStorage.setItem(STORAGE.ai, JSON.stringify({
      endpoint: byId('ai-endpoint').value.trim() || '/api/ai-design',
      cli: byId('ai-cli').value,
      model: byId('ai-model').value.trim(),
      fallback: byId('ai-fallback').checked,
    }));
    if (notify) toast('AI 连接设置已保存', 'success');
  }

  selectedContext() {
    if (!model.selected) return null;
    return { target: canvas.describe(model.selected), path: model.elementPath(), html: model.selected.outerHTML };
  }

  async test() {
    this.saveSettings();
    const button = byId('ai-test');
    const requestedCli = byId('ai-cli').value;
    this.setConnection('checking', '正在验证真实请求', '版本、授权和模型服务都会检查');
    button.disabled = true;
    button.textContent = '验证中…';
    try {
      const response = await fetch(byId('ai-endpoint').value.trim() || '/api/ai-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'test',
          cli: requestedCli,
          model: byId('ai-model').value.trim(),
          fallback: byId('ai-fallback').checked,
        }),
      });
      if (!response.ok) throw await this.responseError(response);
      const data = await response.json();
      const switched = data.cli && data.cli !== requestedCli;
      if (data.cli) byId('ai-cli').value = data.cli;
      if (switched) this.saveSettings(false);
      this.setConnection(switched ? 'fallback' : 'ready', switched ? '备用链路已就绪' : '连接可用', `${data.output_text || data.cli} · ${data.latency_ms || 0}ms`);
      this.append(data.output_text || '真实请求验证成功');
      toast(switched ? '已切换到可用 CLI' : 'AI 连接验证成功', 'success');
    } catch (error) {
      this.setConnection('error', '连接不可用', error.message);
      this.append(`连接失败：${error.message}`, 'error');
    } finally {
      button.disabled = false;
      button.textContent = '测试连接';
    }
  }

  async send(options = {}) {
    const input = byId('ai-input');
    const brief = (options.brief || input.value).trim();
    if (!brief) return toast('请先输入设计要求', 'error');
    this.open();
    this.append(brief, 'user');
    input.value = '';
    const progress = this.append('正在连接本机 CLI…');
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;
    const requestedCli = byId('ai-cli').value;
    let activeCli = requestedCli;
    let usedFallback = false;
    this.setConnection('checking', `正在连接 ${requestedCli === 'claude' ? 'Claude Code CLI' : 'Codex CLI'}`, '请求已发送到本机服务');
    byId('ai-stop').hidden = false;
    const selected = this.selectedContext();
    const annotations = options.reviews || [{ type: 'chat', text: brief, target: selected?.target || 'page', path: selected?.path || null, selectedHtml: selected?.html || '' }];
    const payload = {
      mode: model.doc ? 'iterate' : 'create',
      brief,
      currentHtml: model.currentText(),
      annotations,
      selectedElement: selected,
      locale: 'zh',
      cli: requestedCli,
      model: byId('ai-model').value.trim(),
      fallback: byId('ai-fallback').checked,
      stream: true,
    };
    try {
      const response = await fetch(byId('ai-endpoint').value.trim() || '/api/ai-design', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
      if (!response.ok) throw await this.responseError(response);
      let finalHtml = '';
      if (response.body?.getReader) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = safeJson(line, { type: 'stdout', text: line });
            if (event.type === 'status' && event.text) progress.textContent = event.text;
            if (event.type === 'start' && event.cli) activeCli = event.cli;
            if (event.type === 'fallback') {
              finalHtml = '';
              usedFallback = true;
              activeCli = event.to || activeCli;
              progress.textContent = event.text || '当前 CLI 不可用，正在切换备用链路…';
              this.setConnection('fallback', '正在切换备用链路', event.error || event.hint || '');
            }
            if (event.type === 'html' && event.html) finalHtml = event.html;
            if (event.type === 'done') {
              finalHtml = event.html || extractHtml(event.output_text) || finalHtml;
              activeCli = event.cli || activeCli;
              usedFallback ||= Boolean(event.fallback);
            }
            if (event.type === 'stdout' && event.text) progress.textContent = visibleProgress(event.text) || progress.textContent;
            if (event.type === 'stderr' && event.text) progress.textContent = visibleProgress(event.text) || progress.textContent;
            if (event.type === 'error') throw new Error([event.message || event.error || 'AI 输出失败', event.hint].filter(Boolean).join(' · '));
          }
        }
      } else {
        const data = await response.json();
        finalHtml = data.html || extractHtml(data.output_text);
      }
      if (!finalHtml) throw new Error('没有从 CLI 输出中找到完整 HTML');
      const before = model.serializeDocument();
      model.sourceText = finalHtml;
      model.mode = 'visual';
      await canvas.load(finalHtml, { preserveHistory: true });
      model.history = model.history.slice(0, model.cursor + 1);
      model.history.push({ html: finalHtml, path: null, label: 'AI Design' });
      model.cursor = model.history.length - 1;
      if (!before) model.resetHistory(finalHtml);
      model.setDirty(true);
      model.scheduleAutosave();
      model.signal('history');
      progress.textContent = '页面已应用。可以继续在画布上精修。';
      if (activeCli) byId('ai-cli').value = activeCli;
      if (usedFallback) this.saveSettings(false);
      this.setConnection(usedFallback ? 'fallback' : 'ready', usedFallback ? '已使用备用 CLI 完成' : 'AI Design 已连接', activeCli === 'claude' ? 'Claude Code CLI' : 'Codex CLI');
      renderTree();
    } catch (error) {
      progress.classList.add('error');
      progress.textContent = error.name === 'AbortError' ? '已停止本次任务。' : `AI Design 失败：${error.message}`;
      this.setConnection(error.name === 'AbortError' ? 'idle' : 'error', error.name === 'AbortError' ? '任务已停止' : '连接失败', error.name === 'AbortError' ? '可以重新发送请求' : error.message);
    } finally {
      if (this.abortController === controller) {
        this.abortController = null;
        byId('ai-stop').hidden = true;
      }
    }
  }

  stop() { this.abortController?.abort(); }

  openReview() {
    if (!model.selected) return toast('请先选择一个组件', 'error');
    this.pendingReview = this.selectedContext();
    this.open();
    byId('review-box').open = true;
    byId('review-compose').hidden = false;
    byId('review-target').textContent = this.pendingReview.target;
    byId('review-input').value = '';
    byId('review-input').focus();
  }

  addReview() {
    const text = byId('review-input').value.trim();
    if (!text || !this.pendingReview) return;
    this.reviews.unshift({ id: crypto.randomUUID(), checked: true, text, ...this.pendingReview });
    this.pendingReview = null;
    byId('review-compose').hidden = true;
    this.renderReviews();
  }

  renderReviews() {
    const root = byId('review-list');
    root.replaceChildren();
    this.reviews.forEach((review) => {
      const row = document.createElement('div');
      row.className = 'review-item';
      row.innerHTML = `<input type="checkbox" ${review.checked ? 'checked' : ''}><p><small>${escapeText(review.target)}</small>${escapeText(review.text)}</p><button type="button">×</button>`;
      pick('input', row).onchange = (event) => { review.checked = event.target.checked; this.renderReviews(); };
      pick('button', row).onclick = () => { this.reviews = this.reviews.filter((item) => item.id !== review.id); this.renderReviews(); };
      root.append(row);
    });
    const checked = this.reviews.filter((review) => review.checked);
    byId('review-count').textContent = `${checked.length}/${this.reviews.length}`;
    byId('review-send').disabled = checked.length === 0;
  }

  sendReviews() {
    const selected = this.reviews.filter((review) => review.checked);
    const reviews = selected.map((review) => ({ type: 'component-review', text: review.text, target: review.target, path: review.path, selectedHtml: review.html }));
    this.send({ brief: byId('ai-input').value.trim() || '按照选中的组件批注修改页面，并保持其他区域的内容与结构。', reviews });
  }
}

function extractHtml(value = '') {
  const text = String(value);
  const full = text.match(/<!doctype html[\s\S]*<\/html>/i) || text.match(/<html[\s\S]*<\/html>/i);
  if (!full) return '';
  return /^<!doctype/i.test(full[0]) ? full[0] : `<!doctype html>\n${full[0]}`;
}

function visibleProgress(text) {
  const clean = String(text).replace(/\x1b\[[0-9;]*m/g, '').trim();
  if (!clean || /<!doctype|<html|<style|<body/i.test(clean)) return '';
  return clean.slice(-1200);
}

const ai = new AiController();

function readSnippets() { return safeJson(localStorage.getItem(STORAGE.snippets), []); }

function renderSnippets() {
  const root = byId('snippet-list');
  const snippets = readSnippets();
  root.replaceChildren();
  if (!snippets.length) root.innerHTML = emptyStateMarkup('bookmark', '建立你的组件片段', '选择画布元素并保存，以便在其他位置快速复用。');
  snippets.forEach((snippet) => {
    const row = document.createElement('div');
    row.className = 'snippet-item';
    row.draggable = true;
    row.innerHTML = `<span>${escapeText(snippet.name)}</span><button type="button">×</button>`;
    row.ondragstart = (event) => event.dataTransfer.setData('application/x-html-designer-snippet', snippet.html);
    row.ondblclick = () => {
      const target = model.selected || model.doc?.body;
      const node = canvas.createNode(snippet.html);
      canvas.insertNode(node, target, !model.selected || canvas.canContain(target, node) ? 'inside' : 'after');
    };
    pick('button', row).onclick = (event) => {
      event.stopPropagation();
      localStorage.setItem(STORAGE.snippets, JSON.stringify(snippets.filter((item) => item.id !== snippet.id)));
      renderSnippets();
    };
    root.append(row);
  });
}

async function saveSnippet() {
  if (!model.selected) return;
  const name = await modal.prompt('保存为片段', '为当前元素输入一个名称。', canvas.describe(model.selected));
  if (!name) return;
  const snippets = readSnippets();
  snippets.unshift({ id: crypto.randomUUID(), name, html: model.selected.outerHTML });
  localStorage.setItem(STORAGE.snippets, JSON.stringify(snippets.slice(0, 50)));
  renderSnippets();
  toast('片段已保存', 'success');
}

function updateDocumentState() {
  byId('document-name').textContent = model.fileName + (model.fileHandle ? ' · linked' : '');
  byId('document-status').textContent = model.dirty ? '未保存' : '已保存';
  byId('document-status').classList.toggle('dirty', model.dirty);
  byId('undo-button').disabled = model.mode !== 'visual' || model.cursor <= 0;
  byId('redo-button').disabled = model.mode !== 'visual' || model.cursor >= model.history.length - 1;
  ['duplicate-button', 'delete-button', 'parent-button', 'move-up-button', 'move-down-button'].forEach((id) => {
    const button = byId(id);
    if (button) button.disabled = model.mode !== 'visual' || !model.selected;
  });
}

function showStudio() {
  byId('welcome').hidden = true;
  byId('studio').hidden = false;
}

async function showWelcome() {
  if (model.dirty && !(await modal.confirm('返回首页', '当前未保存修改仍会保留在自动恢复中。是否返回？'))) return;
  byId('studio').hidden = true;
  byId('welcome').hidden = false;
}

async function setMode(mode) {
  if (!model.doc || mode === model.mode) return;
  if (mode === 'source') {
    model.sourceText = model.serializeDocument();
    model.sourceBaseline = model.sourceText;
    byId('source-editor').value = model.sourceText;
    updateSourceStats();
    model.mode = 'source';
    byId('canvas-shell').hidden = true;
    byId('source-shell').hidden = false;
    byId('studio').classList.add('source-mode');
  } else {
    model.sourceText = byId('source-editor').value;
    const sourceChanged = model.sourceText !== model.sourceBaseline;
    model.mode = 'visual';
    await canvas.load(model.sourceText, { preserveHistory: true });
    if (sourceChanged) {
      model.history = model.history.slice(0, model.cursor + 1);
      model.history.push({ html: model.sourceText, path: null, label: '源码编辑' });
      model.cursor = model.history.length - 1;
      model.setDirty(true);
      model.scheduleAutosave();
    }
    byId('canvas-shell').hidden = false;
    byId('source-shell').hidden = true;
    byId('studio').classList.remove('source-mode');
    renderTree();
  }
  pickAll('#mode-switch button').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  updateDocumentState();
}

function togglePreview(force) {
  const next = typeof force === 'boolean' ? force : !byId('studio').classList.contains('preview-mode');
  byId('studio').classList.toggle('preview-mode', next);
  byId('leave-preview').hidden = !next;
  canvas.setPreview(next);
}

function exitPreview() { togglePreview(false); }

function externalPreview() {
  const html = model.currentText();
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  window.open(url, '_blank', 'noopener');
  window.setTimeout(() => URL.revokeObjectURL(url), 15000);
}

let canvasZoom = 1;

function updateCanvasInfo() {
  const shell = byId('canvas-shell');
  const iframe = byId('design-canvas');
  if (!shell || !iframe) return;
  const device = shell.dataset.device || 'desktop';
  const labels = { desktop: '桌面', tablet: '平板', mobile: '手机' };
  const icon = pick('use', byId('canvas-info'));
  if (icon) icon.setAttribute('href', `#i-${device === 'desktop' ? 'monitor' : device}`);
  byId('canvas-device-label').textContent = labels[device];
  byId('canvas-size-label').textContent = `${Math.round(iframe.clientWidth)} × ${Math.round(iframe.clientHeight)}`;
}

function setCanvasZoom(value, announce = true) {
  canvasZoom = Math.min(1.5, Math.max(.5, Math.round(Number(value) * 10) / 10));
  document.documentElement.style.setProperty('--canvas-scale', String(canvasZoom));
  byId('zoom-value').textContent = `${Math.round(canvasZoom * 100)}%`;
  if (announce) setStatus(`画布缩放 ${Math.round(canvasZoom * 100)}%`);
  window.setTimeout(() => { canvas.updateOverlay(); updateCanvasInfo(); }, 190);
}

function fitCanvas() {
  const device = byId('canvas-shell').dataset.device;
  const naturalWidth = device === 'mobile' ? 390 : device === 'tablet' ? 820 : byId('workbench').clientWidth;
  const available = Math.max(280, byId('workbench').clientWidth - 34);
  setCanvasZoom(device === 'desktop' ? 1 : Math.min(1, available / naturalWidth));
}

function toggleRail(side) {
  const studio = byId('studio');
  const className = `${side}-collapsed`;
  studio.classList.toggle(className);
  const collapsed = studio.classList.contains(className);
  byId(`${side}-rail-button`)?.classList.toggle('active', !collapsed);
  setStatus(`${side === 'left' ? '组件面板' : '检查器'}已${collapsed ? '隐藏' : '显示'}`);
  window.setTimeout(() => { canvas.updateOverlay(); updateCanvasInfo(); }, 210);
}

function openInsertPalette() {
  if (!model.doc) {
    toast('请先打开或新建一个文档', 'error');
    return;
  }
  const root = byId('modal-root');
  root.innerHTML = `<section class="modal-card command-card insert-card" role="dialog" aria-modal="true" aria-label="快速插入组件"><header class="insert-head"><span>${iconMarkup('boxes')}<strong>快速插入</strong></span><small>插入到当前选择附近</small></header><label class="command-search">${iconMarkup('search')}<input type="search" placeholder="搜索标题、卡片、双栏…" autocomplete="off"><kbd>Esc</kbd></label><div class="insert-list"></div></section>`;
  const input = pick('input', root);
  const list = pick('.insert-list', root);
  let filtered = BLOCKS.map((block, index) => ({ block, index }));
  let activeIndex = 0;
  const execute = (item) => {
    if (!item) return;
    modal.close();
    insertBlock(item.index);
  };
  const render = () => {
    const query = input.value.trim().toLowerCase();
    filtered = BLOCKS.map((block, index) => ({ block, index })).filter(({ block }) => `${block[0]} ${block[1]} ${block[3]}`.toLowerCase().includes(query));
    activeIndex = Math.min(activeIndex, Math.max(0, filtered.length - 1));
    list.innerHTML = filtered.length ? filtered.map(({ block, index }, position) => `<button class="insert-item${position === activeIndex ? ' active' : ''}" type="button" data-insert-index="${index}"><span class="block-symbol">${escapeText(block[2])}</span><span><strong>${escapeText(block[1])}</strong><small>${escapeText(block[0])} · ${escapeText(block[3].match(/^\s*<([a-z][a-z0-9-]*)/i)?.[1] || 'html')}</small></span><span class="insert-plus">+</span></button>`).join('') : emptyStateMarkup('search', '没有找到组件', '换一个关键词继续搜索。');
    pickAll('[data-insert-index]', list).forEach((button) => { button.onclick = () => execute(filtered.find((item) => item.index === Number(button.dataset.insertIndex))); });
  };
  input.oninput = render;
  input.onkeydown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); modal.close(); }
    if (event.key === 'ArrowDown') { event.preventDefault(); activeIndex = (activeIndex + 1) % Math.max(1, filtered.length); render(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); activeIndex = (activeIndex - 1 + Math.max(1, filtered.length)) % Math.max(1, filtered.length); render(); }
    if (event.key === 'Enter') { event.preventDefault(); execute(filtered[activeIndex]); }
  };
  root.onclick = (event) => { if (event.target === root) modal.close(); };
  render();
  input.focus();
}

function openCommandPalette() {
  if (!byId('studio').hidden && pick('.command-card', byId('modal-root'))) {
    modal.close();
    return;
  }
  const commands = [
    ['打开本地文件', 'folder-open', '⌘O', () => files.open()],
    ['导入 HTML', 'upload', '', () => files.picker.click()],
    ['新建设计', 'file-plus', '', () => files.newDocument()],
    ['保存文档', 'save', '⌘S', () => files.save()],
    ['快速插入组件', 'boxes', 'I', openInsertPalette],
    ['切换到画布', 'layout', '', () => setMode('visual')],
    ['切换到源码', 'code', '', () => setMode('source')],
    ['撤销', 'undo', '⌘Z', () => model.travel(-1)],
    ['重做', 'redo', '⇧⌘Z', () => model.travel(1)],
    ['沉浸预览', 'eye', 'P', () => togglePreview()],
    ['在新标签页预览', 'external', '', externalPreview],
    ['打开 AI Design', 'sparkles', '', () => ai.open()],
    ['显示 / 隐藏组件面板', 'panel-left', '', () => toggleRail('left')],
    ['显示 / 隐藏检查器', 'panel-right', '', () => toggleRail('right')],
    ['切换主题', 'theme', '', toggleTheme],
    ['查看快捷键', 'keyboard', '?', () => modal.shortcuts()],
  ];
  const root = byId('modal-root');
  root.innerHTML = `<section class="modal-card command-card" role="dialog" aria-modal="true" aria-label="命令面板"><label class="command-search">${iconMarkup('search')}<input type="search" placeholder="搜索操作或输入命令…" autocomplete="off"><kbd>Esc</kbd></label><div class="command-list"></div></section>`;
  const input = pick('input', root);
  const list = pick('.command-list', root);
  let filtered = commands;
  let activeIndex = 0;
  const execute = (command) => {
    if (!command) return;
    modal.close();
    window.setTimeout(() => command[3](), 0);
  };
  const render = () => {
    const query = input.value.trim().toLowerCase();
    filtered = commands.filter((item) => item[0].toLowerCase().includes(query));
    activeIndex = Math.min(activeIndex, Math.max(0, filtered.length - 1));
    list.innerHTML = filtered.length ? filtered.map((item, index) => `<button class="command-item${index === activeIndex ? ' active' : ''}" type="button" data-command-index="${index}">${iconMarkup(item[1])}<span>${escapeText(item[0])}</span>${item[2] ? `<kbd>${escapeText(item[2])}</kbd>` : ''}</button>`).join('') : '<p class="command-empty">没有匹配的操作</p>';
    pickAll('[data-command-index]', list).forEach((button) => { button.onclick = () => execute(filtered[Number(button.dataset.commandIndex)]); });
  };
  input.oninput = render;
  input.onkeydown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); modal.close(); }
    if (event.key === 'ArrowDown') { event.preventDefault(); activeIndex = (activeIndex + 1) % Math.max(1, filtered.length); render(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); activeIndex = (activeIndex - 1 + Math.max(1, filtered.length)) % Math.max(1, filtered.length); render(); }
    if (event.key === 'Enter') { event.preventDefault(); execute(filtered[activeIndex]); }
  };
  root.onclick = (event) => { if (event.target === root) modal.close(); };
  render();
  input.focus();
}

function bindTabs() {
  pickAll('.rail-tabs').forEach((tabs) => {
    tabs.addEventListener('click', (event) => {
      const button = event.target.closest('[data-panel]');
      if (!button) return;
      const rail = tabs.closest('.rail');
      pickAll('.rail-tabs button', rail).forEach((item) => item.classList.toggle('active', item === button));
      pickAll('.rail-panel', rail).forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === button.dataset.panel));
    });
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE.theme, theme);
}

function toggleTheme() { applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'); }

function bindActions() {
  byId('action-open').onclick = () => files.open();
  byId('action-import').onclick = () => files.picker.click();
  byId('action-new').onclick = () => files.newDocument();
  byId('action-ai').onclick = async () => { await files.newDocument(); ai.open(); };
  byId('action-restore').onclick = async () => {
    const draft = safeJson(localStorage.getItem(STORAGE.draft), null);
    if (draft?.html) await files.load(draft.html, draft.name || 'recovered.html');
  };
  byId('welcome-theme').onclick = toggleTheme;
  byId('theme-button').onclick = toggleTheme;
  byId('home-button').onclick = showWelcome;
  byId('open-button').onclick = () => files.open();
  byId('import-button').onclick = () => files.picker.click();
  byId('export-button').onclick = () => files.export();
  byId('save-button').onclick = () => files.save();
  byId('refresh-button').onclick = () => files.refresh();
  byId('diff-button').onclick = () => files.showDiff();
  byId('undo-button').onclick = () => model.travel(-1);
  byId('redo-button').onclick = () => model.travel(1);
  byId('duplicate-button').onclick = () => canvas.runCommand('duplicate');
  byId('delete-button').onclick = () => canvas.runCommand('remove');
  byId('parent-button').onclick = () => { const parent = model.selected?.parentElement; if (parent && parent !== model.doc.documentElement) model.select(parent); };
  byId('move-up-button').onclick = () => canvas.runCommand('before');
  byId('move-down-button').onclick = () => canvas.runCommand('after');
  byId('left-rail-button').onclick = () => toggleRail('left');
  byId('right-rail-button').onclick = () => toggleRail('right');
  byId('preview-button').onclick = () => togglePreview();
  byId('external-preview-button').onclick = externalPreview;
  byId('leave-preview').onclick = exitPreview;
  byId('ai-button').onclick = () => ai.open();
  byId('ai-close').onclick = () => ai.close();
  byId('ai-save-settings').onclick = () => ai.saveSettings();
  byId('ai-test').onclick = () => ai.test();
  byId('ai-send').onclick = () => ai.send();
  byId('ai-stop').onclick = () => ai.stop();
  byId('review-add').onclick = () => ai.addReview();
  byId('review-cancel').onclick = () => { ai.pendingReview = null; byId('review-compose').hidden = true; };
  byId('review-send').onclick = () => ai.sendReviews();
  byId('block-search').oninput = (event) => renderBlocks(event.target.value);
  byId('quick-insert-button').onclick = openInsertPalette;
  byId('hud-insert-button').onclick = openInsertPalette;
  byId('save-snippet-button').onclick = saveSnippet;
  byId('shortcut-button').onclick = () => modal.shortcuts();
  byId('zoom-out-button').onclick = () => setCanvasZoom(canvasZoom - .1);
  byId('zoom-in-button').onclick = () => setCanvasZoom(canvasZoom + .1);
  byId('zoom-value').onclick = () => setCanvasZoom(1);
  byId('zoom-fit-button').onclick = fitCanvas;
  byId('copy-html-button').onclick = () => { if (model.selected) copyText(model.selected.outerHTML, '已复制元素 HTML'); };
  byId('copy-selector-button').onclick = () => { if (model.selected) copyText(cssSelectorPath(), '已复制 CSS 选择器'); };
  byId('summary-edit-button').onclick = () => canvas.runCommand('edit');
  byId('summary-copy-button').onclick = () => { if (model.selected) copyText(model.selected.outerHTML, '已复制元素 HTML'); };
  byId('summary-duplicate-button').onclick = () => canvas.runCommand('duplicate');
  pickAll('#mode-switch button').forEach((button) => { button.onclick = () => setMode(button.dataset.mode); });
  pickAll('.device-button').forEach((button) => {
    button.onclick = () => {
      pickAll('.device-button').forEach((item) => item.classList.toggle('active', item === button));
      byId('canvas-shell').dataset.device = button.dataset.device;
      setStatus(`已切换为${button.dataset.device === 'desktop' ? '桌面' : button.dataset.device === 'tablet' ? '平板' : '手机'}画布`);
      window.setTimeout(() => { canvas.updateOverlay(); updateCanvasInfo(); }, 190);
    };
  });
  byId('source-editor').oninput = () => { model.sourceText = byId('source-editor').value; model.setDirty(true); model.scheduleAutosave(); updateSourceStats(); };
}

function bindKeyboard() {
  document.addEventListener('keydown', (event) => {
    const command = event.metaKey || event.ctrlKey;
    const field = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable;
    if (event.key === 'Escape' && byId('modal-root').childElementCount && !pick('.command-card', byId('modal-root'))) { event.preventDefault(); modal.close(); return; }
    if (event.key === 'Escape' && !byId('ai-drawer').hidden) { event.preventDefault(); ai.close(); return; }
    if (command && event.key.toLowerCase() === 'k') { event.preventDefault(); openCommandPalette(); return; }
    if (command && event.key.toLowerCase() === 'o') { event.preventDefault(); files.open(); return; }
    if (command && event.key.toLowerCase() === 's') { event.preventDefault(); files.save(); return; }
    if (field) return;
    if (command && event.key.toLowerCase() === 'z') { event.preventDefault(); model.travel(event.shiftKey ? 1 : -1); return; }
    if (command && event.key.toLowerCase() === 'd') { event.preventDefault(); canvas.runCommand('duplicate'); return; }
    if (event.shiftKey && event.key === 'ArrowUp' && model.selected) { event.preventDefault(); canvas.runCommand('parent'); return; }
    if (event.altKey && event.key === 'ArrowUp' && model.selected) { event.preventDefault(); canvas.runCommand('before'); return; }
    if (event.altKey && event.key === 'ArrowDown' && model.selected) { event.preventDefault(); canvas.runCommand('after'); return; }
    if ((event.key === 'Delete' || event.key === 'Backspace') && model.selected) { event.preventDefault(); canvas.runCommand('remove'); return; }
    if (event.key === 'Escape') { if (byId('studio').classList.contains('preview-mode')) exitPreview(); else model.select(null); return; }
    if (event.key === '?') { event.preventDefault(); modal.shortcuts(); return; }
    if (event.key === '/' && !byId('studio').hidden) {
      event.preventDefault();
      if (byId('studio').classList.contains('left-collapsed')) toggleRail('left');
      pick('[data-tabs="left"] [data-panel="library"]')?.click();
      byId('block-search').focus();
      return;
    }
    if (event.key.toLowerCase() === 'i' && !byId('studio').hidden) { event.preventDefault(); openInsertPalette(); return; }
    if (event.key.toLowerCase() === 'p') togglePreview();
    if (!byId('welcome').hidden && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === 'a') files.open();
      if (key === 'b') files.picker.click();
      if (key === 'c') files.newDocument();
      if (key === 'd') byId('action-ai').click();
      if (key === 'r' && !byId('action-restore').hidden) byId('action-restore').click();
    }
  }, true);
}

function bindFileDrop() {
  document.addEventListener('dragover', (event) => {
    if (event.dataTransfer?.types?.includes('Files')) {
      event.preventDefault();
      document.body.classList.add('dragging-file');
    }
  });
  document.addEventListener('dragleave', (event) => { if (!event.relatedTarget) document.body.classList.remove('dragging-file'); });
  document.addEventListener('drop', (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    event.preventDefault();
    document.body.classList.remove('dragging-file');
    if (/\.html?$/i.test(file.name) || file.type === 'text/html') files.importFile(file);
    else toast('请选择 HTML 文件', 'error');
  });
}

model.addEventListener('selection', () => {
  renderPath();
  canvas.updateOverlay();
  renderTree();
  renderInspectors();
  byId('save-snippet-button').disabled = !model.selected;
  updateDocumentState();
  if (model.selected?.isConnected) {
    const rect = model.selected.getBoundingClientRect();
    setStatus(`${canvas.describe(model.selected)} · ${Math.round(rect.width)} × ${Math.round(rect.height)}`);
  } else setStatus('未选择元素');
  ai.updateTarget();
});
model.addEventListener('document', () => { renderTree(); renderInspectors(); });
model.addEventListener('dirty', updateDocumentState);
model.addEventListener('history', () => {
  updateDocumentState();
  if (model.history[model.cursor]?.label) setStatus(model.history[model.cursor].label);
});

function init() {
  applyTheme(localStorage.getItem(STORAGE.theme) || 'dark');
  bindTabs();
  bindActions();
  bindKeyboard();
  bindFileDrop();
  renderBlocks();
  renderTree();
  renderSnippets();
  renderInspectors();
  updateSourceStats();
  updateDocumentState();
  const draft = safeJson(localStorage.getItem(STORAGE.draft), null);
  if (draft?.html) {
    byId('action-restore').hidden = false;
    byId('restore-meta').textContent = `${draft.name || 'untitled.html'} · ${new Date(draft.savedAt).toLocaleString()}`;
  }
}

init();
