import * as assert from 'assert';
import { SecretRedactor } from '../../src/ai/secretRedactor';

describe('SecretRedactor Unit Tests', () => {
  it('redacts database passwords in connection URIs', () => {
    const raw = 'psql postgres://admin:superSecret123@localhost:5432/mydb';
    const redacted = SecretRedactor.redact(raw);
    assert.strictEqual(redacted, 'psql postgres://admin:***REDACTED_PASSWORD***@localhost:5432/mydb');
    assert.ok(!redacted.includes('superSecret123'));
  });

  it('redacts GitHub Personal Access Tokens', () => {
    const raw = 'curl -H "Authorization: token ghp_1234567890abcdef1234567890abcdef1234" https://api.github.com';
    const redacted = SecretRedactor.redact(raw);
    assert.ok(redacted.includes('***REDACTED_GITHUB_TOKEN***'));
    assert.ok(!redacted.includes('ghp_1234567890abcdef1234567890abcdef1234'));
  });

  it('redacts OpenAI / general sk- API keys', () => {
    const raw = 'export OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456';
    const redacted = SecretRedactor.redact(raw);
    assert.ok(redacted.includes('***REDACTED_API_KEY***') || redacted.includes('***REDACTED***'));
    assert.ok(!redacted.includes('sk-abcdefghijklmnopqrstuvwxyz123456'));
  });

  it('redacts Bearer tokens', () => {
    const raw = 'curl -H "Authorization: Bearer mySecretTokenValue12345678" https://api.service.com';
    const redacted = SecretRedactor.redact(raw);
    assert.ok(redacted.includes('Bearer ***REDACTED_BEARER_TOKEN***'));
    assert.ok(!redacted.includes('mySecretTokenValue12345678'));
  });

  it('redacts CLI password flags', () => {
    const raw = 'mysql -u root -p mySecretPassword -e "SELECT 1"';
    const redacted = SecretRedactor.redact(raw);
    assert.ok(redacted.includes('-p ***REDACTED***'));
    assert.ok(!redacted.includes('mySecretPassword'));
  });

  it('preserves clean commands unchanged', () => {
    const raw = 'git clone https://github.com/microsoft/vscode.git';
    assert.strictEqual(SecretRedactor.redact(raw), raw);
  });
});

