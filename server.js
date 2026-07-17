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
const probeTimeoutMs = Number(process.env.HTML_DESIGNER_AGENT_PROBE_TIMEOUT_MS || 60000);
const outputLimit = Number(process.env.HTML_DESIGNER_AGENT_OUTPUT_LIMIT || 8_000_000);
const cliLabels = { codex: 'Codex CLI', claude: 'Claude Code CLI' };
const modelCatalogTtlMs = Number(process.env.HTML_DESIGNER_MODEL_CATALOG_TTL_MS || 300000);
const modelCatalogCache = new Map();

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
    if (url.pathname === '/api/ai-models') {
      await handleModelCatalog(req, res, url);
      return;
    }
    serveStatic(url.pathname, res);
  } catch (error) {
    if (!res.headersSent) sendJson(res, error.statusCode || 500, serializeCliError(error));
    else if (!res.writableEnded) res.end();
  }
});

if (require.main === module) {
  server.listen(port, () => {
    console.log(`HTML Designer running at http://localhost:${port}`);
    console.log(`AI Design local CLI bridge: /api/ai-design -> ${defaultCli}`);
  });
}

async function handleModelCatalog(req, res, url) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const cli = normalizeCli(url.searchParams.get('cli') || defaultCli);
  const refresh = /^(1|true|yes)$/i.test(url.searchParams.get('refresh') || '');
  const catalog = await discoverCliModels(cli, { refresh });
  sendJson(res, 200, catalog);
}

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
  const allowFallback = requestBody.fallback !== false;
  if (requestBody.mode === 'test') {
    const result = await testCliConnection(cli, requestBody.model || '', allowFallback);
    sendJson(res, 200, {
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CLI OK</title></head><body><p>${escapeHtml(result.message)}</p></body></html>`,
      output_text: result.message,
      requested_cli: cli,
      cli: result.cli,
      fallback: result.cli !== cli,
      latency_ms: result.latencyMs,
      attempts: result.attempts,
    });
    return;
  }
  const prompt = buildPrompt(requestBody);
  if (requestBody.stream) {
    await runLocalCliStream(cli, prompt, requestBody.model || defaultModel, allowFallback, req, res);
    return;
  }
  const result = await runLocalCliWithFallback(cli, prompt, requestBody.model || defaultModel, allowFallback);
  sendJson(res, 200, {
    html: result.output,
    output_text: result.output,
    requested_cli: cli,
    cli: result.cli,
    fallback: result.cli !== cli,
    attempts: result.attempts,
  });
}

async function runLocalCliStream(cli, prompt, model, allowFallback, req, res) {
  setCorsHeaders(res);
  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const abortController = new AbortController();
  const attempts = [];
  const candidates = cliCandidates(cli, allowFallback);
  res.on('close', () => {
    if (!res.writableEnded) abortController.abort();
  });

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const candidateModel = candidate === cli ? model : '';
    let streamedOutput = '';
    let lastHtml = '';
    writeStreamEvent(res, 'status', { text: `正在连接 ${cliLabels[candidate]}…`, cli: candidate });
    try {
      const result = await executeLocalCli(candidate, prompt, candidateModel, {
        signal: abortController.signal,
        onSpawn: child => writeStreamEvent(res, 'start', { cli: candidate, command: resultCommand(candidate), pid: child.pid || null, attempt: index + 1 }),
        onStdout: text => {
          streamedOutput = appendOutput(streamedOutput, text);
          writeStreamEvent(res, 'stdout', { text, cli: candidate });
          const html = extractHtmlDocument(extractFinalText(streamedOutput) || streamedOutput);
          if (html && html !== lastHtml) {
            lastHtml = html;
            writeStreamEvent(res, 'html', { html, cli: candidate });
          }
        },
      });
      const html = extractHtmlDocument(result.output) || lastHtml;
      attempts.push({ cli: candidate, ok: true });
      writeStreamEvent(res, 'done', {
        html,
        output_text: result.output,
        requested_cli: cli,
        cli: candidate,
        fallback: candidate !== cli,
        attempts,
      });
      if (!res.writableEnded) res.end();
      return;
    } catch (error) {
      if (abortController.signal.aborted || error.code === 'CLI_ABORTED') {
        writeStreamEvent(res, 'aborted', { cli: candidate });
        if (!res.writableEnded) res.end();
        return;
      }
      const diagnostic = diagnoseCliError(error, candidate);
      attempts.push({ cli: candidate, ok: false, code: diagnostic.code, error: diagnostic.message, hint: diagnostic.hint });
      const next = candidates[index + 1];
      if (next) {
        writeStreamEvent(res, 'fallback', {
          from: candidate,
          to: next,
          error: diagnostic.message,
          hint: diagnostic.hint,
          text: `${cliLabels[candidate]} 不可用，正在切换到 ${cliLabels[next]}…`,
        });
        continue;
      }
      writeStreamEvent(res, 'error', { ...diagnostic, cli: candidate, attempts });
      if (!res.writableEnded) res.end();
      return;
    }
  }
}

function writeStreamEvent(res, type, payload = {}) {
  if (res.writableEnded || res.destroyed) return;
  res.write(`${JSON.stringify({ type, ...payload })}\n`);
}

function terminateChild(child) {
  if (!child || child.exitCode !== null) return;
  try { child.kill('SIGTERM'); } catch (_) {}
  if (process.platform === 'win32' && child.pid) {
    try {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
    } catch (_) {}
    return;
  }
  const forceTimer = setTimeout(() => {
    if (child.exitCode === null) {
      try { child.kill('SIGKILL'); } catch (_) {}
    }
  }, 1500);
  forceTimer.unref?.();
}

function runCommandCapture(command, args, options = {}) {
  const limitMs = Number(options.timeoutMs || probeTimeoutMs);
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
      if (settled) return;
      settled = true;
      terminateChild(child);
      const error = new Error(`${command} timed out after ${limitMs}ms`);
      error.code = 'CLI_TIMEOUT';
      reject(error);
    }, limitMs);

    const collect = (current, chunk) => appendOutput(current, chunk.toString());
    child.stdout.on('data', chunk => {
      if (settled) return;
      try { stdout = collect(stdout, chunk); }
      catch (error) {
        settled = true;
        clearTimeout(timer);
        terminateChild(child);
        reject(error);
      }
    });
    child.stderr.on('data', chunk => {
      if (settled) return;
      try { stderr = collect(stderr, chunk); }
      catch (error) {
        settled = true;
        clearTimeout(timer);
        terminateChild(child);
        reject(error);
      }
    });
    child.on('error', cause => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const error = new Error(`Failed to start ${command}: ${cause.message}`);
      error.code = cause.code === 'ENOENT' ? 'CLI_NOT_FOUND' : 'CLI_START_FAILED';
      reject(error);
    });
    child.on('close', code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        const detail = stripAnsi(stderr.trim() || stdout.trim()).slice(-4000);
        const error = new Error(`${command} exited with code ${code}${detail ? `: ${detail}` : ''}`);
        error.code = 'CLI_EXIT';
        error.exitCode = code;
        error.detail = detail;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function validModelId(value) {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= 200
    && /^[a-z0-9][a-z0-9._:/-]*$/i.test(value);
}

function parseCodexModelCatalog(output) {
  const clean = stripAnsi(output);
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Codex CLI did not return a JSON model catalog');
  const data = JSON.parse(clean.slice(start, end + 1));
  const models = Array.isArray(data.models) ? data.models : [];
  return models
    .filter(item => validModelId(item?.slug) && item.visibility !== 'hide' && item.supported_in_api !== false)
    .sort((a, b) => Number(a.priority ?? 9999) - Number(b.priority ?? 9999))
    .map(item => ({
      id: item.slug,
      name: item.display_name || item.slug,
      description: item.description || '',
      source: 'cli',
    }));
}

function parseClaudeModelHelp(output) {
  const clean = stripAnsi(output);
  const section = clean.match(/--model <model>([\s\S]*?)(?=\n\s{2}(?:--|-\w,)|\nCommands:|$)/i)?.[1] || '';
  const values = [];
  for (const match of section.matchAll(/['"]([^'"]+)['"]/g)) {
    if (validModelId(match[1])) values.push(match[1]);
  }
  for (const match of section.matchAll(/\bclaude-[a-z0-9][a-z0-9.-]*\b/gi)) values.push(match[0]);
  return [...new Set(values)];
}

function extractConfiguredClaudeModels(settingsList = []) {
  const values = new Set();
  const modelKeys = [
    ['ANTHROPIC_MODEL', ''],
    ['ANTHROPIC_DEFAULT_OPUS_MODEL', 'opus'],
    ['ANTHROPIC_DEFAULT_SONNET_MODEL', 'sonnet'],
    ['ANTHROPIC_DEFAULT_HAIKU_MODEL', 'haiku'],
  ];
  for (const settings of settingsList) {
    if (!settings || typeof settings !== 'object') continue;
    if (validModelId(settings.model)) values.add(settings.model);
    for (const [key, alias] of modelKeys) {
      const value = settings.env?.[key] ?? settings[key];
      if (validModelId(value)) values.add(value);
      if (alias && validModelId(value)) values.add(alias);
    }
  }
  return [...values];
}

function readClaudeModelSettings() {
  const configRoot = process.env.CLAUDE_CONFIG_DIR || path.join(process.env.HOME || '', '.claude');
  const paths = [...new Set([
    path.join(configRoot, 'settings.json'),
    path.join(configRoot, 'settings.local.json'),
    path.join(root, '.claude', 'settings.json'),
    path.join(root, '.claude', 'settings.local.json'),
  ])];
  const settings = [];
  for (const filePath of paths) {
    try { settings.push(JSON.parse(fs.readFileSync(filePath, 'utf8'))); }
    catch (_) {}
  }
  settings.push({ env: Object.fromEntries([
    'ANTHROPIC_MODEL',
    'ANTHROPIC_DEFAULT_OPUS_MODEL',
    'ANTHROPIC_DEFAULT_SONNET_MODEL',
    'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  ].map(key => [key, process.env[key]])) });
  return extractConfiguredClaudeModels(settings);
}

async function discoverCliModels(cli, options = {}) {
  const normalized = normalizeCli(cli);
  const cached = modelCatalogCache.get(normalized);
  if (!options.refresh && cached && Date.now() - cached.cachedAt < modelCatalogTtlMs) {
    return { ...cached.value, cached: true };
  }

  let value;
  try {
    if (normalized === 'codex') {
      const [{ stdout }, version] = await Promise.all([
        runCommandCapture('codex', ['debug', 'models']),
        getCliVersion('codex'),
      ]);
      const models = parseCodexModelCatalog(stdout);
      if (!models.length) throw new Error('Codex CLI model catalog is empty');
      value = {
        cli: normalized,
        version,
        models,
        source: 'cli-catalog',
        complete: true,
        warning: '',
      };
    } else {
      const [{ stdout }, version] = await Promise.all([
        runCommandCapture('claude', ['--help']),
        getCliVersion('claude'),
      ]);
      const configured = readClaudeModelSettings();
      const aliases = parseClaudeModelHelp(stdout);
      const configuredSet = new Set(configured);
      const ids = [...new Set([...configured, ...aliases])];
      const models = ids.map(id => ({
        id,
        name: configuredSet.has(id) ? `${id}（本机配置）` : `${id}（CLI 别名）`,
        description: configuredSet.has(id) ? '来自 Claude Code 本机模型配置' : '由当前 Claude Code CLI 公布',
        source: configuredSet.has(id) ? 'config' : 'cli',
      }));
      if (!models.length) throw new Error('Claude Code CLI did not expose any model aliases or configured models');
      value = {
        cli: normalized,
        version,
        models,
        source: 'cli-help-and-settings',
        complete: false,
        warning: 'Claude Code CLI 未提供完整模型目录命令；已读取当前 CLI 别名和本机配置，也可手动输入模型 ID。',
      };
    }
  } catch (error) {
    error.cli = normalized;
    error.statusCode = 502;
    error.code ||= 'MODEL_CATALOG_FAILED';
    throw error;
  }

  const result = { ...value, cached: false, fetched_at: new Date().toISOString() };
  modelCatalogCache.set(normalized, { cachedAt: Date.now(), value: result });
  return result;
}

function normalizeCli(value) {
  const cli = String(value || '').trim().toLowerCase();
  if (cli === 'claude' || cli === 'claudecode' || cli === 'claude-code') return 'claude';
  return 'codex';
}

function resultCommand(cli) {
  return cli === 'claude' ? 'claude' : 'codex';
}

function cliCandidates(cli, allowFallback = true) {
  const primary = normalizeCli(cli);
  return allowFallback ? [primary, primary === 'claude' ? 'codex' : 'claude'] : [primary];
}

function appendOutput(current, chunk) {
  const next = current + String(chunk || '');
  if (next.length > outputLimit) {
    const error = new Error(`CLI output exceeded ${outputLimit} characters`);
    error.code = 'CLI_OUTPUT_LIMIT';
    throw error;
  }
  return next;
}

function executeLocalCli(cli, prompt, model, options = {}) {
  const command = resultCommand(cli);
  const args = cli === 'claude'
    ? buildClaudeArgs(model)
    : buildCodexArgs(model);
  const limitMs = Number(options.timeoutMs || timeoutMs);

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
    let timer;

    const cleanup = () => {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onAbort);
    };

    const fail = (error, terminate = true) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (terminate) terminateChild(child);
      reject(error);
    };

    const onAbort = () => {
      const error = new Error(`${cliLabels[cli]} request was aborted`);
      error.code = 'CLI_ABORTED';
      error.cli = cli;
      fail(error);
    };

    try { options.onSpawn?.(child); }
    catch (error) { return fail(error); }
    if (options.signal?.aborted) return onAbort();
    options.signal?.addEventListener('abort', onAbort, { once: true });

    timer = setTimeout(() => {
      const error = new Error(`${command} timed out after ${limitMs}ms`);
      error.code = 'CLI_TIMEOUT';
      error.cli = cli;
      fail(error);
    }, limitMs);

    child.stdout.on('data', chunk => {
      if (settled) return;
      const text = chunk.toString();
      try {
        stdout = appendOutput(stdout, text);
        options.onStdout?.(text);
      } catch (error) { fail(error); }
    });
    child.stderr.on('data', chunk => {
      if (settled) return;
      const text = chunk.toString();
      try {
        stderr = appendOutput(stderr, text);
        options.onStderr?.(text);
      } catch (error) { fail(error); }
    });
    child.on('error', error => {
      const wrapped = new Error(`Failed to start ${command}: ${error.message}`);
      wrapped.code = error.code === 'ENOENT' ? 'CLI_NOT_FOUND' : 'CLI_START_FAILED';
      wrapped.cli = cli;
      wrapped.cause = error;
      fail(wrapped, false);
    });
    child.on('close', code => {
      if (settled) return;
      settled = true;
      cleanup();
      if (code !== 0) {
        const detail = stripAnsi(stderr.trim() || stdout.trim()).slice(-4000);
        const error = new Error(`${command} exited with code ${code}${detail ? `: ${detail}` : ''}`);
        error.code = 'CLI_EXIT';
        error.cli = cli;
        error.exitCode = code;
        error.detail = detail;
        reject(error);
        return;
      }
      const output = (extractFinalText(stdout) || stdout).trim();
      resolve({ cli, command, output, stdout, stderr, exitCode: code });
    });
    child.stdin.on('error', error => {
      if (!settled && error.code !== 'EPIPE') fail(error);
    });
    child.stdin.end(prompt);
  });
}

async function runLocalCli(cli, prompt, model, options = {}) {
  const result = await executeLocalCli(cli, prompt, model, options);
  return result.output;
}

async function runLocalCliWithFallback(cli, prompt, model, allowFallback = true, options = {}) {
  const primary = normalizeCli(cli);
  const attempts = [];
  for (const candidate of cliCandidates(primary, allowFallback)) {
    try {
      const result = await executeLocalCli(candidate, prompt, candidate === primary ? model : '', options);
      return { ...result, attempts: [...attempts, { cli: candidate, ok: true }] };
    } catch (error) {
      if (error.code === 'CLI_ABORTED') throw error;
      const diagnostic = diagnoseCliError(error, candidate);
      attempts.push({ cli: candidate, ok: false, code: diagnostic.code, error: diagnostic.message, hint: diagnostic.hint });
    }
  }
  const error = new Error('本机没有可用的 AI CLI。请检查 CLI 登录状态、模型配置或本机 API 网关。');
  error.statusCode = 502;
  error.code = 'NO_AVAILABLE_CLI';
  error.attempts = attempts;
  error.hint = attempts.map(attempt => `${cliLabels[attempt.cli]}：${attempt.error}`).join('；');
  throw error;
}

async function testCliConnection(cli, model, allowFallback = true) {
  const startedAt = Date.now();
  const result = await runLocalCliWithFallback(
    cli,
    'Respond with exactly: HTML_DESIGNER_CLI_OK',
    model,
    allowFallback,
    { timeoutMs: probeTimeoutMs },
  );
  if (!/HTML_DESIGNER_CLI_OK/i.test(result.output)) {
    const error = new Error(`${cliLabels[result.cli]} 已响应，但没有返回预期的连接确认。`);
    error.statusCode = 502;
    error.code = 'CLI_PROBE_INVALID';
    error.cli = result.cli;
    error.attempts = result.attempts;
    throw error;
  }
  const version = await getCliVersion(result.cli);
  const switched = result.cli !== cli;
  return {
    ...result,
    latencyMs: Date.now() - startedAt,
    message: switched
      ? `${cliLabels[cli]} 当前不可用，已验证并切换到 ${version}`
      : `${version} 已通过真实请求验证`,
  };
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
    '--input-format', 'text',
    '--output-format', 'text',
    '--permission-mode', 'dontAsk',
    '--no-session-persistence',
    '--no-chrome',
  ];
  if (model && !isCliName(model)) args.push('--model', model);
  return args;
}

function getCliVersion(cli) {
  const command = resultCommand(cli);
  return new Promise((resolve, reject) => {
    const child = spawn(command, ['--version'], {
      cwd: root,
      shell: process.platform === 'win32',
      windowsHide: true,
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      terminateChild(child);
      const error = new Error(`${command} --version timed out after ${probeTimeoutMs}ms`);
      error.code = 'CLI_TIMEOUT';
      error.cli = cli;
      reject(error);
    }, probeTimeoutMs);
    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.on('error', cause => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const error = new Error(`Failed to start ${command}: ${cause.message}`);
      error.code = cause.code === 'ENOENT' ? 'CLI_NOT_FOUND' : 'CLI_START_FAILED';
      error.cli = cli;
      reject(error);
    });
    child.on('close', code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        const error = new Error(`${command} --version failed with code ${code}: ${stderr || stdout}`);
        error.code = 'CLI_EXIT';
        error.cli = cli;
        reject(error);
        return;
      }
      resolve(`${command} ${String(stdout || stderr).trim()}`.trim());
    });
  });
}

function isCliName(value) {
  return /^(codex|claude|claudecode|claude-code)$/i.test(String(value || '').trim());
}

function stripAnsi(value) {
  return String(value || '').replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '').trim();
}

function diagnoseCliError(error, cli = error?.cli || 'codex') {
  const raw = stripAnsi(error?.detail || error?.message || error || 'CLI request failed');
  if (error?.code === 'CLI_ABORTED') {
    return { code: 'CLI_ABORTED', message: '任务已停止。', hint: '' };
  }
  if (error?.code === 'CLI_NOT_FOUND' || /ENOENT|not found|is not recognized/i.test(raw)) {
    return {
      code: 'CLI_NOT_FOUND',
      message: `${cliLabels[cli]} 未安装或不在 PATH 中。`,
      hint: `请在终端运行 ${resultCommand(cli)} --version 检查安装。`,
    };
  }
  if (error?.code === 'CLI_TIMEOUT' || /timed out|timeout/i.test(raw)) {
    return {
      code: 'CLI_TIMEOUT',
      message: `${cliLabels[cli]} 响应超时。`,
      hint: '请检查网络、CLI 登录状态和模型服务，然后重试。',
    };
  }
  if (/messages\.\d+\.role[\s\S]*received ['"]?system|Invalid enum value[\s\S]*system/i.test(raw)) {
    return {
      code: 'MESSAGE_ROLE_PROTOCOL',
      message: `${cliLabels[cli]} 的本机 API 网关不接受 Claude Code 的系统提示格式。`,
      hint: '请修正 ANTHROPIC_BASE_URL 对应网关的 Anthropic Messages 协议，或启用自动切换 CLI。',
    };
  }
  if (/authenticate|authentication|unauthorized|forbidden|active plan|login|sign.?in|401|403/i.test(raw)) {
    return {
      code: 'CLI_AUTH_REQUIRED',
      message: `${cliLabels[cli]} 尚未完成可用的登录或授权。`,
      hint: `请在终端运行 ${resultCommand(cli)} 并完成登录后，再测试连接。`,
    };
  }
  if (/model[\s\S]*(not found|invalid|unsupported|unavailable)|unknown model/i.test(raw)) {
    return {
      code: 'CLI_MODEL_INVALID',
      message: `${cliLabels[cli]} 无法使用当前模型。`,
      hint: '清空模型输入框以使用 CLI 默认模型，或填写该 CLI 支持的模型名称。',
    };
  }
  const concise = raw.replace(/^\w+ exited with code \d+:\s*/i, '').slice(-1200);
  return {
    code: error?.code || 'CLI_FAILED',
    message: `${cliLabels[cli]} 请求失败${concise ? `：${concise}` : '。'}`,
    hint: '请运行“测试连接”查看真实推理链路，并检查 CLI 的终端输出。',
  };
}

function serializeCliError(error) {
  const diagnostic = diagnoseCliError(error, error?.cli);
  return {
    error: error?.message || diagnostic.message,
    code: error?.code || diagnostic.code,
    hint: error?.hint || diagnostic.hint,
    attempts: error?.attempts || [],
  };
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

module.exports = {
  appendOutput,
  buildClaudeArgs,
  buildCodexArgs,
  buildPrompt,
  cliCandidates,
  diagnoseCliError,
  discoverCliModels,
  executeLocalCli,
  extractConfiguredClaudeModels,
  extractFinalText,
  extractHtmlDocument,
  normalizeCli,
  parseClaudeModelHelp,
  parseCodexModelCatalog,
  runLocalCli,
  runLocalCliWithFallback,
  serializeCliError,
  server,
  stripAnsi,
  testCliConnection,
};
