const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildClaudeArgs,
  buildPrompt,
  cliCandidates,
  diagnoseCliError,
  extractFinalText,
  extractHtmlDocument,
  normalizeCli,
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
