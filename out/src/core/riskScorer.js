"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskScorer = void 0;
class RiskScorer {
    static LEVEL_WEIGHTS = {
        critical: 95,
        high: 75,
        medium: 45,
        low: 10
    };
    static calculateOverallRisk(findings) {
        if (findings.length === 0) {
            return { level: 'low', score: 0 };
        }
        // Determine highest risk level (precedence: Critical > High > Medium > Low)
        let highestLevel = 'low';
        for (const finding of findings) {
            if (finding.riskLevel === 'critical') {
                highestLevel = 'critical';
                break; // Critical is maximum possible
            }
            else if (finding.riskLevel === 'high') {
                highestLevel = 'high';
            }
            else if (finding.riskLevel === 'medium' && highestLevel !== 'high') {
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
exports.RiskScorer = RiskScorer;
//# sourceMappingURL=riskScorer.js.map