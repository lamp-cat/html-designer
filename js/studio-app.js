const byId = (id) => document.getElementById(id);
const pick = (selector, root = document) => root.querySelector(selector);
const pickAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const STORAGE = Object.freeze({
  draft: 'html-designer.v1.draft',
  draftFallback: 'html-designer.v2.drafts',
  snippets: 'html-designer.v1.snippets',
  theme: 'html-designer.v1.theme',
  ai: 'html-designer.v1.ai',
});
const CUSTOM_MODEL_VALUE = '__custom__';

const EMPTY_DOCUMENT = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Signal House · 周末创意工作坊</title>
  <style>
    :root { color-scheme: light; --paper:#f5f1e8; --ink:#18221d; --muted:#647069; --accent:#f15b3b; --card:#fffdf8; --line:rgba(24,34,29,.14); }
    :root[data-theme="night"] { color-scheme:dark; --paper:#151b18; --ink:#f7f3e9; --muted:#a7b1aa; --accent:#ff795d; --card:#202824; --line:rgba(255,255,255,.14); }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; background:var(--paper); color:var(--ink); font:16px/1.6 ui-rounded,"Avenir Next",system-ui,sans-serif; transition:background .2s,color .2s; }
    button,input { font:inherit; }
    button,a { -webkit-tap-highlight-color:transparent; }
    .wrap { width:min(1120px,calc(100% - 36px)); margin:auto; }
    .site-head { display:flex; min-height:76px; align-items:center; justify-content:space-between; border-bottom:1px solid var(--line); }
    .brand { color:inherit; font-size:18px; font-weight:900; text-decoration:none; }
    .brand span { color:var(--accent); }
    nav { display:flex; align-items:center; gap:20px; }
    nav a { color:var(--muted); font-size:14px; text-decoration:none; }
    .icon-button { width:38px; height:38px; border:1px solid var(--line); border-radius:50%; background:var(--card); color:var(--ink); cursor:pointer; }
    .hero { display:grid; min-height:650px; padding:72px 0; grid-template-columns:1.15fr .85fr; align-items:center; gap:70px; }
    .kicker { color:var(--accent); font-size:12px; font-weight:900; letter-spacing:.16em; text-transform:uppercase; }
    h1 { max-width:760px; margin:18px 0 24px; font:900 clamp(56px,8vw,112px)/.86 Georgia,serif; letter-spacing:-.06em; }
    .lead { max-width:620px; color:var(--muted); font-size:19px; }
    .actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:30px; }
    .button { display:inline-flex; min-height:48px; padding:0 20px; align-items:center; justify-content:center; border:1px solid var(--ink); border-radius:8px; background:transparent; color:var(--ink); font-weight:800; text-decoration:none; cursor:pointer; }
    .button.primary { border-color:var(--accent); background:var(--accent); color:white; }
    .poster { position:relative; min-height:430px; padding:34px; overflow:hidden; border-radius:8px; background:#18221d; color:#f9f3e7; box-shadow:18px 18px 0 var(--accent); }
    .poster::after { content:""; position:absolute; width:220px; height:220px; right:-50px; bottom:-55px; border:35px solid var(--accent); border-radius:50%; }
    .poster small { color:#a7b3ac; letter-spacing:.12em; }
    .poster strong { display:block; max-width:300px; margin-top:90px; font:700 52px/.95 Georgia,serif; }
    .poster time { display:block; margin-top:42px; font-size:18px; }
    .section { padding:90px 0; border-top:1px solid var(--line); }
    .section-head { display:flex; margin-bottom:30px; align-items:end; justify-content:space-between; gap:24px; }
    h2 { margin:0; font:800 clamp(34px,5vw,62px)/1 Georgia,serif; letter-spacing:-.04em; }
    .section-head p { max-width:460px; margin:0; color:var(--muted); }
    .schedule { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
    .session { min-height:250px; padding:24px; border:1px solid var(--line); border-radius:8px; background:var(--card); }
    .session time { color:var(--accent); font-size:13px; font-weight:900; }
    .session h3 { margin:48px 0 8px; font-size:24px; }
    .session p { color:var(--muted); }
    details { padding:20px 0; border-bottom:1px solid var(--line); }
    summary { display:flex; justify-content:space-between; font-weight:800; cursor:pointer; }
    summary::after { content:"+"; color:var(--accent); }
    details[open] summary::after { content:"−"; }
    details p { max-width:720px; color:var(--muted); }
    .site-foot { display:flex; padding:42px 0; justify-content:space-between; color:var(--muted); font-size:13px; }
    dialog { width:min(470px,calc(100% - 30px)); padding:0; border:0; border-radius:10px; background:var(--card); color:var(--ink); box-shadow:0 30px 100px rgba(0,0,0,.35); }
    dialog::backdrop { background:rgba(10,15,12,.64); backdrop-filter:blur(5px); }
    .dialog-body { padding:28px; }
    .dialog-head { display:flex; align-items:start; justify-content:space-between; }
    .dialog-head h2 { font-size:34px; }
    .dialog-head button { border:0; background:transparent; color:var(--muted); font-size:26px; cursor:pointer; }
    form { display:grid; margin-top:24px; gap:12px; }
    label { display:grid; gap:5px; color:var(--muted); font-size:13px; }
    input { height:45px; padding:0 12px; border:1px solid var(--line); border-radius:6px; background:var(--paper); color:var(--ink); }
    .notice { position:fixed; left:50%; bottom:24px; padding:11px 16px; border-radius:7px; background:var(--ink); color:var(--paper); transform:translate(-50%,120px); transition:transform .25s; }
    .notice.show { transform:translate(-50%,0); }
    @media (max-width:800px) { nav a { display:none; } .hero { min-height:auto; grid-template-columns:1fr; gap:42px; } .poster { min-height:340px; } .schedule { grid-template-columns:1fr; } .section-head,.site-foot { align-items:start; flex-direction:column; } }
  </style>
</head>
<body>
  <header class="wrap site-head">
    <a class="brand" href="#top">Signal<span>House</span></a>
    <nav aria-label="主导航"><a href="#program">日程</a><a href="#questions">问答</a><button class="icon-button" id="theme-toggle" type="button" aria-label="切换明暗主题">◐</button></nav>
  </header>
  <main id="top">
    <section class="wrap hero">
      <div><span class="kicker">Hangzhou · Weekend 08</span><h1>把好奇心带到现场。</h1><p class="lead">三场小型工作坊，把写作、声音和城市观察放进同一个周末。每场仅开放 24 个席位。</p><div class="actions"><button class="button primary" type="button" data-open-signup>立即报名</button><a class="button" href="#program">查看日程</a></div></div>
      <aside class="poster" aria-label="活动海报"><small>SIGNAL HOUSE PRESENTS</small><strong>Ideas need a room.</strong><time datetime="2026-08-08">08—09 AUG 2026</time></aside>
    </section>
    <section class="section" id="program"><div class="wrap"><div class="section-head"><h2>周末日程</h2><p>每场活动独立报名，也可以选择完整通票。所有材料与午间饮品都已包含。</p></div><div class="schedule"><article class="session"><time>周六 10:00</time><h3>城市漫游写作</h3><p>从街区细节出发，完成一篇短篇非虚构作品。</p></article><article class="session"><time>周六 15:00</time><h3>声音采集入门</h3><p>用随身设备记录环境声音，并制作一分钟声音明信片。</p></article><article class="session"><time>周日 13:30</time><h3>小型出版实验</h3><p>把周末素材编辑成一本可以带走的折页刊物。</p></article></div></div></section>
    <section class="section" id="questions"><div class="wrap"><div class="section-head"><h2>常见问题</h2><p>不需要任何专业经验，只需要带上可以记录的设备。</p></div><details><summary>活动在哪里举行？</summary><p>报名成功后会收到具体地址与交通建议，场地位于杭州拱墅区。</p></details><details><summary>可以临时取消吗？</summary><p>活动开始前 48 小时可以免费取消，也可以将席位转给朋友。</p></details><details><summary>需要携带什么？</summary><p>手机、耳机和一本你喜欢的笔记本即可，其余材料由现场提供。</p></details></div></section>
  </main>
  <footer class="wrap site-foot"><strong>Signal House</strong><span>Independent workshops since 2022</span></footer>
  <dialog id="signup-dialog"><div class="dialog-body"><div class="dialog-head"><div><span class="kicker">Reserve a seat</span><h2>报名工作坊</h2></div><button type="button" data-close-dialog aria-label="关闭">×</button></div><form id="signup-form"><label>姓名<input name="name" required autocomplete="name"></label><label>邮箱<input name="email" type="email" required autocomplete="email"></label><label>选择场次<input name="session" value="周末完整通票" required></label><button class="button primary" type="submit">确认报名</button></form></div></dialog>
  <div class="notice" id="notice" role="status">报名信息已提交，我们会尽快联系你。</div>
  <script>
    const root = document.documentElement;
    const dialog = document.querySelector('#signup-dialog');
    const notice = document.querySelector('#notice');
    document.querySelector('#theme-toggle').addEventListener('click', () => { root.dataset.theme = root.dataset.theme === 'night' ? '' : 'night'; });
    document.querySelector('[data-open-signup]').addEventListener('click', () => dialog.showModal());
    document.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
    document.querySelector('#signup-form').addEventListener('submit', (event) => { event.preventDefault(); dialog.close(); notice.classList.add('show'); window.setTimeout(() => notice.classList.remove('show'), 2600); event.currentTarget.reset(); });
  </script>
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
const FORBIDDEN_SELECT = new Set(['HTML', 'HEAD', 'META', 'LINK', 'STYLE', 'SCRIPT', 'TEMPLATE', 'TITLE', 'BASE']);
const FLOW_CONTAINERS = new Set(['BODY', 'MAIN', 'SECTION', 'ARTICLE', 'ASIDE', 'NAV', 'HEADER', 'FOOTER', 'DIV', 'FORM', 'FIGURE', 'FIGCAPTION', 'BLOCKQUOTE', 'DETAILS', 'DIALOG', 'FIELDSET', 'LI', 'DD', 'TD', 'TH']);
const PHRASING_CONTAINERS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'BUTTON', 'LABEL', 'SPAN', 'STRONG', 'EM', 'SMALL', 'MARK', 'SUMMARY', 'DT']);
const PHRASING_CONTENT = new Set(['A', 'ABBR', 'B', 'BDI', 'BDO', 'BR', 'BUTTON', 'CITE', 'CODE', 'DATA', 'DEL', 'EM', 'I', 'IMG', 'INPUT', 'INS', 'KBD', 'LABEL', 'MARK', 'Q', 'S', 'SAMP', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP', 'TIME', 'U', 'VAR', 'WBR']);
const DIRECT_COMPONENT_TAGS = new Set(['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'FORM', 'IMG', 'PICTURE', 'VIDEO', 'AUDIO', 'IFRAME', 'DETAILS', 'SUMMARY', 'DIALOG', 'NAV', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'UL', 'OL', 'LI']);
const INLINE_WRAPPER_TAGS = new Set(['SPAN', 'STRONG', 'EM', 'SMALL', 'MARK', 'B', 'I', 'U', 'S', 'ABBR', 'CODE', 'USE', 'PATH', 'G']);

function elementFromNode(node) {
  if (!node) return null;
  return node.nodeType === 1 ? node : node.parentElement || null;
}

function resolveComponentTarget(node) {
  const element = elementFromNode(node);
  if (!element?.closest) return element;
  const tag = String(element.tagName || '').toUpperCase();

  // Keep the control itself when clicking inside a form field, then collapse
  // decorative wrappers and SVG paths into their nearest actionable component.
  if (['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(tag)) return tag === 'OPTION' ? element.closest('select') || element : element;
  const actionable = element.closest('button, a[href], [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="switch"], [role="checkbox"], [role="radio"], [role="textbox"], [role="combobox"]');
  if (actionable) return actionable;

  const picture = element.closest('picture');
  if (picture && ['SOURCE', 'IMG'].includes(tag)) return picture.querySelector('img') || picture;
  const media = element.closest('video, audio');
  if (media && ['SOURCE', 'TRACK'].includes(tag)) return media;
  if (element.namespaceURI === 'http://www.w3.org/2000/svg' || ['SVG', 'USE', 'PATH', 'G'].includes(tag)) return element.closest('svg') || element;

  if (DIRECT_COMPONENT_TAGS.has(tag)) return element;
  if (INLINE_WRAPPER_TAGS.has(tag)) {
    const cell = element.closest('th, td');
    if (cell) return cell;
    const listItem = element.closest('li');
    if (listItem) return listItem;
    const textBlock = element.closest('h1, h2, h3, h4, h5, h6, p, blockquote, figcaption, summary, label');
    if (textBlock) return textBlock;
    const namedComponent = element.closest('[data-component], [data-widget], [data-block], .card, .panel, .tile, .hero, .banner, .modal, .drawer, .popover, .tabs, .accordion, .carousel, .gallery, .toolbar, .sidebar');
    if (namedComponent) return namedComponent;
  }
  return element;
}

function componentInfo(element) {
  const tag = String(element?.tagName || '').toUpperCase();
  const role = element?.getAttribute?.('role') || '';
  const inputType = element?.getAttribute?.('type')?.toLowerCase() || 'text';
  const hint = `${element?.getAttribute?.('data-component') || ''} ${element?.getAttribute?.('data-widget') || ''} ${element?.getAttribute?.('data-block') || ''} ${element?.id || ''} ${element?.getAttribute?.('class') || ''}`.toLowerCase();
  const hinted = (pattern) => pattern.test(hint);
  const result = (key, name, description, canEditText = false) => ({ key, name, description, canEditText });
  if (tag === 'A' || role === 'link') return result('link', '链接', '编辑文字、目标地址和打开方式', true);
  if (tag === 'BUTTON' || role === 'button' || role === 'tab' || role === 'menuitem') return result('button', '按钮', '编辑按钮文字、类型和无障碍名称', true);
  if (['checkbox', 'radio', 'switch'].includes(role)) return result('role-choice', role === 'radio' ? '单选控件' : role === 'switch' ? '开关' : '复选控件', '编辑控件状态、无障碍名称和样式');
  if (['textbox', 'combobox'].includes(role)) return result('role-input', role === 'combobox' ? '组合输入框' : '文本输入框', '编辑控件名称、内容和样式');
  if (tag === 'INPUT') {
    if (['button', 'submit', 'reset'].includes(inputType)) return result('input-button', '表单按钮', '编辑按钮文字、类型和提交行为');
    if (['checkbox', 'radio'].includes(inputType) || ['checkbox', 'radio', 'switch'].includes(role)) return result('choice', inputType === 'radio' ? '单选框' : '复选框', '编辑选项名称、值和选中状态');
    return result('input', '输入框', '编辑字段类型、名称、占位文字和值');
  }
  if (tag === 'TEXTAREA') return result('textarea', '文本域', '编辑字段名称、占位文字和默认内容');
  if (tag === 'SELECT') return result('select', '选择器', '编辑字段名称、必填状态和选项');
  if (tag === 'FORM') return result('form', '表单', '编辑提交地址、提交方法和自动完成');
  if (tag === 'IMG' || tag === 'PICTURE') return result('image', '图片', '更换图片地址并补充替代文字');
  if (tag === 'VIDEO' || tag === 'AUDIO') return result('media', tag === 'VIDEO' ? '视频' : '音频', '编辑媒体地址和播放选项');
  if (tag === 'IFRAME') return result('embed', '嵌入内容', '编辑嵌入地址、标题和加载方式');
  if (tag === 'DETAILS') return result('details', '折叠面板', '编辑标题和默认展开状态');
  if (tag === 'SUMMARY') return result('summary', '折叠标题', '编辑折叠面板标题', true);
  if (tag === 'DIALOG' || role === 'dialog' || role === 'alertdialog') return result('dialog', '对话框', '编辑对话框名称和默认打开状态');
  if (tag === 'NAV' || role === 'navigation') return result('navigation', '导航', '编辑导航名称和结构');
  if (tag === 'LI') return result('list-item', '列表项', '编辑内容或在相邻位置添加列表项', true);
  if (tag === 'UL' || tag === 'OL') return result('list', tag === 'OL' ? '有序列表' : '无序列表', '管理列表结构和列表项');
  if (tag === 'TH' || tag === 'TD') return result('table-cell', tag === 'TH' ? '表头单元格' : '表格单元格', '编辑内容或添加表格行列', true);
  if (tag === 'TR') return result('table-row', '表格行', '管理这一行的单元格');
  if (tag === 'TABLE') return result('table', '表格', '编辑表格标题和结构');
  if (/^H[1-6]$/.test(tag)) return result('heading', `${tag.slice(1)} 级标题`, '编辑标题内容和层级', true);
  if (['P', 'BLOCKQUOTE', 'FIGCAPTION', 'LABEL', 'SPAN', 'STRONG', 'EM', 'SMALL', 'TIME'].includes(tag)) return result('text', tag === 'LABEL' ? '字段标签' : '文本', '编辑文字内容和排版', true);
  if (tag === 'SVG') return result('icon', '图标', '编辑图标属性、尺寸和样式');
  if (['HEADER', 'MAIN', 'SECTION', 'ARTICLE', 'ASIDE', 'FOOTER'].includes(tag)) {
    const names = { HEADER: '页头', MAIN: '主内容', SECTION: '内容区块', ARTICLE: '内容卡片', ASIDE: '侧边内容', FOOTER: '页脚' };
    return result('layout', names[tag], '编辑区块标识、类名和无障碍名称');
  }
  if (tag === 'BODY') return result('page', '页面主体', '管理页面的主要内容结构');
  if (hinted(/(^|[\s_-])(card|panel|tile)([\s_-]|$)/)) return result('card', '卡片', '编辑卡片内容、标识和样式');
  if (hinted(/(^|[\s_-])(hero|banner|jumbotron)([\s_-]|$)/)) return result('layout', '首屏区块', '编辑首屏内容、标识和无障碍名称');
  if (hinted(/(^|[\s_-])(modal|drawer|popover|overlay)([\s_-]|$)/)) return result('overlay', '弹层', '编辑弹层内容、标识和样式');
  if (hinted(/(^|[\s_-])(tabs?|accordion)([\s_-]|$)/)) return result('collection', hinted(/accordion/) ? '折叠组' : '标签页', '编辑组件结构、标识和样式');
  if (hinted(/(^|[\s_-])(carousel|slider|gallery)([\s_-]|$)/)) return result('collection', '媒体集合', '编辑集合内容、标识和样式');
  if (hinted(/(^|[\s_-])(toolbar|sidebar|menu)([\s_-]|$)/)) return result('layout', hinted(/sidebar/) ? '侧边栏' : '操作区域', '编辑区域结构、标识和无障碍名称');
  return result('element', '通用元素', '编辑元素标识、类名和属性', !VOID_TAGS.has(tag));
}

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

function contentFingerprint(value) {
  const text = String(value || '');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${text.length}-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function prepareEditableHtml(value) {
  const source = String(value || '');
  const parsed = new DOMParser().parseFromString(source, 'text/html');
  const editorPolicy = parsed.createElement('meta');
  editorPolicy.httpEquiv = 'Content-Security-Policy';
  editorPolicy.content = "script-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
  editorPolicy.dataset.hdEditorCsp = 'hd';
  parsed.head.prepend(editorPolicy);
  inertEditableContent(parsed, parsed);
  const doctype = parsed.doctype ? `<!doctype ${parsed.doctype.name}>\n` : '<!doctype html>\n';
  return doctype + parsed.documentElement.outerHTML;
}

function inertEditableContent(root, documentValue) {
  pickAll('script', root).forEach((script) => {
    const placeholder = documentValue.createElement('template');
    placeholder.dataset.hdScriptPlaceholder = 'hd';
    placeholder.content.append(documentValue.createTextNode(encodeURIComponent(script.outerHTML)));
    script.replaceWith(placeholder);
  });
  pickAll('*', root).forEach((element) => {
    const events = [];
    const urls = [];
    pickAllAttributes(element).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on')) {
        events.push([attribute.name, attribute.value]);
        element.removeAttribute(attribute.name);
      } else if (['href', 'src', 'xlink:href', 'action', 'formaction'].includes(name) && /^\s*javascript:/i.test(attribute.value)) {
        urls.push([attribute.name, attribute.value]);
        element.removeAttribute(attribute.name);
      }
    });
    if (events.length) storeInertAttributes(element, 'data-hd-inert-events', events);
    if (urls.length) storeInertAttributes(element, 'data-hd-inert-urls', urls);
  });
}

function prepareEditableFragment(value, documentValue) {
  const container = documentValue.createElement('template');
  container.innerHTML = String(value || '');
  inertEditableContent(container.content, documentValue);
  return Array.from(container.content.childNodes);
}

function pickAllAttributes(element) {
  return Array.from(element?.attributes || []);
}

function storeInertAttributes(element, marker, attributes) {
  const original = element.hasAttribute(marker) ? element.getAttribute(marker) : null;
  element.setAttribute(marker, `hd:${encodeURIComponent(JSON.stringify({ attributes, original }))}`);
}

function decodeStoredText(value) {
  try {
    return decodeURIComponent(String(value || ''));
  } catch {
    return '';
  }
}

function restoreInertAttributes(root, marker) {
  pickAll(`[${marker}]`, root).forEach((element) => {
    const stored = element.getAttribute(marker) || '';
    if (!stored.startsWith('hd:')) return;
    const payload = safeJson(decodeStoredText(stored.slice(3)), {});
    element.removeAttribute(marker);
    (Array.isArray(payload.attributes) ? payload.attributes : []).forEach(([name, value]) => {
      if (name) element.setAttribute(name, value ?? '');
    });
    if (payload.original != null) element.setAttribute(marker, payload.original);
  });
}

function inertAttributePayload(element, marker) {
  const stored = element?.getAttribute?.(marker);
  if (stored != null && !stored.startsWith('hd:')) return { attributes: [], original: stored };
  const payload = safeJson(decodeStoredText(String(stored || '').slice(3)), {});
  return {
    attributes: Array.isArray(payload.attributes) ? payload.attributes : [],
    original: payload.original ?? null,
  };
}

function getInertAttribute(element, marker, name) {
  const match = inertAttributePayload(element, marker).attributes
    .find(([attributeName]) => String(attributeName).toLowerCase() === String(name).toLowerCase());
  return match ? match[1] : null;
}

function setInertAttribute(element, marker, name, value) {
  const payload = inertAttributePayload(element, marker);
  payload.attributes = payload.attributes
    .filter(([attributeName]) => String(attributeName).toLowerCase() !== String(name).toLowerCase());
  if (value != null) payload.attributes.push([name, String(value)]);
  if (payload.attributes.length || payload.original != null) {
    element.setAttribute(marker, `hd:${encodeURIComponent(JSON.stringify(payload))}`);
  } else {
    element.removeAttribute(marker);
  }
}

function restoreEditableArtifacts(root) {
  pickAll('meta[data-hd-editor-csp="hd"]', root).forEach((element) => element.remove());
  restoreInertAttributes(root, 'data-hd-inert-events');
  restoreInertAttributes(root, 'data-hd-inert-urls');
  pickAll('template[data-hd-script-placeholder="hd"]', root).forEach((placeholder) => {
    const encoded = placeholder.content?.textContent || placeholder.textContent || '';
    const source = decodeStoredText(encoded);
    const container = root.ownerDocument.createElement('template');
    container.innerHTML = source;
    placeholder.replaceWith(container.content.cloneNode(true));
  });
  return root;
}

function serializeEditableElement(element, inner = false) {
  if (!element) return '';
  const clone = restoreEditableArtifacts(element.cloneNode(true));
  return inner ? clone.innerHTML : clone.outerHTML;
}

function resolvePathInDocument(documentValue, path) {
  if (!documentValue?.documentElement || !Array.isArray(path)) return null;
  let node = documentValue.documentElement;
  for (const index of path) {
    node = node?.children?.[index];
    if (!node) return null;
  }
  return node;
}

function htmlSafetyWarnings(before, after) {
  const describe = (html) => {
    const documentValue = new DOMParser().parseFromString(String(html || ''), 'text/html');
    return {
      length: String(html || '').length,
      elements: documentValue.querySelectorAll('*').length,
      scripts: documentValue.querySelectorAll('script').length,
      styles: documentValue.querySelectorAll('style, link[rel~="stylesheet"]').length,
      forms: documentValue.querySelectorAll('form, input, textarea, select, button').length,
    };
  };
  const previous = describe(before);
  const next = describe(after);
  const warnings = [];
  if (previous.length > 500 && next.length < previous.length * .45) warnings.push('候选内容明显短于当前内容，请确认没有遗漏页面区块。');
  if (next.elements < previous.elements * .55) warnings.push('候选页面的元素数量大幅减少。');
  if (next.scripts < previous.scripts) warnings.push(`脚本数量从 ${previous.scripts} 个减少到 ${next.scripts} 个。`);
  if (next.styles < previous.styles) warnings.push(`样式资源从 ${previous.styles} 个减少到 ${next.styles} 个。`);
  if (next.forms < previous.forms) warnings.push(`表单控件从 ${previous.forms} 个减少到 ${next.forms} 个。`);
  return warnings;
}

function countProjectRelativeReferences(value) {
  const documentValue = new DOMParser().parseFromString(String(value || ''), 'text/html');
  const base = documentValue.querySelector('base[href]')?.getAttribute('href')?.trim() || '';
  if (/^(?:https?:|file:|\/\/)/i.test(base)) return 0;
  const references = [];
  const collect = (raw) => {
    const candidate = String(raw || '').trim();
    if (!candidate || /^(?:#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(candidate)) return;
    references.push(candidate);
  };
  pickAll('[src], link[href], a[href], [poster], object[data], form[action]', documentValue).forEach((element) => {
    ['src', 'href', 'poster', 'data', 'action'].forEach((name) => {
      if (element.hasAttribute(name)) collect(element.getAttribute(name));
    });
  });
  pickAll('[srcset]', documentValue).forEach((element) => {
    String(element.getAttribute('srcset') || '').split(',').forEach((entry) => collect(entry.trim().split(/\s+/)[0]));
  });
  pickAll('style, [style]', documentValue).forEach((element) => {
    const css = element.tagName === 'STYLE' ? element.textContent : element.getAttribute('style');
    String(css || '').replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_, __, url) => {
      collect(url);
      return '';
    });
  });
  return references.length;
}

class DraftStore {
  constructor() {
    this.databasePromise = null;
  }

  database() {
    if (!('indexedDB' in window)) return Promise.resolve(null);
    if (this.databasePromise) return this.databasePromise;
    this.databasePromise = new Promise((resolve) => {
      const request = indexedDB.open('html-designer', 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('drafts')) {
          const store = database.createObjectStore('drafts', { keyPath: 'id' });
          store.createIndex('savedAt', 'savedAt');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
    return this.databasePromise;
  }

  fallbackDrafts() {
    return safeJson(localStorage.getItem(STORAGE.draftFallback), []);
  }

  async put(payload) {
    const database = await this.database();
    if (database) {
      await new Promise((resolve, reject) => {
        const request = database.transaction('drafts', 'readwrite').objectStore('drafts').put(payload);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      return;
    }
    const drafts = [payload, ...this.fallbackDrafts().filter(item => item.id !== payload.id)]
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, 5);
    localStorage.setItem(STORAGE.draftFallback, JSON.stringify(drafts));
  }

  async remove(id) {
    if (!id) return;
    const database = await this.database();
    if (database) {
      await new Promise((resolve) => {
        const request = database.transaction('drafts', 'readwrite').objectStore('drafts').delete(id);
        request.onsuccess = request.onerror = () => resolve();
      });
    }
    const drafts = this.fallbackDrafts().filter(item => item.id !== id);
    localStorage.setItem(STORAGE.draftFallback, JSON.stringify(drafts));
  }

  async latest() {
    const database = await this.database();
    let indexedDraft = null;
    if (database) {
      indexedDraft = await new Promise((resolve) => {
        const store = database.transaction('drafts').objectStore('drafts');
        const request = store.index('savedAt').openCursor(null, 'prev');
        request.onsuccess = () => resolve(request.result?.value || null);
        request.onerror = () => resolve(null);
      });
    }
    const fallback = this.fallbackDrafts().sort((a, b) => b.savedAt - a.savedAt)[0] || null;
    const legacy = safeJson(localStorage.getItem(STORAGE.draft), null);
    const latest = [indexedDraft, fallback, legacy].filter(item => item?.html)
      .sort((a, b) => Number(b.savedAt || 0) - Number(a.savedAt || 0))[0] || null;
    if (legacy?.html) {
      const migrated = {
        ...legacy,
        id: legacy.id || `legacy:${legacy.name || 'untitled.html'}:${contentFingerprint(legacy.html)}`,
      };
      try {
        await this.put(migrated);
        localStorage.removeItem(STORAGE.draft);
      } catch (_) {}
      if (latest === legacy) return migrated;
    }
    return latest;
  }
}

const draftStore = new DraftStore();

function apiFetch(endpoint, options = {}) {
  const url = new URL(endpoint, window.location.href);
  const headers = new Headers(options.headers || {});
  if (url.origin === window.location.origin) {
    const token = pick('meta[name="html-designer-session"]')?.content || '';
    if (token && token !== '__HTML_DESIGNER_SESSION__') headers.set('X-HTML-Designer-Session', token);
  }
  return fetch(url, { ...options, headers });
}

function toast(message, type = '') {
  const item = document.createElement('div');
  item.className = `toast ${type}`.trim();
  item.textContent = message;
  byId('toast-stack').append(item);
  window.setTimeout(() => item.remove(), 3200);
}

class ModalService {
  constructor(root) {
    this.root = root;
    this.lastOutsideFocus = null;
    document.addEventListener('focusin', (event) => {
      if (!this.root.contains(event.target)) this.lastOutsideFocus = event.target;
    });
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) this.close();
    });
    this.root.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const controls = pickAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])', this.root)
        .filter(element => !element.hidden && element.offsetParent !== null);
      if (!controls.length) return;
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    new MutationObserver(() => {
      const active = Boolean(this.root.childElementCount);
      [byId('welcome'), byId('studio'), byId('ai-drawer')].forEach((element) => {
        if (element) element.inert = active;
      });
    }).observe(this.root, { childList: true });
  }

  close() {
    this.root.replaceChildren();
    [byId('welcome'), byId('studio'), byId('ai-drawer')].forEach((element) => {
      if (element) element.inert = false;
    });
    if (this.lastOutsideFocus?.isConnected) this.lastOutsideFocus.focus();
  }

  async confirm(title, message, confirmLabel = '确认') {
    return new Promise((resolve) => {
      this.root.innerHTML = `<section class="modal-card compact" role="dialog" aria-modal="true"><header class="modal-head"><h2>${escapeText(title)}</h2><button type="button" data-close>×</button></header><div class="modal-body"><p class="modal-copy">${escapeText(message)}</p></div><footer class="modal-foot"><button type="button" data-cancel>取消</button><button class="primary" type="button" data-confirm>${escapeText(confirmLabel)}</button></footer></section>`;
      const finish = (value) => { this.close(); resolve(value); };
      pick('[data-close]', this.root).onclick = () => finish(false);
      pick('[data-cancel]', this.root).onclick = () => finish(false);
      pick('[data-confirm]', this.root).onclick = () => finish(true);
      pick('[data-cancel]', this.root).focus();
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
    pick('[data-close-footer]', this.root).focus();
  }

  async reviewChange(title, oldText, newText, warnings = []) {
    return new Promise((resolve) => {
      const warningMarkup = warnings.length
        ? `<div class="change-warnings"><strong>应用前请确认</strong><ul>${warnings.map(item => `<li>${escapeText(item)}</li>`).join('')}</ul></div>`
        : '<div class="change-ready">候选内容结构完整，可以在确认后应用。</div>';
      this.root.innerHTML = `<section class="modal-card ai-review-card" role="dialog" aria-modal="true" aria-labelledby="ai-review-title"><header class="modal-head"><div><span>AI CHANGE REVIEW</span><h2 id="ai-review-title">${escapeText(title)}</h2></div><button type="button" data-close aria-label="关闭">×</button></header><div class="modal-body">${warningMarkup}<div class="diff-grid"><section class="diff-pane"><h3>当前内容</h3><pre></pre></section><section class="diff-pane"><h3>候选内容</h3><pre></pre></section></div></div><footer class="modal-foot"><button type="button" data-cancel>保留当前内容</button><button class="primary" type="button" data-apply>应用候选内容</button></footer></section>`;
      const panes = pickAll('pre', this.root);
      panes[0].textContent = oldText;
      panes[1].textContent = newText;
      const finish = (value) => {
        this.close();
        resolve(value);
      };
      pick('[data-close]', this.root).onclick = () => finish(false);
      pick('[data-cancel]', this.root).onclick = () => finish(false);
      pick('[data-apply]', this.root).onclick = () => finish(true);
      pick('[data-apply]', this.root).focus();
    });
  }

  shortcuts() {
    const rows = [
      ['保存文档', ['⌘', 'S']], ['撤销', ['⌘', 'Z']], ['重做', ['⇧', '⌘', 'Z']],
      ['复制元素', ['⌘', 'D']], ['删除元素', ['⌫']], ['选择父元素', ['⇧', '↑']],
      ['元素上移', ['⌥', '↑']], ['元素下移', ['⌥', '↓']], ['微调自由位置', ['方向键']],
      ['沉浸浏览', ['P']],
      ['命令面板', ['⌘', 'K']], ['取消选择 / 退出', ['Esc']], ['快捷键帮助', ['?']],
      ['组件搜索', ['/']], ['快速插入组件', ['I']],
    ];
    this.root.innerHTML = `<section class="modal-card shortcuts" role="dialog" aria-modal="true" aria-label="快捷键"><header class="modal-head"><h2>快捷键</h2><button type="button" data-close aria-label="关闭">×</button></header><div class="modal-body"><p class="shortcut-intro">用键盘完成高频操作。Windows 和 Linux 上请使用 Ctrl 代替 ⌘。</p><div class="shortcut-grid">${rows.map(([label, keys]) => `<div class="shortcut-row"><strong>${escapeText(label)}</strong><span>${keys.map((key) => `<kbd>${escapeText(key)}</kbd>`).join('')}</span></div>`).join('')}</div></div><footer class="modal-foot"><button class="primary" type="button" data-close-footer>知道了</button></footer></section>`;
    pickAll('[data-close], [data-close-footer]', this.root).forEach((button) => { button.onclick = () => this.close(); });
    pick('[data-close-footer]', this.root).focus();
  }

  component(info, selector, fields, onApply) {
    const fieldMarkup = fields.map((field, index) => {
      const id = `component-field-${index}`;
      const classes = `component-field${field.wide ? ' wide' : ''}${field.type === 'checkbox' ? ' checkbox' : ''}`;
      if (field.type === 'checkbox') {
        return `<label class="${classes}" for="${id}"><input id="${id}" name="${escapeText(field.name)}" type="checkbox"${field.value ? ' checked' : ''}><span><strong>${escapeText(field.label)}</strong>${field.help ? `<small>${escapeText(field.help)}</small>` : ''}</span></label>`;
      }
      let controlMarkup;
      if (field.type === 'textarea') controlMarkup = `<textarea id="${id}" name="${escapeText(field.name)}" rows="${field.rows || 4}" placeholder="${escapeText(field.placeholder || '')}">${escapeText(field.value || '')}</textarea>`;
      else if (field.type === 'select') controlMarkup = `<select id="${id}" name="${escapeText(field.name)}">${(field.options || []).map(([value, label]) => `<option value="${escapeText(value)}"${String(field.value) === String(value) ? ' selected' : ''}>${escapeText(label)}</option>`).join('')}</select>`;
      else controlMarkup = `<input id="${id}" name="${escapeText(field.name)}" type="${escapeText(field.type || 'text')}" value="${escapeText(field.value || '')}" placeholder="${escapeText(field.placeholder || '')}">`;
      return `<label class="${classes}" for="${id}"><span><strong>${escapeText(field.label)}</strong>${field.help ? `<small>${escapeText(field.help)}</small>` : ''}</span>${controlMarkup}</label>`;
    }).join('');
    this.root.innerHTML = `<section class="modal-card component-editor-card" role="dialog" aria-modal="true" aria-labelledby="component-editor-title"><header class="modal-head component-editor-head"><div><span>${escapeText(info.name)}</span><h2 id="component-editor-title">编辑${escapeText(info.name)}</h2></div><button type="button" data-close aria-label="关闭">×</button></header><form class="component-editor-form"><div class="component-identity"><strong>${escapeText(selector)}</strong><small>${escapeText(info.description)}</small></div><div class="component-field-grid">${fieldMarkup}</div><footer class="modal-foot"><button type="button" data-cancel>取消</button><button class="primary" type="submit">应用修改</button></footer></form></section>`;
    const form = pick('form', this.root);
    const close = () => this.close();
    pick('[data-close]', this.root).onclick = close;
    pick('[data-cancel]', this.root).onclick = close;
    form.onsubmit = (event) => {
      event.preventDefault();
      const values = {};
      fields.forEach((field) => {
        const input = form.elements.namedItem(field.name);
        values[field.name] = field.type === 'checkbox' ? Boolean(input?.checked) : input?.value ?? '';
      });
      onApply(values);
      this.close();
    };
    pick('input:not([type="checkbox"]), textarea, select', form)?.focus();
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
    this.savedHtml = '';
    this.documentId = '';
    this.fileHandle = null;
    this.fileName = 'untitled.html';
    this.fileMtime = null;
    this.fileSignature = null;
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
    restoreEditableArtifacts(clone);
    const doctype = this.doc.doctype ? `<!doctype ${this.doc.doctype.name}>\n` : '<!doctype html>\n';
    return doctype + clone.outerHTML;
  }

  currentText() {
    if (this.mode === 'source') return byId('source-editor').value;
    return this.serializeDocument();
  }

  resetHistory(html = this.serializeDocument()) {
    this.history = [{ html, path: null, label: '载入文档' }];
    this.cursor = 0;
    this.signal('history');
  }

  updateDirty(html = this.currentText()) {
    this.setDirty(String(html || '') !== String(this.savedHtml || ''));
  }

  markSaved(html = this.currentText()) {
    const current = String(html || '');
    window.clearTimeout(this.autosaveTimer);
    this.autosaveTimer = null;
    this.savedHtml = current;
    this.sourceText = current;
    this.updateDirty(current);
    draftStore.remove(this.documentId).catch(() => {});
  }

  pushHistory(html, label, path = this.elementPath()) {
    const currentHtml = String(html || '');
    const current = this.history[this.cursor];
    if (current?.html === currentHtml) {
      this.updateDirty(currentHtml);
      return false;
    }
    this.history.splice(this.cursor + 1);
    this.history.push({ html: currentHtml, path, label });
    while (this.history.length > this.historyLimit) this.history.shift();
    this.cursor = this.history.length - 1;
    this.updateDirty(currentHtml);
    this.scheduleAutosave();
    this.signal('history');
    if (canvasPageMode && this.mode === 'visual') scheduleFullPageMeasurement();
    return true;
  }

  checkpoint(label) {
    if (!this.doc) return;
    this.pushHistory(this.serializeDocument(), label);
  }

  async travel(offset) {
    if (this.mode !== 'visual') return;
    const next = this.cursor + offset;
    if (next < 0 || next >= this.history.length) return;
    this.cursor = next;
    const snapshot = this.history[next];
    const selectedPath = snapshot.path;
    await canvas.load(snapshot.html, { preserveHistory: true });
    this.sourceText = this.serializeDocument();
    this.updateDirty(this.sourceText);
    this.scheduleAutosave();
    this.signal('history');
    const restored = this.resolvePath(selectedPath);
    if (restored) this.select(restored);
  }

  scheduleAutosave() {
    window.clearTimeout(this.autosaveTimer);
    if (!this.dirty) {
      this.autosaveTimer = null;
      draftStore.remove(this.documentId).catch(() => {});
      return;
    }
    this.autosaveTimer = window.setTimeout(async () => {
      const html = this.currentText();
      const payload = {
        id: this.documentId || `draft:${this.fileName}:${contentFingerprint(this.savedHtml || html)}`,
        html,
        name: this.fileName,
        savedHtml: this.savedHtml,
        savedAt: Date.now(),
      };
      try {
        await draftStore.put(payload);
        byId('autosave-text').textContent = `自动保存 ${new Date(payload.savedAt).toLocaleTimeString()}`;
      } catch {
        byId('autosave-text').textContent = '自动保存失败';
        toast('自动保存空间不足，请尽快保存文件', 'error');
      }
    }, 1500);
  }
}

const model = new StudioModel();

class CanvasController {
  constructor() {
    this.iframe = byId('design-canvas');
    this.browseFrame = byId('browse-canvas');
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
    this.loadSequence = 0;
    this.pendingLoad = null;
    this.browseSession = 0;
    this.activeBrowseSession = null;
    this.pendingBrowse = null;
    this.browseReadyTimer = null;
    this.hoverFrameRequest = 0;
    this.hoverCandidate = null;
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
    this.frame.addEventListener('pointerdown', (event) => this.beginMove(event));
    pick('.selection-grip', this.actions)?.addEventListener('pointerdown', (event) => this.beginMove(event));
    document.addEventListener('pointermove', (event) => { this.updateResize(event); this.updateMove(event); this.updateBlockDrag(event); });
    document.addEventListener('pointerup', (event) => { this.endResize(); this.endMove(); this.endBlockDrag(event); });
    document.addEventListener('pointercancel', (event) => {
      this.endResize(true);
      this.endMove(true, event.pointerId);
      this.endBlockDrag(event, true);
    });
    window.addEventListener('resize', () => this.updateOverlay());
    window.addEventListener('message', (event) => this.handleBrowseReady(event));
    new ResizeObserver(() => scheduleCanvasViewportUpdate()).observe(byId('workbench'));
  }

  async load(html, options = {}) {
    const source = String(html || '').trim() || EMPTY_DOCUMENT;
    const sequence = ++this.loadSequence;
    this.pendingLoad?.cancel();
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (result, error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        this.iframe.removeEventListener('load', onLoad);
        if (this.pendingLoad?.sequence === sequence) this.pendingLoad = null;
        if (error) reject(error);
        else resolve(result);
      };
      const onLoad = () => {
        if (sequence !== this.loadSequence) return finish(null);
        try {
          const previousSelection = model.selected;
          model.doc = this.iframe.contentDocument;
          if (!model.doc?.documentElement) throw new Error('编辑画布没有返回可编辑文档');
          model.selected = null;
          if (previousSelection) model.signal('selection', null);
          this.wireDocument(model.doc);
          this.updateOverlay();
          updateCanvasInfo();
          model.signal('document', model.doc);
          if (!options.preserveHistory) model.resetHistory(model.serializeDocument());
          if (canvasPageMode) scheduleFullPageMeasurement();
          finish(model.doc);
        } catch (error) { finish(null, error); }
      };
      const timer = window.setTimeout(() => finish(null, new Error('编辑画布加载超时，请重新切换到编辑模式')), 30000);
      this.pendingLoad = { sequence, cancel: () => finish(null) };
      this.iframe.addEventListener('load', onLoad, { once: true });
      this.iframe.srcdoc = prepareEditableHtml(source);
    });
  }

  handleBrowseReady(event) {
    const message = event.data;
    if (event.source !== this.browseFrame.contentWindow || !message) return;
    if (message.type === 'html-designer-preview-rendered' && message.session === this.activeBrowseSession) {
      window.clearTimeout(this.browseReadyTimer);
      this.browseFrame.dataset.previewState = 'ready';
      if (model.mode === 'browse') setStatus('浏览模式 · 页面已载入，链接、表单和脚本交互已启用');
      return;
    }
    const pending = this.pendingBrowse;
    if (!pending || message.type !== 'html-designer-preview-ready' || message.session !== pending.session) return;
    this.browseFrame.contentWindow.postMessage({ type: 'html-designer-render-preview', session: pending.session, html: pending.html }, '*');
    this.pendingBrowse = null;
  }

  enterBrowse(html = model.serializeDocument()) {
    this.preview = true;
    this.layer.hidden = true;
    this.hover.hidden = true;
    this.dropMarker.hidden = true;
    this.shell.classList.add('browsing');
    this.iframe.hidden = true;
    this.browseFrame.hidden = false;
    applyCanvasHeight(currentBaseViewport().height);
    const session = String(++this.browseSession);
    this.activeBrowseSession = session;
    this.pendingBrowse = { session, html: String(html || EMPTY_DOCUMENT) };
    this.browseFrame.dataset.previewState = 'loading';
    window.clearTimeout(this.browseReadyTimer);
    this.browseReadyTimer = window.setTimeout(() => {
      if (this.activeBrowseSession !== session || this.browseFrame.dataset.previewState === 'ready') return;
      this.browseFrame.dataset.previewState = 'error';
      setStatus('浏览页面载入超时 · 可以切回编辑后重试');
      toast('浏览页面载入超时，请切回编辑后重试', 'error');
    }, 8000);
    this.browseFrame.src = `preview-host.html?session=${encodeURIComponent(session)}`;
    updateCanvasInfo();
  }

  exitBrowse() {
    window.clearTimeout(this.browseReadyTimer);
    this.activeBrowseSession = null;
    this.pendingBrowse = null;
    this.browseFrame.dataset.previewState = 'idle';
    this.shell.classList.remove('browsing');
    this.browseFrame.hidden = true;
    this.browseFrame.src = 'about:blank';
    this.iframe.hidden = false;
    this.preview = false;
    if (canvasPageMode) scheduleFullPageMeasurement();
    this.updateOverlay();
    updateCanvasInfo();
  }

  showSelectionMenu() {
    this.actions.classList.remove('opening');
    void this.actions.offsetWidth;
    this.actions.classList.add('opening');
  }

  parentPointerEvent(event) {
    const rect = this.iframe.getBoundingClientRect();
    const scaleX = rect.width / Math.max(1, this.iframe.clientWidth);
    const scaleY = rect.height / Math.max(1, this.iframe.clientHeight);
    return {
      button: event.button,
      pointerId: event.pointerId,
      clientX: rect.left + event.clientX * scaleX,
      clientY: rect.top + event.clientY * scaleY,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      preventDefault: () => event.preventDefault(),
    };
  }

  wireDocument(doc) {
    if (!doc?.body) return;
    doc.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest?.('[data-hd-editing="true"]')) return;
      const target = resolveComponentTarget(event.target);
      if (!target || target !== model.selected) return;
      this.beginMove(this.parentPointerEvent(event), target, event.target);
    }, true);
    doc.addEventListener('pointermove', (event) => this.updateMove(this.parentPointerEvent(event)), true);
    doc.addEventListener('pointerup', (event) => this.endMove(false, event.pointerId), true);
    doc.addEventListener('pointercancel', (event) => this.endMove(true, event.pointerId), true);
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
      const target = resolveComponentTarget(event.target);
      if (target === model.selected) {
        this.showSelectionMenu();
        this.updateOverlay();
      } else model.select(target);
    }, true);
    doc.addEventListener('submit', (event) => event.preventDefault(), true);
    doc.addEventListener('dblclick', (event) => {
      if (this.preview) return;
      if (event.target.closest?.('[data-hd-editing="true"]')) return;
      event.preventDefault();
      this.editText(resolveComponentTarget(event.target));
    }, true);
    doc.addEventListener('mousemove', (event) => this.queueHover(resolveComponentTarget(event.target)));
    doc.addEventListener('mouseleave', () => {
      window.cancelAnimationFrame(this.hoverFrameRequest);
      this.hoverCandidate = null;
      this.hover.hidden = true;
    });
    doc.addEventListener('scroll', () => this.updateOverlay(), true);
    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.moveSession) {
        event.preventDefault();
        this.endMove(true);
        return;
      }
      if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && /^Arrow(Left|Right|Up|Down)$/.test(event.key) && model.selected) {
        event.preventDefault();
        const offsets = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        };
        this.nudgeSelected(...offsets[event.key]);
        return;
      }
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
    if (element.matches(selector)) return element;
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

  queueHover(element) {
    this.hoverCandidate = element;
    if (this.hoverFrameRequest) return;
    this.hoverFrameRequest = window.requestAnimationFrame(() => {
      this.hoverFrameRequest = 0;
      this.showHover(this.hoverCandidate);
    });
  }

  updateOverlay() {
    const element = model.selected;
    if (!element?.isConnected || this.preview || model.mode !== 'visual') {
      this.layer.hidden = true;
      return;
    }
    const info = componentInfo(element);
    renderSelectionContext(element, info);
    this.layer.hidden = false;
    const rect = element.getBoundingClientRect();
    const left = rect.left;
    const top = rect.top;
    Object.assign(this.frame.style, { left: `${left}px`, top: `${top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    this.label.textContent = `${info.name} · ${this.describe(element)}`;
    byId('selection-component-kind').textContent = info.name;
    byId('selection-menu-title').textContent = this.describe(element);
    const settingsButton = byId('component-settings-button');
    settingsButton.setAttribute('aria-label', `编辑${info.name}设置`);
    settingsButton.dataset.tooltip = `编辑${info.name}设置`;
    const textButton = byId('selection-text-action');
    textButton.hidden = !info.canEditText;
    const uiScale = Math.max(.01, canvasZoom);
    Object.assign(this.label.style, { left: `${left}px`, top: `${Math.max(0, top - 20 / uiScale)}px` });
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    const pageX = Math.round(rect.left + element.ownerDocument.defaultView.scrollX);
    const pageY = Math.round(rect.top + element.ownerDocument.defaultView.scrollY);
    this.size.textContent = this.moveSession ? `${width} × ${height} · X ${pageX} · Y ${pageY}` : `${width} × ${height}`;
    const sizeTop = top + rect.height + 24 / uiScale < this.iframe.clientHeight ? top + rect.height + 5 / uiScale : Math.max(1, top + rect.height - 20 / uiScale);
    const sizeWidth = this.moveSession ? 176 : 66;
    const sizeLeft = Math.min(Math.max(2, left + rect.width - sizeWidth), Math.max(2, this.iframe.clientWidth - sizeWidth - 2));
    Object.assign(this.size.style, { left: `${sizeLeft}px`, top: `${sizeTop}px` });
    const summarySize = byId('summary-size');
    if (summarySize) summarySize.textContent = `${width} × ${height}`;
    this.actions.style.removeProperty('left');
    this.actions.style.removeProperty('top');
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

  setAttribute(element, name, value) {
    const next = String(value ?? '').trim();
    const normalizedName = String(name || '').toLowerCase();
    if (normalizedName.startsWith('on')) {
      element.removeAttribute(name);
      setInertAttribute(element, 'data-hd-inert-events', name, next || null);
      return;
    }
    if (['href', 'src', 'xlink:href', 'action', 'formaction'].includes(normalizedName)) {
      setInertAttribute(element, 'data-hd-inert-urls', name, null);
      if (/^javascript:/i.test(next)) {
        element.removeAttribute(name);
        setInertAttribute(element, 'data-hd-inert-urls', name, next);
        return;
      }
    }
    if (next) element.setAttribute(name, next); else element.removeAttribute(name);
  }

  componentEditorFields(element, info) {
    const fields = [];
    const textTarget = this.editableTextTarget(element);
    const textKeys = new Set(['link', 'button', 'summary', 'list-item', 'table-cell', 'heading', 'text']);
    if (textKeys.has(info.key) && textTarget && !VOID_TAGS.has(textTarget.tagName)) {
      if (textTarget.childElementCount) {
        fields.push({
          name: 'richText',
          label: '文字与内联标记',
          type: 'textarea',
          value: serializeEditableElement(textTarget, true),
          help: '保留 span、strong 等内联标记；只修改文字时不要删除标签',
          wide: true,
          rows: 4,
        });
      } else fields.push({ name: 'text', label: '主要文字', value: textTarget.textContent.trim(), wide: true });
    }
    if (info.key === 'link') {
      fields.push(
        { name: 'href', label: '链接地址', value: element.getAttribute('href') || '', placeholder: 'https://… 或 #section', wide: true },
        { name: 'target', label: '打开方式', type: 'select', value: element.getAttribute('target') || '', options: [['', '当前页面'], ['_blank', '新窗口']] },
      );
    } else if (['button', 'input-button'].includes(info.key)) {
      fields.push(
        { name: 'buttonType', label: '按钮类型', type: 'select', value: element.getAttribute('type') || 'button', options: [['button', '普通按钮'], ['submit', '提交表单'], ['reset', '重置表单']] },
        { name: 'ariaLabel', label: '无障碍名称', value: element.getAttribute('aria-label') || '' },
      );
      if (info.key === 'input-button') fields.unshift({ name: 'value', label: '按钮文字', value: element.getAttribute('value') || '' });
    } else if (info.key === 'image') {
      const image = element.tagName === 'IMG' ? element : element.querySelector('img');
      fields.push(
        { name: 'src', label: '图片地址', value: image?.getAttribute('src') || '', placeholder: 'https://… 或相对路径', wide: true },
        { name: 'alt', label: '替代文字', value: image?.getAttribute('alt') || '', help: '用于无障碍访问和图片加载失败时的说明', wide: true },
        { name: 'loading', label: '加载方式', type: 'select', value: image?.getAttribute('loading') || '', options: [['', '浏览器默认'], ['lazy', '延迟加载'], ['eager', '立即加载']] },
      );
    } else if (['input', 'choice'].includes(info.key)) {
      fields.push(
        { name: 'inputType', label: '字段类型', type: 'select', value: element.getAttribute('type') || 'text', options: [['text', '文本'], ['email', '邮箱'], ['tel', '电话'], ['url', '网址'], ['number', '数字'], ['date', '日期'], ['password', '密码'], ['checkbox', '复选框'], ['radio', '单选框']] },
        { name: 'name', label: '字段名称', value: element.getAttribute('name') || '' },
        { name: 'placeholder', label: '占位文字', value: element.getAttribute('placeholder') || '', wide: true },
        { name: 'value', label: '默认值', value: element.getAttribute('value') || '' },
        { name: 'required', label: '必填字段', type: 'checkbox', value: element.hasAttribute('required') },
      );
      if (info.key === 'choice') fields.push({ name: 'checked', label: '默认选中', type: 'checkbox', value: element.hasAttribute('checked') });
    } else if (info.key === 'textarea') {
      fields.push(
        { name: 'name', label: '字段名称', value: element.getAttribute('name') || '' },
        { name: 'rows', label: '显示行数', type: 'number', value: element.getAttribute('rows') || '4' },
        { name: 'placeholder', label: '占位文字', value: element.getAttribute('placeholder') || '', wide: true },
        { name: 'value', label: '默认内容', type: 'textarea', value: element.textContent || '', wide: true },
        { name: 'required', label: '必填字段', type: 'checkbox', value: element.hasAttribute('required') },
      );
    } else if (info.key === 'select') {
      const options = Array.from(element.options).map((option) => option.value === option.textContent ? option.textContent : `${option.textContent} | ${option.value}`).join('\n');
      fields.push(
        { name: 'name', label: '字段名称', value: element.getAttribute('name') || '' },
        { name: 'required', label: '必填字段', type: 'checkbox', value: element.hasAttribute('required') },
        { name: 'options', label: '选项', type: 'textarea', value: options, help: '每行一个选项，可写成“显示文字 | 值”', wide: true, rows: 6 },
      );
    } else if (info.key === 'form') {
      fields.push(
        { name: 'action', label: '提交地址', value: element.getAttribute('action') || '', wide: true },
        { name: 'method', label: '提交方式', type: 'select', value: (element.getAttribute('method') || 'get').toLowerCase(), options: [['get', 'GET'], ['post', 'POST'], ['dialog', 'DIALOG']] },
        { name: 'autocomplete', label: '自动完成', type: 'select', value: element.getAttribute('autocomplete') || '', options: [['', '浏览器默认'], ['on', '开启'], ['off', '关闭']] },
      );
    } else if (info.key === 'details') {
      fields.push(
        { name: 'summary', label: '折叠标题', value: element.querySelector(':scope > summary')?.textContent.trim() || '', wide: true },
        { name: 'open', label: '默认展开', type: 'checkbox', value: element.hasAttribute('open') },
      );
    } else if (info.key === 'media') {
      fields.push(
        { name: 'src', label: '媒体地址', value: element.getAttribute('src') || element.querySelector('source')?.getAttribute('src') || '', wide: true },
        { name: 'controls', label: '显示播放控件', type: 'checkbox', value: element.hasAttribute('controls') },
        { name: 'autoplay', label: '自动播放', type: 'checkbox', value: element.hasAttribute('autoplay') },
        { name: 'muted', label: '默认静音', type: 'checkbox', value: element.hasAttribute('muted') },
      );
    } else if (info.key === 'embed') {
      fields.push(
        { name: 'src', label: '嵌入地址', value: element.getAttribute('src') || '', wide: true },
        { name: 'title', label: '内容标题', value: element.getAttribute('title') || '', wide: true },
        { name: 'loading', label: '加载方式', type: 'select', value: element.getAttribute('loading') || '', options: [['', '浏览器默认'], ['lazy', '延迟加载'], ['eager', '立即加载']] },
      );
    } else if (info.key === 'table') {
      fields.push({ name: 'caption', label: '表格标题', value: element.caption?.textContent.trim() || '', wide: true });
    } else if (['navigation', 'layout', 'dialog', 'role-choice', 'role-input'].includes(info.key)) {
      fields.push({ name: 'ariaLabel', label: '无障碍名称', value: element.getAttribute('aria-label') || '', wide: true });
      if (info.key === 'dialog') fields.push({ name: 'open', label: '默认打开', type: 'checkbox', value: element.hasAttribute('open') });
      if (info.key === 'role-choice') fields.push({ name: 'checked', label: '默认选中', type: 'checkbox', value: element.getAttribute('aria-checked') === 'true' });
    }
    fields.push(
      { name: 'id', label: '元素 ID', value: element.id || '' },
      { name: 'className', label: 'CSS 类名', value: element.getAttribute('class') || '', help: '多个类名用空格分隔', wide: true },
    );
    return { fields, textTarget };
  }

  openComponentEditor(element = model.selected) {
    if (!element) return;
    const info = componentInfo(element);
    const { fields, textTarget } = this.componentEditorFields(element, info);
    modal.component(info, this.describe(element), fields, (values) => {
      const before = model.serializeDocument();
      const setBoolean = (name, enabled) => element.toggleAttribute(name, Boolean(enabled));
      if ('text' in values && textTarget) textTarget.textContent = values.text;
      if ('richText' in values && textTarget) {
        textTarget.replaceChildren(...prepareEditableFragment(values.richText, textTarget.ownerDocument));
      }
      if (info.key === 'link') {
        this.setAttribute(element, 'href', values.href);
        this.setAttribute(element, 'target', values.target);
        if (values.target === '_blank') element.setAttribute('rel', 'noopener noreferrer');
      } else if (['button', 'input-button'].includes(info.key)) {
        this.setAttribute(element, 'type', values.buttonType);
        this.setAttribute(element, 'aria-label', values.ariaLabel);
        if (info.key === 'input-button') this.setAttribute(element, 'value', values.value);
      } else if (info.key === 'image') {
        const image = element.tagName === 'IMG' ? element : element.querySelector('img');
        if (image) {
          this.setAttribute(image, 'src', values.src);
          image.setAttribute('alt', values.alt || '');
          this.setAttribute(image, 'loading', values.loading);
        }
      } else if (['input', 'choice'].includes(info.key)) {
        this.setAttribute(element, 'type', values.inputType);
        this.setAttribute(element, 'name', values.name);
        this.setAttribute(element, 'placeholder', values.placeholder);
        this.setAttribute(element, 'value', values.value);
        setBoolean('required', values.required);
        if ('checked' in values) setBoolean('checked', values.checked);
      } else if (info.key === 'textarea') {
        this.setAttribute(element, 'name', values.name);
        this.setAttribute(element, 'rows', values.rows);
        this.setAttribute(element, 'placeholder', values.placeholder);
        element.textContent = values.value;
        setBoolean('required', values.required);
      } else if (info.key === 'select') {
        this.setAttribute(element, 'name', values.name);
        setBoolean('required', values.required);
        const lines = values.options.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        if (lines.length) {
          const existing = Array.from(element.options);
          lines.forEach((line, index) => {
            const [label, value] = line.split('|').map((part) => part.trim());
            const option = existing[index] || model.doc.createElement('option');
            option.textContent = label;
            option.value = value || label;
            if (!existing[index]) {
              const last = existing.at(-1);
              const container = last?.parentElement?.tagName === 'OPTGROUP' ? last.parentElement : element;
              container.append(option);
              existing.push(option);
            }
          });
          existing.slice(lines.length).forEach(option => option.remove());
        }
      } else if (info.key === 'form') {
        this.setAttribute(element, 'action', values.action);
        this.setAttribute(element, 'method', values.method);
        this.setAttribute(element, 'autocomplete', values.autocomplete);
      } else if (info.key === 'details') {
        const summary = element.querySelector(':scope > summary');
        if (summary) summary.textContent = values.summary;
        setBoolean('open', values.open);
      } else if (info.key === 'media') {
        const source = element.hasAttribute('src') ? element : element.querySelector('source') || element;
        this.setAttribute(source, 'src', values.src);
        setBoolean('controls', values.controls);
        setBoolean('autoplay', values.autoplay);
        setBoolean('muted', values.muted);
      } else if (info.key === 'embed') {
        this.setAttribute(element, 'src', values.src);
        this.setAttribute(element, 'title', values.title);
        this.setAttribute(element, 'loading', values.loading);
      } else if (info.key === 'table') {
        if (values.caption) {
          const caption = element.caption || element.createCaption();
          caption.textContent = values.caption;
        } else element.caption?.remove();
      } else if (['navigation', 'layout', 'dialog', 'role-choice', 'role-input'].includes(info.key)) {
        this.setAttribute(element, 'aria-label', values.ariaLabel);
        if ('open' in values) setBoolean('open', values.open);
        if ('checked' in values) element.setAttribute('aria-checked', String(values.checked));
      }
      this.setAttribute(element, 'id', values.id);
      this.setAttribute(element, 'class', values.className);
      if (model.serializeDocument() !== before) model.checkpoint(`编辑${info.name}`);
      renderTree();
      renderInspectors();
      this.updateOverlay();
      setStatus(`${info.name}设置已更新`);
      toast(`${info.name}已更新`, 'success');
    });
  }

  prepareDuplicate(copy) {
    if (!copy) return copy;
    const idMap = new Map();
    const reserved = new Set();
    const nodes = [copy, ...pickAll('[id]', copy)].filter(node => node.id);
    nodes.forEach((node) => {
      const original = node.id;
      const stem = `${original}-copy`;
      let candidate = stem;
      let index = 2;
      while (model.doc.getElementById(candidate) || reserved.has(candidate)) candidate = `${stem}-${index++}`;
      reserved.add(candidate);
      idMap.set(original, candidate);
      node.id = candidate;
    });
    const tokenAttributes = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'headers'];
    [copy, ...pickAll('*', copy)].forEach((node) => {
      ['for', 'list', 'form'].forEach((attribute) => {
        const value = node.getAttribute(attribute);
        if (idMap.has(value)) node.setAttribute(attribute, idMap.get(value));
      });
      tokenAttributes.forEach((attribute) => {
        const value = node.getAttribute(attribute);
        if (!value) return;
        node.setAttribute(attribute, value.split(/\s+/).map(token => idMap.get(token) || token).join(' '));
      });
      const href = node.getAttribute('href');
      if (href?.startsWith('#') && idMap.has(href.slice(1))) node.setAttribute('href', `#${idMap.get(href.slice(1))}`);
    });
    return copy;
  }

  runCommand(command) {
    if (command === 'insert') return openInsertPalette();
    if (command === 'deselect') return model.select(null);
    const element = model.selected;
    if (!element) return;
    if (command === 'reset-position') return this.resetFreePosition(element);
    if (command === 'component-settings') return this.openComponentEditor(element);
    if (command === 'edit') return this.editText(element);
    if (command === 'review') return ai.openReview();
    if (command === 'parent') {
      const parent = element.parentElement;
      if (parent && parent !== model.doc.documentElement) model.select(parent);
      return;
    }
    if (command === 'duplicate') {
      const copy = this.prepareDuplicate(element.cloneNode(true));
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
      const newRow = this.prepareDuplicate(row.cloneNode(true));
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
    if (command === 'add-option' && element.tagName === 'SELECT') {
      const option = model.doc.createElement('option');
      option.textContent = '新选项';
      option.value = '新选项';
      element.append(option);
      model.checkpoint('添加选项');
    }
    if (command === 'toggle-details') {
      const details = element.tagName === 'DETAILS' ? element : element.closest('details');
      if (details) {
        details.toggleAttribute('open');
        model.checkpoint(details.hasAttribute('open') ? '展开折叠面板' : '收起折叠面板');
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
    this.resizeSession = {
      element,
      axis,
      x: event.clientX,
      y: event.clientY,
      width: rect.width,
      height: rect.height,
      inlineWidth: element.style.getPropertyValue('width'),
      widthPriority: element.style.getPropertyPriority('width'),
      inlineHeight: element.style.getPropertyValue('height'),
      heightPriority: element.style.getPropertyPriority('height'),
      ratio: rect.width / Math.max(1, rect.height),
      changed: false,
    };
  }

  restoreInlineProperty(element, property, value, priority = '') {
    if (value) element.style.setProperty(property, value, priority);
    else element.style.removeProperty(property);
    if (!element.getAttribute('style')) element.removeAttribute('style');
  }

  freeTranslateOffset(element = model.selected) {
    if (!element?.isConnected) return { x: 0, y: 0 };
    const computed = String(element.ownerDocument.defaultView.getComputedStyle(element).translate || 'none').trim();
    if (!computed || computed === 'none') return { x: 0, y: 0 };
    const pixels = computed.match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))px(?:\s+(-?(?:\d+(?:\.\d+)?|\.\d+))px)?(?:\s+-?(?:\d+(?:\.\d+)?|\.\d+)px)?$/);
    if (pixels) return { x: Number(pixels[1]) || 0, y: Number(pixels[2]) || 0 };

    const visualRect = element.getBoundingClientRect();
    const inlineTranslate = element.style.getPropertyValue('translate');
    const translatePriority = element.style.getPropertyPriority('translate');
    const inlineTransition = element.style.getPropertyValue('transition');
    const transitionPriority = element.style.getPropertyPriority('transition');
    element.style.setProperty('transition', 'none', 'important');
    element.style.setProperty('translate', 'none', 'important');
    const originRect = element.getBoundingClientRect();
    this.restoreInlineProperty(element, 'translate', inlineTranslate, translatePriority);
    this.restoreInlineProperty(element, 'transition', inlineTransition, transitionPriority);
    return {
      x: visualRect.left - originRect.left,
      y: visualRect.top - originRect.top,
    };
  }

  setFreePosition(element, x, y, options = {}) {
    if (!element?.isConnected || element === model.doc?.body) return false;
    const current = this.freeTranslateOffset(element);
    const nextX = Math.round((Number(x) || 0) * 10) / 10;
    const nextY = Math.round((Number(y) || 0) * 10) / 10;
    if (Math.abs(current.x - nextX) < .05 && Math.abs(current.y - nextY) < .05) return false;
    const priority = options.priority ?? element.style.getPropertyPriority('translate');
    element.style.setProperty('translate', `${nextX}px ${nextY}px`, priority);
    if (options.checkpoint !== false) model.checkpoint(options.label || '自由移动组件');
    if (canvasPageMode) scheduleFullPageMeasurement();
    this.updateOverlay();
    return true;
  }

  resetFreePosition(element = model.selected) {
    if (!element?.isConnected || element === model.doc?.body) return;
    const before = model.serializeDocument();
    element.style.setProperty('translate', 'none');
    if (model.serializeDocument() !== before) {
      model.checkpoint('组件位置归零');
      renderInspectors();
      this.updateOverlay();
      setStatus('组件已回到原始布局位置');
      toast('组件位置已归零', 'success');
    }
  }

  nudgeSelected(dx, dy) {
    const element = model.selected;
    if (!element || element === model.doc?.body || model.mode !== 'visual') return false;
    const current = this.freeTranslateOffset(element);
    const moved = this.setFreePosition(element, current.x + dx, current.y + dy, {
      label: '微调组件位置',
    });
    if (moved) {
      renderInspectors();
      setStatus(`组件位置 X ${Math.round(current.x + dx)} · Y ${Math.round(current.y + dy)}`);
    }
    return moved;
  }

  beginMove(event, element = model.selected, captureTarget = event.currentTarget) {
    if (event.button !== 0 || !element || element === model.doc?.body || this.resizeSession || this.layer.classList.contains('editing')) return;
    event.preventDefault();
    captureTarget?.setPointerCapture?.(event.pointerId);
    this.frame.focus({ preventScroll: true });
    const offset = this.freeTranslateOffset(element);
    this.moveSession = {
      element,
      pointerId: event.pointerId,
      captureTarget,
      startX: event.clientX,
      startY: event.clientY,
      baseX: offset.x,
      baseY: offset.y,
      nextX: offset.x,
      nextY: offset.y,
      inlineTranslate: element.style.getPropertyValue('translate'),
      translatePriority: element.style.getPropertyPriority('translate'),
      active: false,
      changed: false,
    };
    this.actions.classList.add('moving');
    this.layer.classList.add('moving');
    setStatus('自由移动组件 · 按住 Shift 可锁定水平或垂直方向 · Esc 取消');
  }

  updateMove(event) {
    const session = this.moveSession;
    if (!session || session.pointerId !== event.pointerId) return;
    const screenDx = event.clientX - session.startX;
    const screenDy = event.clientY - session.startY;
    if (!session.active && Math.hypot(screenDx, screenDy) < 3) return;
    session.active = true;
    const iframeRect = this.iframe.getBoundingClientRect();
    const scaleX = iframeRect.width / Math.max(1, this.iframe.clientWidth);
    const scaleY = iframeRect.height / Math.max(1, this.iframe.clientHeight);
    let dx = screenDx / Math.max(.01, scaleX);
    let dy = screenDy / Math.max(.01, scaleY);
    if (event.shiftKey) {
      if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
      else dx = 0;
    }
    session.nextX = session.baseX + dx;
    session.nextY = session.baseY + dy;
    session.changed = this.setFreePosition(session.element, session.nextX, session.nextY, {
      checkpoint: false,
      priority: session.translatePriority,
    }) || session.changed;
    const pageX = Math.round(session.element.getBoundingClientRect().left + model.doc.defaultView.scrollX);
    const pageY = Math.round(session.element.getBoundingClientRect().top + model.doc.defaultView.scrollY);
    setStatus(`自由移动组件 · X ${pageX} · Y ${pageY}`);
  }

  endMove(cancel = false, pointerId = null) {
    const session = this.moveSession;
    if (!session || (pointerId != null && session.pointerId !== pointerId)) return;
    if (session.captureTarget?.hasPointerCapture?.(session.pointerId)) {
      session.captureTarget.releasePointerCapture(session.pointerId);
    }
    if (cancel && session.changed) {
      this.restoreInlineProperty(session.element, 'translate', session.inlineTranslate, session.translatePriority);
      setStatus('已取消自由移动');
    } else if (session.changed) {
      model.select(session.element);
      model.checkpoint('自由移动组件');
      renderInspectors();
      renderTree();
      const offset = this.freeTranslateOffset(session.element);
      setStatus(`组件自由位置已更新 · X ${Math.round(offset.x)} · Y ${Math.round(offset.y)}`);
      toast('组件已移动到新位置', 'success');
    } else if (!cancel) {
      this.showSelectionMenu();
    }
    this.dropMarker.hidden = true;
    this.actions.classList.remove('moving');
    this.layer.classList.remove('moving');
    this.moveSession = null;
    this.updateOverlay();
    if (canvasPageMode) scheduleFullPageMeasurement();
  }

  updateResize(event) {
    const session = this.resizeSession;
    if (!session) return;
    const dx = (event.clientX - session.x) / canvasZoom;
    const dy = (event.clientY - session.y) / canvasZoom;
    let width = Math.max(12, session.width + dx);
    let height = Math.max(12, session.height + dy);
    if (event.shiftKey && session.axis === 'xy') height = width / session.ratio;
    if (session.axis.includes('x')) session.element.style.width = `${Math.round(width)}px`;
    if (session.axis.includes('y')) session.element.style.height = `${Math.round(height)}px`;
    session.changed = true;
    this.updateOverlay();
  }

  endResize(cancel = false) {
    const session = this.resizeSession;
    if (!session) return;
    if (cancel && session.changed) {
      this.restoreInlineProperty(session.element, 'width', session.inlineWidth, session.widthPriority);
      this.restoreInlineProperty(session.element, 'height', session.inlineHeight, session.heightPriority);
      this.updateOverlay();
    } else if (session.changed) model.checkpoint('调整尺寸');
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
    return prepareEditableFragment(html.trim(), model.doc).find(node => node.nodeType === Node.ELEMENT_NODE) || null;
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

function renderSelectionContext(element, info = componentInfo(element)) {
  const root = byId('selection-context');
  const divider = byId('context-divider');
  if (!root || !divider) return;
  const commands = [];
  if (element?.tagName === 'LI') {
    commands.push(['list-before', '上方添加列表项', 'up'], ['list-after', '下方添加列表项', 'down']);
  } else if (element?.closest?.('th,td')) {
    commands.push(['row-after', '下方添加行', 'down'], ['col-after', '右侧添加列', 'external']);
  } else if (info.key === 'select') {
    commands.push(['add-option', '添加选项', 'boxes']);
  } else if (['details', 'summary'].includes(info.key)) {
    const details = element.tagName === 'DETAILS' ? element : element.closest('details');
    commands.push(['toggle-details', details?.hasAttribute('open') ? '收起面板' : '展开面板', details?.hasAttribute('open') ? 'up' : 'down']);
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

function freePositionControl(element, label, axis) {
  const position = canvas.freeTranslateOffset(element);
  return control(label, String(Math.round(position[axis] * 10) / 10), (next) => {
    const value = Number(next);
    if (!Number.isFinite(value)) return;
    const current = canvas.freeTranslateOffset(element);
    if (canvas.setFreePosition(
      element,
      axis === 'x' ? value : current.x,
      axis === 'y' ? value : current.y,
      { label: '设置组件自由位置' },
    )) {
      renderInspectors();
      setStatus(`组件${axis === 'x' ? '水平' : '垂直'}位置已更新`);
    }
  }, { type: 'number' });
}

function freePositionResetControl(element) {
  const row = document.createElement('div');
  row.className = 'free-position-actions';
  const hint = document.createElement('small');
  hint.textContent = '拖动选中框可自由摆放；Shift 锁定方向';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = '位置归零';
  button.onclick = () => canvas.resetFreePosition(element);
  row.append(hint, button);
  return row;
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
    group('自由位置', [
      freePositionControl(element, '水平偏移 X', 'x'),
      freePositionControl(element, '垂直偏移 Y', 'y'),
      freePositionResetControl(element),
    ]),
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
  Array.from(element.attributes).filter((attribute) => {
    return !['class', 'id', 'style', 'contenteditable', 'data-hd-editing'].includes(attribute.name)
      && !attribute.name.startsWith('data-hd-inert-')
      && attribute.name !== 'data-hd-script-placeholder';
  }).forEach((attribute) => {
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
      canvas.setAttribute(element, nextName, value.value);
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
    const eventCode = getInertAttribute(element, 'data-hd-inert-events', eventName) ?? element.getAttribute(eventName);
    actionInput.value = element.getAttribute(`data-hd-${eventName}-action`) || (eventCode != null ? 'custom' : 'none');
    valueInput.value = element.getAttribute(`data-hd-${eventName}-value`) || '';
    code.value = eventCode || '';
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
    canvas.setAttribute(element, eventName, action === 'none' ? '' : scripts[action] || '');
    element.setAttribute(`data-hd-${eventName}-action`, action);
    element.setAttribute(`data-hd-${eventName}-value`, value);
    model.checkpoint('设置交互');
    sync();
  };
  pick('[data-clear]', actions).onclick = () => {
    const eventName = eventInput.value;
    canvas.setAttribute(element, eventName, '');
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
  outerArea.value = serializeEditableElement(element);
  const outerActions = document.createElement('div');
  outerActions.className = 'control-actions';
  outerActions.innerHTML = '<button type="button">应用 outer HTML</button>';
  pick('button', outerActions).onclick = () => {
    const nodes = prepareEditableFragment(outerArea.value.trim(), element.ownerDocument);
    const elements = nodes.filter(node => node.nodeType === Node.ELEMENT_NODE);
    const extraContent = nodes.some(node => node.nodeType !== Node.ELEMENT_NODE && node.textContent.trim());
    if (elements.length !== 1 || extraContent) return toast('Outer HTML 必须只有一个根元素', 'error');
    const replacement = elements[0];
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
  innerArea.value = serializeEditableElement(element, true);
  const innerActions = document.createElement('div');
  innerActions.className = 'control-actions';
  innerActions.innerHTML = '<button type="button">应用 inner HTML</button>';
  pick('button', innerActions).onclick = () => {
    element.replaceChildren(...prepareEditableFragment(innerArea.value, element.ownerDocument));
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
      const html = await file.text();
      await this.load(html, file.name, handle, file.lastModified, {
        fileSignature: this.signature(file, html),
      });
    } catch (error) {
      if (error.name !== 'AbortError') toast(`无法打开文件：${error.message}`, 'error');
    }
  }

  signature(file, text) {
    return {
      size: Number(file?.size ?? new Blob([text]).size),
      mtime: Number(file?.lastModified || 0),
      hash: contentFingerprint(text),
    };
  }

  signaturesMatch(left, right) {
    return Boolean(left && right && left.size === right.size && left.hash === right.hash);
  }

  async importFile(file) {
    const html = await file.text();
    await this.load(html, file.name, null, null);
  }

  async load(html, name, handle = null, mtime = null, options = {}) {
    model.fileName = name || 'untitled.html';
    model.fileHandle = handle;
    model.fileMtime = mtime;
    model.fileSignature = options.fileSignature || null;
    model.documentId = options.documentId
      || `${handle ? 'file' : 'import'}:${model.fileName}:${contentFingerprint(html)}`;
    model.sourceText = html;
    activateVisualWorkspace();
    await canvas.load(html);
    const canonical = model.serializeDocument();
    model.sourceText = canonical;
    if (options.recovered) {
      model.savedHtml = String(options.savedHtml || '');
      model.updateDirty(canonical);
    } else model.markSaved(canonical);
    showStudio();
    updateDocumentState();
    byId('refresh-button').disabled = !handle;
    byId('diff-button').disabled = !handle;
    const relativeReferences = countProjectRelativeReferences(html);
    const loadedMessage = handle ? `已关联 ${model.fileName}` : `已导入 ${model.fileName}`;
    if (relativeReferences) {
      toast(`${loadedMessage}；检测到 ${relativeReferences} 个相对路径，请设置 <base> 或改用内联资源`, 'error');
      setStatus(`文档已载入 · ${relativeReferences} 个相对资源可能需要路径基址`);
    } else toast(loadedMessage, 'success');
  }

  async newDocument() {
    model.fileName = 'untitled.html';
    model.fileHandle = null;
    model.fileMtime = null;
    model.fileSignature = null;
    model.documentId = `new:${window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
    model.sourceText = EMPTY_DOCUMENT;
    activateVisualWorkspace();
    await canvas.load(EMPTY_DOCUMENT);
    model.markSaved(model.serializeDocument());
    showStudio();
    updateDocumentState();
    byId('refresh-button').disabled = true;
    byId('diff-button').disabled = true;
  }

  async save() {
    const html = model.currentText();
    if (!html) return;
    if (!model.fileHandle) return this.export(html, { markSaved: true });
    try {
      const latest = await model.fileHandle.getFile();
      const latestText = await latest.text();
      const latestSignature = this.signature(latest, latestText);
      if (model.fileSignature && !this.signaturesMatch(latestSignature, model.fileSignature)) {
        const overwrite = await modal.confirm('磁盘文件已变化', '文件在其他程序中被修改。是否覆盖磁盘版本？', '仍然覆盖');
        if (!overwrite) return;
      }
      const writable = await model.fileHandle.createWritable();
      await writable.write(html);
      await writable.close();
      const savedFile = await model.fileHandle.getFile();
      model.fileMtime = savedFile.lastModified;
      model.fileSignature = this.signature(savedFile, html);
      model.markSaved(html);
      toast('已保存到本地文件', 'success');
    } catch (error) { toast(`保存失败：${error.message}`, 'error'); }
  }

  export(html = model.currentText(), options = {}) {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = model.fileName || 'untitled.html';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (options.markSaved) model.markSaved(html);
    toast(`${options.markSaved ? '已保存' : '已导出副本'} ${anchor.download}`, 'success');
  }

  async refresh() {
    if (!model.fileHandle) return;
    if (model.dirty && !(await modal.confirm('重新读取文件', '当前未保存修改会被磁盘版本替换。', '放弃修改'))) return;
    const file = await model.fileHandle.getFile();
    const html = await file.text();
    await this.load(html, file.name, model.fileHandle, file.lastModified, {
      fileSignature: this.signature(file, html),
    });
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
    this.modelRequestId = 0;
    this.modelsLoadedFor = '';
    this.loadSettings();
  }

  open() {
    this.drawer.hidden = false;
    byId('studio').classList.add('ai-open');
    byId('ai-button').classList.add('active');
    this.updateTarget();
    requestAnimationFrame(() => { canvas.updateOverlay(); updateCanvasInfo(); });
    byId('ai-input').focus();
    if (this.modelsLoadedFor !== byId('ai-cli').value) this.loadModels({ selected: this.savedModel });
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

  modelValue() {
    return byId('ai-model').value === CUSTOM_MODEL_VALUE
      ? byId('ai-model-custom').value.trim()
      : byId('ai-model').value;
  }

  modelEndpoint(cli, refresh = false) {
    const endpoint = byId('ai-endpoint').value.trim() || '/api/ai-design';
    const url = new URL(endpoint, window.location.href);
    url.pathname = /\/ai-design\/?$/.test(url.pathname)
      ? url.pathname.replace(/\/ai-design\/?$/, '/ai-models')
      : '/api/ai-models';
    url.search = '';
    url.searchParams.set('cli', cli);
    if (refresh) url.searchParams.set('refresh', '1');
    return url.toString();
  }

  renderModelOptions(models = [], selected = '') {
    const select = byId('ai-model');
    select.replaceChildren();
    const addOption = (value, label, description = '') => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (description) option.title = description;
      select.append(option);
    };
    addOption('', '使用 CLI 默认模型');
    models.forEach(item => addOption(item.id, item.name || item.id, item.description || ''));
    if (selected && !models.some(item => item.id === selected)) addOption(selected, `${selected}（当前选择）`);
    addOption(CUSTOM_MODEL_VALUE, '手动输入模型 ID…');
    select.value = selected || '';
    if (!select.value && selected) select.value = CUSTOM_MODEL_VALUE;
    this.updateCustomModelInput();
  }

  updateCustomModelInput() {
    const custom = byId('ai-model').value === CUSTOM_MODEL_VALUE;
    const input = byId('ai-model-custom');
    input.hidden = !custom;
    if (custom) {
      byId('ai-model-status').dataset.state = 'warning';
      byId('ai-model-status').textContent = '手动模型会直接传给当前 CLI，请确认名称可用';
      input.focus();
    }
  }

  async loadModels(options = {}) {
    const cli = byId('ai-cli').value;
    const selected = options.selected ?? this.modelValue();
    const requestId = ++this.modelRequestId;
    const select = byId('ai-model');
    const refresh = byId('ai-refresh-models');
    const status = byId('ai-model-status');
    select.disabled = true;
    refresh.disabled = true;
    refresh.textContent = '读取中';
    status.dataset.state = 'loading';
    status.textContent = `正在读取 ${cli === 'claude' ? 'Claude Code CLI' : 'Codex CLI'} 模型…`;
    try {
      const response = await apiFetch(this.modelEndpoint(cli, Boolean(options.refresh)));
      if (!response.ok) throw await this.responseError(response);
      const data = await response.json();
      if (requestId !== this.modelRequestId || cli !== byId('ai-cli').value) return;
      this.renderModelOptions(data.models || [], selected);
      this.modelsLoadedFor = cli;
      status.dataset.state = data.complete === false ? 'warning' : 'ready';
      status.textContent = data.complete === false
        ? `已读取 ${data.models?.length || 0} 个模型候选，可手动输入其他模型 ID`
        : `已从当前 CLI 读取 ${data.models?.length || 0} 个可用模型`;
      status.title = [data.version, data.warning].filter(Boolean).join(' · ');
    } catch (error) {
      if (requestId !== this.modelRequestId) return;
      this.renderModelOptions([], selected);
      status.dataset.state = 'error';
      status.textContent = `模型读取失败，可使用默认模型或手动输入：${error.message}`;
      status.title = error.message;
    } finally {
      if (requestId === this.modelRequestId) {
        select.disabled = false;
        refresh.disabled = false;
        refresh.textContent = '刷新';
      }
    }
  }

  loadSettings() {
    const settings = safeJson(localStorage.getItem(STORAGE.ai), {});
    byId('ai-endpoint').value = settings.endpoint || '/api/ai-design';
    byId('ai-cli').value = settings.cli || 'codex';
    this.savedModel = settings.model || '';
    this.renderModelOptions([], this.savedModel);
    byId('ai-fallback').checked = settings.fallback === true;
  }

  saveSettings(notify = true) {
    localStorage.setItem(STORAGE.ai, JSON.stringify({
      endpoint: byId('ai-endpoint').value.trim() || '/api/ai-design',
      cli: byId('ai-cli').value,
      model: this.modelValue(),
      fallback: byId('ai-fallback').checked,
    }));
    if (notify) toast('AI 连接设置已保存', 'success');
  }

  selectedContext() {
    if (!model.selected) return null;
    return { target: canvas.describe(model.selected), path: model.elementPath(), html: serializeEditableElement(model.selected) };
  }

  async test() {
    this.saveSettings();
    const button = byId('ai-test');
    const requestedCli = byId('ai-cli').value;
    this.setConnection('checking', '正在验证真实请求', '版本、授权和模型服务都会检查');
    button.disabled = true;
    button.textContent = '验证中…';
    try {
      const response = await apiFetch(byId('ai-endpoint').value.trim() || '/api/ai-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'test',
          cli: requestedCli,
          model: this.modelValue(),
          fallback: byId('ai-fallback').checked,
        }),
      });
      if (!response.ok) throw await this.responseError(response);
      const data = await response.json();
      const switched = data.cli && data.cli !== requestedCli;
      if (data.cli) byId('ai-cli').value = data.cli;
      if (switched) {
        await this.loadModels({ selected: '' });
        this.saveSettings(false);
      }
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
      model: this.modelValue(),
      fallback: byId('ai-fallback').checked,
      stream: true,
    };
    try {
      const response = await apiFetch(byId('ai-endpoint').value.trim() || '/api/ai-design', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
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
      const candidateDocument = new DOMParser().parseFromString(finalHtml, 'text/html');
      if (!candidateDocument.documentElement || !candidateDocument.head || !candidateDocument.body) {
        throw new Error('CLI 返回的候选内容不是完整 HTML 文档');
      }
      if (selected?.path) {
        const candidateElement = resolvePathInDocument(candidateDocument, selected.path);
        if (!candidateElement || FORBIDDEN_SELECT.has(candidateElement.tagName)) {
          throw new Error('候选内容中无法定位原选中组件，当前页面未被修改');
        }
        const currentComponentHtml = serializeEditableElement(model.selected);
        const accepted = await modal.reviewChange(
          `检查${componentInfo(model.selected).name}修改`,
          currentComponentHtml,
          candidateElement.outerHTML,
          htmlSafetyWarnings(currentComponentHtml, candidateElement.outerHTML),
        );
        if (!accepted) {
          progress.textContent = '已取消应用候选修改，当前页面没有变化。';
          return;
        }
        const replacement = prepareEditableFragment(candidateElement.outerHTML, model.doc)
          .find(node => node.nodeType === Node.ELEMENT_NODE);
        if (!replacement) throw new Error('候选组件无法转换为可编辑元素');
        model.selected.replaceWith(replacement);
        model.select(replacement);
        model.checkpoint('AI Design · 组件');
        progress.textContent = '组件修改已应用。可以继续在画布上精修。';
      } else {
        const accepted = await modal.reviewChange(
          '检查整页修改',
          before,
          finalHtml,
          htmlSafetyWarnings(before, finalHtml),
        );
        if (!accepted) {
          progress.textContent = '已取消应用候选页面，当前页面没有变化。';
          return;
        }
        activateVisualWorkspace();
        await canvas.load(finalHtml, { preserveHistory: true });
        const appliedHtml = model.serializeDocument();
        model.sourceText = appliedHtml;
        if (!before) model.resetHistory(appliedHtml);
        else model.pushHistory(appliedHtml, 'AI Design', null);
        progress.textContent = '页面修改已应用。可以继续在画布上精修。';
      }
      const cliChanged = activeCli && activeCli !== byId('ai-cli').value;
      if (activeCli) byId('ai-cli').value = activeCli;
      if (cliChanged) await this.loadModels({ selected: '' });
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
  snippets.unshift({ id: crypto.randomUUID(), name, html: serializeEditableElement(model.selected) });
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
  ['left-rail-button', 'right-rail-button'].forEach((id) => { byId(id).disabled = model.mode !== 'visual'; });
}

function showStudio() {
  byId('welcome').hidden = true;
  byId('studio').hidden = false;
  scheduleCanvasViewportUpdate();
}

async function showWelcome() {
  if (model.dirty && !(await modal.confirm('返回首页', '当前未保存修改仍会保留在自动恢复中。是否返回？'))) return;
  byId('studio').hidden = true;
  byId('welcome').hidden = false;
}

function applyModeLayout(mode) {
  const studio = byId('studio');
  byId('canvas-stage').hidden = mode === 'source';
  byId('source-shell').hidden = mode !== 'source';
  studio.classList.toggle('source-mode', mode === 'source');
  studio.classList.toggle('browse-mode', mode === 'browse');
  pickAll('#mode-switch button').forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
}

function setImmersiveState(active) {
  byId('studio').classList.toggle('preview-mode', active);
  byId('leave-preview').hidden = !active;
  byId('preview-button').classList.toggle('active', active);
}

let modeTransition = Promise.resolve();
let modeGeneration = 0;

function activateVisualWorkspace() {
  modeGeneration += 1;
  setImmersiveState(false);
  canvas.exitBrowse();
  model.mode = 'visual';
  applyModeLayout('visual');
  updateDocumentState();
}

async function commitSourceChanges(generation = modeGeneration) {
  model.sourceText = byId('source-editor').value;
  const sourceChanged = model.sourceText !== model.sourceBaseline;
  model.mode = 'visual';
  const loadedDocument = await canvas.load(model.sourceText, { preserveHistory: true });
  if (!loadedDocument || generation !== modeGeneration) return false;
  if (sourceChanged) {
    model.sourceText = model.serializeDocument();
    model.pushHistory(model.sourceText, '源码编辑', null);
  }
  renderTree();
  return true;
}

function queueModeTransition(task) {
  const run = () => task();
  modeTransition = modeTransition.then(run, run).catch((error) => {
    console.error('Mode transition failed', error);
    activateVisualWorkspace();
    setStatus('模式切换失败 · 已恢复编辑画布');
    toast(error.message || '模式切换失败，已恢复编辑画布', 'error');
  });
  return modeTransition;
}

async function performModeChange(mode, options = {}) {
  const generation = options.generation ?? modeGeneration;
  if (generation !== modeGeneration) return;
  if (!model.doc || !['visual', 'browse', 'source'].includes(mode)) return;
  if (!options.keepImmersive) setImmersiveState(false);
  if (mode === model.mode) {
    if (mode === 'visual') {
      canvas.preview = false;
      canvas.updateOverlay();
    }
    applyModeLayout(mode);
    updateDocumentState();
    return;
  }
  if (model.mode === 'source') {
    const committed = await commitSourceChanges(generation);
    if (!committed || generation !== modeGeneration) return;
  }
  if (model.mode === 'browse') {
    canvas.exitBrowse();
    model.mode = 'visual';
  }

  if (mode === 'source') {
    model.sourceText = model.serializeDocument();
    model.sourceBaseline = model.sourceText;
    byId('source-editor').value = model.sourceText;
    updateSourceStats();
    model.mode = 'source';
    setStatus('源码模式 · 切回编辑或浏览时应用修改');
  } else if (mode === 'browse') {
    model.mode = 'browse';
    canvas.enterBrowse(model.serializeDocument());
    setStatus('浏览模式 · 页面链接、表单和脚本交互已启用');
  } else {
    model.mode = 'visual';
    canvas.preview = false;
    canvas.updateOverlay();
    setStatus('编辑模式 · 点击页面元素打开编辑菜单');
  }
  applyModeLayout(mode);
  updateDocumentState();
}

function setMode(mode) {
  const generation = modeGeneration;
  return queueModeTransition(() => performModeChange(mode, { generation }));
}

function togglePreview(force) {
  const generation = modeGeneration;
  return queueModeTransition(async () => {
    if (generation !== modeGeneration) return;
    if (!model.doc || byId('studio').hidden) return;
    const next = typeof force === 'boolean' ? force : !byId('studio').classList.contains('preview-mode');
    if (next && model.mode !== 'browse') await performModeChange('browse', { keepImmersive: true, generation });
    if (generation !== modeGeneration) return;
    setImmersiveState(next);
  });
}

function exitPreview() { togglePreview(false); }

function externalPreview() {
  const html = model.currentText();
  if (!('BroadcastChannel' in window)) {
    toast('当前浏览器不支持安全的新标签页预览，请使用浏览模式', 'error');
    return;
  }
  const channelId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const channel = new BroadcastChannel(`html-designer-preview-${channelId}`);
  let closed = false;
  const finish = () => {
    if (closed) return;
    closed = true;
    window.clearInterval(retry);
    window.clearTimeout(timeout);
    channel.close();
  };
  channel.onmessage = (event) => {
    if (event.data?.type === 'ready') channel.postMessage({ type: 'render', html });
    if (event.data?.type === 'rendered') finish();
  };
  const retry = window.setInterval(() => channel.postMessage({ type: 'render', html }), 500);
  const timeout = window.setTimeout(finish, 15000);
  window.open(`external-preview.html?channel=${encodeURIComponent(channelId)}`, '_blank', 'noopener');
  toast('已在隔离沙箱中打开预览', 'success');
}

const DEVICE_VIEWPORTS = Object.freeze({
  desktop: { width: 1440, height: 900, label: '桌面' },
  tablet: { width: 820, height: 1180, label: '平板' },
  mobile: { width: 390, height: 844, label: '手机' },
});
let canvasZoom = 1;
let canvasFitMode = true;
let canvasFitFrame = 0;
let canvasPageMode = false;
let canvasPageHeight = 0;
let canvasPageMeasureFrame = 0;

function currentBaseViewport() {
  return DEVICE_VIEWPORTS[byId('canvas-shell')?.dataset.device] || DEVICE_VIEWPORTS.desktop;
}

function currentViewport() {
  const viewport = currentBaseViewport();
  if (canvasPageMode && model.mode === 'visual' && canvasPageHeight > viewport.height) {
    return { ...viewport, height: canvasPageHeight, label: `${viewport.label} · 整页` };
  }
  return viewport;
}

function applyCanvasHeight(height) {
  const pixels = Math.max(currentBaseViewport().height, Math.min(20000, Math.round(Number(height) || 0)));
  byId('canvas-stage')?.style.setProperty('--canvas-height', `${pixels}px`);
  canvasPageHeight = pixels;
}

function scheduleFullPageMeasurement() {
  window.cancelAnimationFrame(canvasPageMeasureFrame);
  canvasPageMeasureFrame = window.requestAnimationFrame(() => {
    if (!canvasPageMode || model.mode !== 'visual' || !model.doc?.documentElement) return;
    const base = currentBaseViewport();
    byId('canvas-stage')?.style.setProperty('--canvas-height', `${base.height}px`);
    canvasPageMeasureFrame = window.requestAnimationFrame(() => {
      const body = model.doc.body;
      const height = Math.max(
        base.height,
        model.doc.documentElement.scrollHeight,
        body?.scrollHeight || 0,
        body?.offsetHeight || 0,
      );
      applyCanvasHeight(height);
      fitCanvas(false);
      updateCanvasInfo();
      canvas.updateOverlay();
    });
  });
}

function toggleCanvasPageMode() {
  canvasPageMode = !canvasPageMode;
  byId('canvas-page-button').classList.toggle('active', canvasPageMode);
  byId('canvas-page-button').setAttribute('aria-pressed', String(canvasPageMode));
  if (canvasPageMode) {
    scheduleFullPageMeasurement();
    setStatus('完整页面画板 · 保持设备宽度并展开页面高度');
  } else {
    canvasPageHeight = 0;
    byId('canvas-stage').style.removeProperty('--canvas-height');
    fitCanvas(false);
    updateCanvasInfo();
    setStatus('设备视口画板 · 使用固定设备宽高');
  }
}

function updateCanvasInfo() {
  const shell = byId('canvas-shell');
  const iframe = shell?.classList.contains('browsing') ? byId('browse-canvas') : byId('design-canvas');
  if (!shell || !iframe) return;
  const device = shell.dataset.device || 'desktop';
  const viewport = currentViewport();
  const icon = pick('use', byId('canvas-info'));
  if (icon) icon.setAttribute('href', `#i-${device === 'desktop' ? 'monitor' : device}`);
  byId('canvas-device-label').textContent = viewport.label;
  byId('canvas-size-label').textContent = `${viewport.width} × ${viewport.height} · ${Math.round(canvasZoom * 100)}%`;
  byId('zoom-fit-button').classList.toggle('active', canvasFitMode);
}

function setCanvasZoom(value, announce = true, keepFitMode = false) {
  if (!keepFitMode) canvasFitMode = false;
  canvasZoom = Math.min(1.5, Math.max(.25, Math.round(Number(value) * 100) / 100));
  document.documentElement.style.setProperty('--canvas-scale', String(canvasZoom));
  document.documentElement.style.setProperty('--canvas-ui-scale', String(1 / canvasZoom));
  byId('zoom-value').textContent = `${Math.round(canvasZoom * 100)}%`;
  if (announce) setStatus(`画布缩放 ${Math.round(canvasZoom * 100)}%`);
  requestAnimationFrame(() => { canvas.updateOverlay(); updateCanvasInfo(); });
}

function fitCanvas(announce = true) {
  const workbench = byId('workbench');
  const viewport = currentViewport();
  if (!workbench || workbench.clientWidth < 1 || workbench.clientHeight < 1) return;
  const availableWidth = Math.max(220, workbench.clientWidth - 48);
  const availableHeight = Math.max(220, workbench.clientHeight - 124);
  const scale = Math.min(1, availableWidth / viewport.width, availableHeight / viewport.height);
  const pageScale = Math.min(1, availableWidth / viewport.width);
  canvasFitMode = true;
  setCanvasZoom(canvasPageMode && model.mode === 'visual' ? pageScale : scale, announce, true);
}

function scheduleCanvasViewportUpdate() {
  window.cancelAnimationFrame(canvasFitFrame);
  canvasFitFrame = window.requestAnimationFrame(() => {
    if (canvasFitMode) fitCanvas(false);
    else {
      canvas.updateOverlay();
      updateCanvasInfo();
    }
  });
}

function setCanvasDevice(device) {
  if (!DEVICE_VIEWPORTS[device]) return;
  byId('canvas-shell').dataset.device = device;
  byId('canvas-stage').dataset.device = device;
  if (canvasPageMode) scheduleFullPageMeasurement();
  else fitCanvas(false);
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
    ['切换到编辑', 'edit', '', () => setMode('visual')],
    ['切换到浏览', 'eye', '', () => setMode('browse')],
    ['切换到源码', 'code', '', () => setMode('source')],
    ['撤销', 'undo', '⌘Z', () => model.travel(-1)],
    ['重做', 'redo', '⇧⌘Z', () => model.travel(1)],
    ['沉浸浏览', 'eye', 'P', () => togglePreview()],
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

let recoverableDraft = null;

function bindActions() {
  byId('action-open').onclick = () => files.open();
  byId('action-import').onclick = () => files.picker.click();
  byId('action-new').onclick = () => files.newDocument();
  byId('action-ai').onclick = async () => { await files.newDocument(); ai.open(); };
  byId('action-restore').onclick = async () => {
    const draft = recoverableDraft || await draftStore.latest();
    if (draft?.html) {
      await files.load(draft.html, draft.name || 'recovered.html', null, null, {
        recovered: true,
        documentId: draft.id,
        savedHtml: draft.savedHtml,
      });
    }
  };
  byId('welcome-theme').onclick = toggleTheme;
  byId('theme-button').onclick = toggleTheme;
  byId('home-button').onclick = showWelcome;
  byId('open-button').onclick = () => files.open();
  byId('import-button').onclick = () => files.picker.click();
  byId('export-button').onclick = () => files.export(model.currentText(), { markSaved: false });
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
  byId('ai-cli').onchange = () => {
    ai.setConnection('idle', '尚未验证', 'CLI 已切换，请重新测试连接');
    ai.loadModels({ refresh: true, selected: '' });
  };
  byId('ai-model').onchange = () => ai.updateCustomModelInput();
  byId('ai-refresh-models').onclick = () => ai.loadModels({ refresh: true });
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
  byId('canvas-page-button').onclick = toggleCanvasPageMode;
  byId('copy-html-button').onclick = () => { if (model.selected) copyText(serializeEditableElement(model.selected), '已复制元素 HTML'); };
  byId('copy-selector-button').onclick = () => { if (model.selected) copyText(cssSelectorPath(), '已复制 CSS 选择器'); };
  byId('summary-edit-button').onclick = () => canvas.runCommand('edit');
  byId('summary-copy-button').onclick = () => { if (model.selected) copyText(serializeEditableElement(model.selected), '已复制元素 HTML'); };
  byId('summary-duplicate-button').onclick = () => canvas.runCommand('duplicate');
  pickAll('#mode-switch button').forEach((button) => { button.onclick = () => setMode(button.dataset.mode); });
  pickAll('.device-button').forEach((button) => {
    button.onclick = () => {
      pickAll('.device-button').forEach((item) => item.classList.toggle('active', item === button));
      setCanvasDevice(button.dataset.device);
      setStatus(`已切换为${button.dataset.device === 'desktop' ? '桌面' : button.dataset.device === 'tablet' ? '平板' : '手机'}画布`);
      window.setTimeout(() => { canvas.updateOverlay(); updateCanvasInfo(); }, 190);
    };
  });
  byId('source-editor').oninput = () => {
    model.sourceText = byId('source-editor').value;
    model.updateDirty(model.sourceText);
    model.scheduleAutosave();
    updateSourceStats();
  };
}

function bindKeyboard() {
  document.addEventListener('keydown', (event) => {
    const command = event.metaKey || event.ctrlKey;
    const field = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable;
    if (event.key === 'Escape' && canvas.moveSession) { event.preventDefault(); canvas.endMove(true); return; }
    if (event.key === 'Escape' && byId('modal-root').childElementCount && !pick('.command-card', byId('modal-root'))) { event.preventDefault(); modal.close(); return; }
    if (event.key === 'Escape' && !byId('ai-drawer').hidden) { event.preventDefault(); ai.close(); return; }
    if (command && event.key.toLowerCase() === 'k') { event.preventDefault(); openCommandPalette(); return; }
    if (command && event.key.toLowerCase() === 'o') { event.preventDefault(); files.open(); return; }
    if (command && event.key.toLowerCase() === 's') { event.preventDefault(); files.save(); return; }
    if (field) return;
    if (command && event.key.toLowerCase() === 'z') { event.preventDefault(); model.travel(event.shiftKey ? 1 : -1); return; }
    if (command && event.key.toLowerCase() === 'd') { event.preventDefault(); canvas.runCommand('duplicate'); return; }
    if (!command && !event.altKey && !event.shiftKey && /^Arrow(Left|Right|Up|Down)$/.test(event.key) && model.selected) {
      event.preventDefault();
      const offsets = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      canvas.nudgeSelected(...offsets[event.key]);
      return;
    }
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
  if (model.selected && model.mode === 'visual') canvas.showSelectionMenu();
  canvas.updateOverlay();
  renderTree();
  renderInspectors();
  byId('save-snippet-button').disabled = !model.selected;
  updateDocumentState();
  if (model.selected?.isConnected) {
    const rect = model.selected.getBoundingClientRect();
    const info = componentInfo(model.selected);
    setStatus(`${info.name} · ${canvas.describe(model.selected)} · ${Math.round(rect.width)} × ${Math.round(rect.height)}`);
  } else setStatus('未选择元素');
  ai.updateTarget();
});
model.addEventListener('document', () => { renderTree(); renderInspectors(); });
model.addEventListener('dirty', updateDocumentState);
model.addEventListener('history', () => {
  updateDocumentState();
  if (model.history[model.cursor]?.label) setStatus(model.history[model.cursor].label);
});

async function init() {
  applyTheme(localStorage.getItem(STORAGE.theme) || 'dark');
  applyModeLayout('visual');
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
  recoverableDraft = await draftStore.latest();
  if (recoverableDraft?.html) {
    byId('action-restore').hidden = false;
    byId('restore-meta').textContent = `${recoverableDraft.name || 'untitled.html'} · ${new Date(recoverableDraft.savedAt).toLocaleString()}`;
  }
}

init().catch((error) => {
  console.error('HTML Designer initialization failed', error);
  toast('初始化失败，请刷新页面重试', 'error');
});
