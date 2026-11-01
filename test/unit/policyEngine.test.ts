import * as assert from 'assert';
import { PolicyEngine } from '../../src/policy/policyEngine';
import { AnalysisResult } from '../../src/core/types';

describe('PolicyEngine Unit Tests', () => {
  it('denies critical risk by default', () => {
    const engine = new PolicyEngine();
    const result: AnalysisResult = {
      command: 'rm -rf /',
      shell: 'bash',
      overallRisk: 'critical',
      riskScore: 95,
      findings: [],
      isBlocked: true,
      timestamp: Date.now()
    };

    assert.strictEqual(engine.evaluate(result), 'deny');
  });

  it('requires confirmation for high risk by default', () => {
    const engine = new PolicyEngine();
    const result: AnalysisResult = {
      command: 'git reset --hard',
      shell: 'bash',
      overallRisk: 'high',
      riskScore: 75,
      findings: [],
      isBlocked: false,
      timestamp: Date.now()
    };

    assert.strictEqual(engine.evaluate(result), 'confirm');
  });

  it('prompts review for medium risk by default', () => {
    const engine = new PolicyEngine();
    const result: AnalysisResult = {
      command: 'git branch -D test',
      shell: 'bash',
      overallRisk: 'medium',
      riskScore: 45,
      findings: [],
      isBlocked: false,
      timestamp: Date.now()
    };

    assert.strictEqual(engine.evaluate(result), 'prompt');
  });

  it('allows low risk automatically', () => {
    const engine = new PolicyEngine();
    const result: AnalysisResult = {
      command: 'ls -l',
      shell: 'bash',
      overallRisk: 'low',
      riskScore: 0,
      findings: [],
      isBlocked: false,
      timestamp: Date.now()
    };

    assert.strictEqual(engine.evaluate(result), 'allow');
  });

  it('allows custom override configuration', () => {
    const engine = new PolicyEngine({
      criticalAction: 'confirm',
      highAction: 'allow'
    });

    const highRes: AnalysisResult = {
      command: 'git reset --hard',
      shell: 'bash',
      overallRisk: 'high',
      riskScore: 75,
      findings: [],
      isBlocked: false,
      timestamp: Date.now()
    };

    assert.strictEqual(engine.evaluate(highRes), 'allow');
  });
});
