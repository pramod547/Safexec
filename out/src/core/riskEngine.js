"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskEngine = void 0;
const databaseRules_1 = require("../rules/databaseRules");
const filesystemRules_1 = require("../rules/filesystemRules");
const gitRules_1 = require("../rules/gitRules");
const networkRules_1 = require("../rules/networkRules");
const packageRules_1 = require("../rules/packageRules");
const systemRules_1 = require("../rules/systemRules");
const commandParser_1 = require("./commandParser");
const riskScorer_1 = require("./riskScorer");
class RiskEngine {
    rules = [];
    constructor(customRules = []) {
        this.rules = [
            ...filesystemRules_1.filesystemRules,
            ...gitRules_1.gitRules,
            ...databaseRules_1.databaseRules,
            ...networkRules_1.networkRules,
            ...packageRules_1.packageRules,
            ...systemRules_1.systemRules,
            ...customRules
        ];
    }
    analyze(commandLine, shell) {
        const trimmed = commandLine.trim();
        if (!trimmed) {
            return {
                command: commandLine,
                shell,
                overallRisk: 'low',
                riskScore: 0,
                findings: [],
                isBlocked: false,
                timestamp: Date.now()
            };
        }
        const parsed = commandParser_1.CommandParser.parse(trimmed, shell);
        const findings = [];
        const matchedRuleIds = new Set();
        for (const segment of parsed.segments) {
            for (const rule of this.rules) {
                if (rule.applicableShells && !rule.applicableShells.includes(shell)) {
                    continue;
                }
                const finding = rule.evaluate(segment, parsed);
                if (finding && !matchedRuleIds.has(finding.id)) {
                    findings.push(finding);
                    matchedRuleIds.add(finding.id);
                }
            }
        }
        // Heuristic warning for dynamic substitutions if no other critical/high findings
        if (parsed.hasSubshells && !matchedRuleIds.has('HEUR001')) {
            findings.push({
                id: 'HEUR001',
                ruleName: 'Dynamic Subshell / Command Substitution',
                category: 'custom',
                riskLevel: 'medium',
                title: 'Dynamic Subshell Evaluation Detected',
                description: 'This command contains nested subshells $(...) or dynamic evaluation that may execute uninspected code.',
                recommendedChecks: [
                    'Inspect the nested subshell expression separately before running.',
                    'Verify that dynamic variables do not contain untrusted input.'
                ],
                matchedSegment: trimmed
            });
        }
        const { level, score } = riskScorer_1.RiskScorer.calculateOverallRisk(findings);
        return {
            command: commandLine,
            shell,
            overallRisk: level,
            riskScore: score,
            findings,
            isBlocked: level === 'critical',
            timestamp: Date.now()
        };
    }
}
exports.RiskEngine = RiskEngine;
//# sourceMappingURL=riskEngine.js.map