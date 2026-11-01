import * as assert from 'assert';
import { RiskScorer } from '../../src/core/riskScorer';
import { Finding } from '../../src/core/types';

describe('RiskScorer Unit Tests', () => {
  it('returns low risk and 0 score when findings is empty', () => {
    const res = RiskScorer.calculateOverallRisk([]);
    assert.strictEqual(res.level, 'low');
    assert.strictEqual(res.score, 0);
  });

  it('respects precedence: Critical > High > Medium > Low', () => {
    const findings: Finding[] = [
      {
        id: 'MED1',
        ruleName: 'Test Med',
        category: 'git',
        riskLevel: 'medium',
        title: 'Med',
        description: 'desc',
        recommendedChecks: [],
        matchedSegment: 'cmd'
      },
      {
        id: 'CRIT1',
        ruleName: 'Test Crit',
        category: 'filesystem',
        riskLevel: 'critical',
        title: 'Crit',
        description: 'desc',
        recommendedChecks: [],
        matchedSegment: 'cmd'
      },
      {
        id: 'HIGH1',
        ruleName: 'Test High',
        category: 'database',
        riskLevel: 'high',
        title: 'High',
        description: 'desc',
        recommendedChecks: [],
        matchedSegment: 'cmd'
      }
    ];

    const res = RiskScorer.calculateOverallRisk(findings);
    assert.strictEqual(res.level, 'critical');
    assert.ok(res.score >= 95);
  });

  it('calculates medium risk correctly when highest finding is medium', () => {
    const findings: Finding[] = [
      {
        id: 'MED1',
        ruleName: 'Test Med',
        category: 'git',
        riskLevel: 'medium',
        title: 'Med',
        description: 'desc',
        recommendedChecks: [],
        matchedSegment: 'cmd'
      }
    ];
    const res = RiskScorer.calculateOverallRisk(findings);
    assert.strictEqual(res.level, 'medium');
    assert.strictEqual(res.score, 45);
  });
});

