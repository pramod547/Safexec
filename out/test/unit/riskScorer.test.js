"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const riskScorer_1 = require("../../src/core/riskScorer");
describe('RiskScorer Unit Tests', () => {
    it('returns low risk and 0 score when findings is empty', () => {
        const res = riskScorer_1.RiskScorer.calculateOverallRisk([]);
        assert.strictEqual(res.level, 'low');
        assert.strictEqual(res.score, 0);
    });
    it('respects precedence: Critical > High > Medium > Low', () => {
        const findings = [
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
        const res = riskScorer_1.RiskScorer.calculateOverallRisk(findings);
        assert.strictEqual(res.level, 'critical');
        assert.ok(res.score >= 95);
    });
    it('calculates medium risk correctly when highest finding is medium', () => {
        const findings = [
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
        const res = riskScorer_1.RiskScorer.calculateOverallRisk(findings);
        assert.strictEqual(res.level, 'medium');
        assert.strictEqual(res.score, 45);
    });
});
//# sourceMappingURL=riskScorer.test.js.map