const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildClaudeArgs,
  buildPrompt,
  cliCandidates,
  diagnoseCliError,
  extractConfiguredClaudeModels,
  extractFinalText,
  extractHtmlDocument,
  normalizeCli,
  parseClaudeModelHelp,
  parseCodexModelCatalog,
  serializeCliError,
} = require('../server');

test('normalizes CLI aliases and builds deterministic fallback order', () => {
  assert.equal(normalizeCli('Claude-Code'), 'claude');
  assert.equal(normalizeCli('unknown'), 'codex');
  assert.deepEqual(cliCandidates('claude', true), ['claude', 'codex']);
  assert.deepEqual(cliCandidates('codex', true), ['codex', 'claude']);
  assert.deepEqual(cliCandidates('claude', false), ['claude']);
});

test('Claude invocation is non-interactive and does not persist sessions', () => {
  const args = buildClaudeArgs('sonnet');
  assert.deepEqual(args.slice(0, 9), [
    '--print',
    '--input-format', 'text',
    '--output-format', 'text',
    '--permission-mode', 'dontAsk',
    '--no-session-persistence',
    '--no-chrome',
  ]);
  assert.deepEqual(args.slice(-2), ['--model', 'sonnet']);
});

test('diagnoses an incompatible Claude Messages gateway', () => {
  const error = new Error("claude exited with code 1: API Error: 400 messages.1.role: Invalid enum value. Expected 'user' | 'assistant', received 'system'");
  error.code = 'CLI_EXIT';
  error.cli = 'claude';
  const diagnostic = diagnoseCliError(error, 'claude');
  assert.equal(diagnostic.code, 'MESSAGE_ROLE_PROTOCOL');
  assert.match(diagnostic.message, /本机 API 网关/);
  assert.match(diagnostic.hint, /ANTHROPIC_BASE_URL/);
});

test('serializes aggregate CLI failures without losing attempt diagnostics', () => {
  const error = new Error('No CLI available');
  error.code = 'NO_AVAILABLE_CLI';
  error.statusCode = 502;
  error.hint = 'Check local CLIs';
  error.attempts = [{ cli: 'claude', ok: false, code: 'CLI_AUTH_REQUIRED' }];
  assert.deepEqual(serializeCliError(error), {
    error: 'No CLI available',
    code: 'NO_AVAILABLE_CLI',
    hint: 'Check local CLIs',
    attempts: error.attempts,
  });
});

test('prompt uses plain design context and HTML extraction accepts complete documents', () => {
  const prompt = buildPrompt({
    mode: 'iterate',
    brief: 'Make the hero clearer',
    currentHtml: '<!doctype html><html><body><h1>Title</h1></body></html>',
  });
  assert.match(prompt, /Design context JSON/);
  assert.match(prompt, /Make the hero clearer/);
  assert.doesNotMatch(prompt, /"role"\s*:\s*"system"/);

  const html = extractHtmlDocument('Plan\n<!doctype html><html><body><h1>Done</h1></body></html>');
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<h1>Done<\/h1>/);
});

test('extracts the final text from newline-delimited CLI events', () => {
  const output = [
    JSON.stringify({ type: 'message', item: { content: 'draft' } }),
    JSON.stringify({ final_message: '<html><body>final</body></html>' }),
  ].join('\n');
  assert.equal(extractFinalText(output), '<html><body>final</body></html>');
});

test('parses the Codex CLI model catalog in CLI priority order', () => {
  const models = parseCodexModelCatalog(JSON.stringify({ models: [
    { slug: 'hidden-model', display_name: 'Hidden', visibility: 'hide', supported_in_api: true, priority: 0 },
    { slug: 'gpt-fast', display_name: 'GPT Fast', description: 'Fast', visibility: 'list', supported_in_api: true, priority: 2 },
    { slug: 'gpt-deep', display_name: 'GPT Deep', description: 'Deep', visibility: 'list', supported_in_api: true, priority: 1 },
  ] }));
  assert.deepEqual(models.map(model => model.id), ['gpt-deep', 'gpt-fast']);
  assert.equal(models[0].source, 'cli');
});

test('discovers Claude CLI aliases and configured model overrides', () => {
  const aliases = parseClaudeModelHelp(`  --model <model>  Model for the current session. Provide an alias (e.g. 'fable', 'opus', or 'sonnet') or a full name (e.g. 'claude-fable-5').\n  --no-chrome`);
  assert.deepEqual(aliases, ['fable', 'opus', 'sonnet', 'claude-fable-5']);

  const configured = extractConfiguredClaudeModels([{
    model: 'company/default-model',
    env: {
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'company/large-model',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'company/fast-model',
    },
  }]);
  assert.deepEqual(configured, [
    'company/default-model',
    'company/large-model',
    'opus',
    'company/fast-model',
    'haiku',
  ]);
});
