const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { URL } = require('url');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const defaultCli = (process.env.HTML_DESIGNER_AGENT_CLI || 'codex').toLowerCase();
const defaultModel = process.env.HTML_DESIGNER_AGENT_MODEL || '';
const timeoutMs = Number(process.env.HTML_DESIGNER_AGENT_TIMEOUT_MS || 180000);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/api/ai-design') {
      await handleCliBridge(req, res);
      return;
    }
    serveStatic(url.pathname, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Internal server error' });
  }
});

server.listen(port, () => {
  console.log(`HTML Designer running at http://localhost:${port}`);
  console.log(`AI Design local CLI bridge: /api/ai-design -> ${defaultCli}`);
});

async function handleCliBridge(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const requestBody = await readJson(req);
  const cli = normalizeCli(requestBody.cli || requestBody.model || defaultCli);
  if (requestBody.mode === 'test') {
    const version = await getCliVersion(cli);
    sendJson(res, 200, {
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CLI OK</title></head><body><p>${escapeHtml(version)}</p></body></html>`,
      output_text: version,
      cli,
    });
    return;
  }
  const prompt = buildPrompt(requestBody);
  if (requestBody.stream) {
    await runLocalCliStream(cli, prompt, requestBody.model || defaultModel, req, res);
    return;
  }
  const result = await runLocalCli(cli, prompt, requestBody.model || defaultModel);
  sendJson(res, 200, {
    html: result,
    output_text: result,
    cli,
  });
}

function runLocalCliStream(cli, prompt, model, req, res) {
  const command = cli === 'claude' ? 'claude' : 'codex';
  const args = cli === 'claude'
    ? buildClaudeArgs(model)
    : buildCodexArgs(model);

  setCorsHeaders(res);
  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      shell: process.platform === 'win32',
      windowsHide: true,
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let aborted = false;
    let lastHtml = '';

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };

    const timer = setTimeout(() => {
      if (settled) return;
      aborted = true;
      writeStreamEvent(res, 'error', { error: `${command} timed out after ${timeoutMs}ms` });
      terminateChild(child);
    }, timeoutMs);

    res.on('close', () => {
      if (settled || res.writableEnded) return;
      aborted = true;
      terminateChild(child);
    });

    writeStreamEvent(res, 'start', { cli, command, pid: child.pid || null });

    child.stdout.on('data', chunk => {
      const text = chunk.toString();
      stdout += text;
      writeStreamEvent(res, 'stdout', { text });
      const html = extractHtmlDocument(extractFinalText(stdout) || stdout);
      if (html && html !== lastHtml) {
        lastHtml = html;
        writeStreamEvent(res, 'html', { html });
      }
    });
    child.stderr.on('data', chunk => {
      const text = chunk.toString();
      stderr += text;
      writeStreamEvent(res, 'stderr', { text });
    });
    child.on('error', error => {
      if (!aborted) writeStreamEvent(res, 'error', { error: `Failed to start ${command}: ${error.message}` });
      if (!res.writableEnded) res.end();
      finish();
    });
    child.on('close', code => {
      if (settled) return;
      if (aborted) {
        writeStreamEvent(res, 'aborted', { cli });
        if (!res.writableEnded) res.end();
        finish();
        return;
      }
      if (code !== 0) {
        writeStreamEvent(res, 'error', {
          error: `${command} exited with code ${code}: ${(stderr || stdout).slice(0, 2000)}`,
          cli,
        });
        if (!res.writableEnded) res.end();
        finish();
        return;
      }
      const output = (extractFinalText(stdout) || stdout).trim();
      const html = extractHtmlDocument(output) || lastHtml;
      writeStreamEvent(res, 'done', { html, output_text: output, cli });
      if (!res.writableEnded) res.end();
      finish();
    });
    child.stdin.end(prompt);
  });
}

function writeStreamEvent(res, type, payload = {}) {
  if (res.writableEnded || res.destroyed) return;
  res.write(`${JSON.stringify({ type, ...payload })}\n`);
}

function terminateChild(child) {
  if (!child || child.killed) return;
  try { child.kill('SIGTERM'); } catch (_) {}
  if (process.platform === 'win32' && child.pid) {
    try {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
    } catch (_) {}
  }
}

function normalizeCli(value) {
  const cli = String(value || '').trim().toLowerCase();
  if (cli === 'claude' || cli === 'claudecode' || cli === 'claude-code') return 'claude';
  return 'codex';
}

function runLocalCli(cli, prompt, model) {
  const command = cli === 'claude' ? 'claude' : 'codex';
  const args = cli === 'claude'
    ? buildClaudeArgs(model)
    : buildCodexArgs(model);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      shell: process.platform === 'win32',
      windowsHide: true,
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      child.kill('SIGTERM');
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.on('error', error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Failed to start ${command}: ${error.message}`));
    });
    child.on('close', code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}: ${stderr.slice(0, 2000) || stdout.slice(0, 2000)}`));
        return;
      }
      const output = extractFinalText(stdout) || stdout;
      resolve(output.trim());
    });
    child.stdin.end(prompt);
  });
}

function buildCodexArgs(model) {
  const args = [
    '--ask-for-approval', 'never',
    '--sandbox', 'read-only',
    'exec',
    '--skip-git-repo-check',
    '--ephemeral',
    '--color', 'never',
  ];
  if (model && !isCliName(model)) args.push('--model', model);
  args.push('-');
  return args;
}

function buildClaudeArgs(model) {
  const args = [
    '--print',
    '--output-format', 'text',
    '--permission-mode', 'dontAsk',
  ];
  if (model && !isCliName(model)) args.push('--model', model);
  return args;
}

function getCliVersion(cli) {
  const command = cli === 'claude' ? 'claude' : 'codex';
  return new Promise((resolve, reject) => {
    const child = spawn(command, ['--version'], {
      cwd: root,
      shell: process.platform === 'win32',
      windowsHide: true,
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.on('error', error => reject(new Error(`Failed to start ${command}: ${error.message}`)));
    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`${command} --version failed with code ${code}: ${stderr || stdout}`));
        return;
      }
      resolve(`${command} ${String(stdout || stderr).trim()}`.trim());
    });
  });
}

function isCliName(value) {
  return /^(codex|claude|claudecode|claude-code)$/i.test(String(value || '').trim());
}

function extractFinalText(stdout) {
  const lines = String(stdout || '').split(/\r?\n/);
  const jsonLines = lines.filter(line => line.trim().startsWith('{'));
  if (!jsonLines.length) return '';
  const messages = [];
  for (const line of jsonLines) {
    try {
      const event = JSON.parse(line);
      const text = event.message || event.text || event.content || event.output || event.final_message;
      if (typeof text === 'string') messages.push(text);
      if (event.type === 'message' && event.item && typeof event.item.content === 'string') messages.push(event.item.content);
    } catch (_) {}
  }
  return messages[messages.length - 1] || '';
}

function extractHtmlDocument(value) {
  if (typeof value !== 'string') return '';
  let html = value.trim()
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const docMatch = html.match(/<!doctype html[\s\S]*$/i);
  if (docMatch) html = docMatch[0].trim();
  const htmlMatch = html.match(/<html[\s\S]*<\/html>/i);
  if (htmlMatch) html = `<!DOCTYPE html>\n${htmlMatch[0].trim()}`;
  if (!/<html[\s>]/i.test(html) && /<body[\s>]/i.test(html)) html = `<!DOCTYPE html>\n<html><head><meta charset="UTF-8"></head>${html}</html>`;
  if (!/<html[\s>]/i.test(html) && /<\w+[\s\S]*>/i.test(html)) html = `<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><title>AI Design</title></head><body>${html}</body></html>`;
  return /<html[\s>]/i.test(html) ? html : '';
}

function buildPrompt(requestBody) {
  const context = {
    mode: requestBody.mode,
    design_brief: requestBody.brief,
    current_html: requestBody.currentHtml,
    annotations: requestBody.annotations || [],
    selected_element: requestBody.selectedElement || null,
    locale: requestBody.locale || 'zh',
  };

  return [
    'You are the local AI Design executor for HTML Designer.',
    'Create or revise an HTML document from the provided design context.',
    'The user instruction may come from a left-side AI Design chat. Treat it as the latest design request for the current HTML.',
    'First write a concise visible section titled "AI Design Plan" with 3-5 bullets explaining the user-facing design approach and concrete areas you will change. Do not include implementation code in this plan.',
    'After the plan, return exactly one complete, valid HTML document. Do not include Markdown fences, diffs, or file paths.',
    'Use real semantic HTML elements and native components where appropriate, including table, form, button, nav, section, article, img, dialog, details, and list elements. Never fake tables by arranging text boxes.',
    'Keep CSS self-contained inside the returned HTML document. Avoid external assets unless explicitly requested.',
    'Preserve existing content and intent when current_html is provided. Apply every annotation as a concrete design change.',
    '',
    'Design context JSON:',
    JSON.stringify(context, null, 2),
  ].join('\n');
}

function serveStatic(pathname, res) {
  const cleanPath = decodeURIComponent(pathname).replace(/\\/g, '/');
  const relative = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
  const filePath = path.resolve(root, relative);
  if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    sendText(res, 403, 'Forbidden');
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, 404, 'Not found');
      return;
    }
    const type = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2_000_000) {
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (_) { reject(new Error('Invalid JSON request body')); }
    });
    req.on('error', reject);
  });
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function sendJson(res, status, value) {
  setCorsHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}

function sendText(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(value);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
