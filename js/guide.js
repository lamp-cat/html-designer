const content = document.querySelector('#guide-content');
const toc = document.querySelector('#guide-toc');
const search = document.querySelector('#guide-search');
const sidebar = document.querySelector('#guide-sidebar');
const scrim = document.querySelector('#guide-sidebar-scrim');
const menuButton = document.querySelector('#guide-menu');
const backtop = document.querySelector('#guide-backtop');
const toast = document.querySelector('#guide-toast');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function safeHref(value) {
  const href = String(value || '').trim();
  return /^(?:#|https?:|mailto:|tel:|\.\.?\/|[\w-]+(?:[/.#?]|$))/i.test(href) ? href : '#';
}

function inlineMarkdown(value) {
  let source = String(value || '');
  const tokens = [];
  const stash = (html) => {
    const key = `%%GUIDE_TOKEN_${tokens.length}%%`;
    tokens.push(html);
    return key;
  };

  source = source.replace(/`([^`]+)`/g, (_, code) => stash(`<code>${escapeHtml(code)}</code>`));
  source = source.replace(/\[([^\]]+)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, rawHref) => {
    const href = safeHref(rawHref);
    const external = /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '';
    return stash(`<a href="${escapeHtml(href)}"${external}>${escapeHtml(label)}</a>`);
  });
  source = escapeHtml(source)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/(^|\s)\*([^*]+)\*(?=\s|[，。！？、,.!?]|$)/g, '$1<em>$2</em>');
  tokens.forEach((html, index) => { source = source.replace(`%%GUIDE_TOKEN_${index}%%`, html); });
  return source;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function tableCells(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
}

function isTableDivider(line) {
  const cells = tableCells(line);
  return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

function isBlockStart(lines, index) {
  const line = lines[index] || '';
  if (!line.trim()) return true;
  if (/^#{1,6}\s+/.test(line) || /^```/.test(line) || /^>\s?/.test(line)) return true;
  if (/^\s*(?:[-+*]|\d+\.)\s+/.test(line) || /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) return true;
  return line.trim().startsWith('|') && isTableDivider(lines[index + 1] || '');
}

function renderMarkdown(markdown) {
  const originalLines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const lines = [];
  let skippingSourceToc = false;
  for (const line of originalLines) {
    if (/^##\s+目录\s*$/.test(line)) { skippingSourceToc = true; continue; }
    if (skippingSourceToc && /^##\s+/.test(line)) skippingSourceToc = false;
    if (!skippingSourceToc && !/^#\s+/.test(line)) lines.push(line);
  }

  const headings = [];
  const usedSlugs = new Map();
  let html = '';

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    const fence = line.match(/^```\s*([\w-]+)?\s*$/);
    if (fence) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) codeLines.push(lines[index++]);
      if (index < lines.length) index += 1;
      const language = fence[1] || 'text';
      html += `<div class="guide-code"><div class="guide-code-head"><span>${escapeHtml(language)}</span><button class="guide-copy" type="button">复制</button></div><pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre></div>`;
      continue;
    }

    const heading = line.match(/^(#{2,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].replace(/\s+#+\s*$/, '').trim();
      const baseSlug = slugify(text) || `section-${headings.length + 1}`;
      const count = usedSlugs.get(baseSlug) || 0;
      usedSlugs.set(baseSlug, count + 1);
      const id = count ? `${baseSlug}-${count + 1}` : baseSlug;
      const chapter = level === 2
        ? headings.filter(item => item.level === 2).length + 1
        : headings.filter(item => item.level === 2).length;
      headings.push({ id, level, text, chapter });
      const sectionNumber = level === 2 ? `<span class="heading-number">SECTION ${String(chapter).padStart(2, '0')}</span>` : '';
      html += `<h${level} id="${id}">${sectionNumber}${inlineMarkdown(text)}<a class="guide-heading-anchor" href="#${id}" aria-label="链接到本节">#</a></h${level}>`;
      index += 1;
      continue;
    }

    if (line.trim().startsWith('|') && isTableDivider(lines[index + 1] || '')) {
      const headers = tableCells(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith('|')) rows.push(tableCells(lines[index++]));
      html += `<div class="guide-table-wrap"><table><thead><tr>${headers.map(cell => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((_, cellIndex) => `<td>${inlineMarkdown(row[cellIndex] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      continue;
    }

    const listItem = line.match(/^\s*([-+*]|(\d+)\.)\s+(.+)$/);
    if (listItem) {
      const ordered = Boolean(listItem[2]);
      const start = ordered ? Number(listItem[2]) : 1;
      const items = [];
      while (index < lines.length) {
        const candidate = lines[index].match(/^\s*([-+*]|(\d+)\.)\s+(.+)$/);
        if (candidate && Boolean(candidate[2]) === ordered) {
          items.push(candidate[3]);
          index += 1;
          continue;
        }
        if (!lines[index].trim()) {
          const next = lines[index + 1]?.match(/^\s*([-+*]|(\d+)\.)\s+(.+)$/);
          if (next && Boolean(next[2]) === ordered) { index += 1; continue; }
        }
        break;
      }
      const tag = ordered ? 'ol' : 'ul';
      const startAttribute = ordered && start !== 1 ? ` start="${start}"` : '';
      html += `<${tag}${startAttribute}>${items.map(item => `<li>${inlineMarkdown(item)}</li>`).join('')}</${tag}>`;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ''));
      html += `<blockquote><p>${inlineMarkdown(quote.join(' '))}</p></blockquote>`;
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      html += '<hr>';
      index += 1;
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && !isBlockStart(lines, index)) paragraph.push(lines[index++].trim());
    html += `<p>${inlineMarkdown(paragraph.join(' '))}</p>`;
  }

  return { html, headings };
}

function renderToc(headings, query = '') {
  const normalized = query.trim().toLocaleLowerCase('zh-CN');
  const visible = headings.filter(heading => heading.level <= 3 && (!normalized || heading.text.toLocaleLowerCase('zh-CN').includes(normalized)));
  if (!visible.length) {
    toc.innerHTML = `<p class="guide-toc-empty">没有匹配的章节。你也可以使用浏览器的页面查找搜索正文。</p>`;
    return;
  }
  toc.innerHTML = visible.map((heading) => {
    return `<a href="#${heading.id}" data-heading="${heading.id}" data-level="${heading.level}" data-number="${heading.level === 2 ? String(heading.chapter).padStart(2, '0') : ''}">${escapeHtml(heading.text)}</a>`;
  }).join('');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  scrim.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('visible'), 1600);
}

function bindGuide(headings) {
  renderToc(headings);
  const topHeadings = headings.filter(item => item.level === 2);
  document.querySelector('#guide-section-count').textContent = topHeadings.length;
  document.querySelector('#guide-chapter-total').textContent = topHeadings.length;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!visible) return;
    document.querySelectorAll('.guide-toc a').forEach(link => link.classList.toggle('active', link.dataset.heading === visible.target.id));
  }, { rootMargin: '-88px 0px -72% 0px', threshold: 0 });
  headings.forEach(heading => document.getElementById(heading.id) && observer.observe(document.getElementById(heading.id)));

  search.addEventListener('input', () => renderToc(headings, search.value));
  toc.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeSidebar();
  });

  if (location.hash) window.requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView());
}

content.addEventListener('click', async (event) => {
  const copyButton = event.target.closest('.guide-copy');
  if (copyButton) {
    const code = copyButton.closest('.guide-code')?.querySelector('code')?.textContent || '';
    await navigator.clipboard.writeText(code);
    copyButton.textContent = '已复制';
    showToast('代码已复制');
    window.setTimeout(() => { copyButton.textContent = '复制'; }, 1200);
  }
});

menuButton.addEventListener('click', () => {
  const open = !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
  scrim.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
});
scrim.addEventListener('click', closeSidebar);
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (window.innerWidth <= 900) {
      sidebar.classList.add('open');
      scrim.hidden = false;
      menuButton.setAttribute('aria-expanded', 'true');
    }
    search.focus();
  }
  if (event.key === 'Escape') closeSidebar();
});

document.querySelector('#guide-theme').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('html-designer-guide-theme', next); } catch (_) {}
});

window.addEventListener('scroll', () => backtop.classList.toggle('visible', window.scrollY > 700), { passive: true });
backtop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

try {
  const response = await fetch('HTML_DESIGNER_USER_GUIDE.md', { cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const markdown = await response.text();
  const rendered = renderMarkdown(markdown);
  content.innerHTML = rendered.html;
  document.querySelector('#guide-reading-time').textContent = Math.max(1, Math.ceil(markdown.replace(/\s/g, '').length / 650));
  bindGuide(rendered.headings);
} catch (error) {
  console.error(error);
  content.innerHTML = `<section class="guide-error"><h2>指南载入失败</h2><p>未能读取项目中的 Markdown 文件。请确认当前页面通过 HTML Designer 本地服务或静态站点打开。</p><a href="HTML_DESIGNER_USER_GUIDE.md" download>下载原始指南</a></section>`;
  toc.innerHTML = '<p class="guide-toc-empty">目录暂时不可用。</p>';
}
