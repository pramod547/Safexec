import { Finding, RiskLevel } from './types';

export class RiskScorer {
  private static readonly LEVEL_WEIGHTS: Record<RiskLevel, number> = {
    critical: 95,
    high: 75,
    medium: 45,
    low: 10
  };

  public static calculateOverallRisk(findings: Finding[]): { level: RiskLevel; score: number } {
    if (findings.length === 0) {
      return { level: 'low', score: 0 };
    }

    // Determine highest risk level (precedence: Critical > High > Medium > Low)
    let highestLevel: RiskLevel = 'low';
    for (const finding of findings) {
      if (finding.riskLevel === 'critical') {
        highestLevel = 'critical';
        break; // Critical is maximum possible
      } else if (finding.riskLevel === 'high') {
        highestLevel = 'high';
      } else if (finding.riskLevel === 'medium' && highestLevel !== 'high') {
        highestLevel = 'medium';
      }
    }

    // Base score from highest level
    let score = this.LEVEL_WEIGHTS[highestLevel];

    // Minor adjustment for multiple findings
    if (findings.length > 1) {
      score = Math.min(100, score + (findings.length - 1) * 2);
    }

    return { level: highestLevel, score };
  }
}

