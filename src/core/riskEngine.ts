import { databaseRules } from '../rules/databaseRules';
import { filesystemRules } from '../rules/filesystemRules';
import { gitRules } from '../rules/gitRules';
import { networkRules } from '../rules/networkRules';
import { packageRules } from '../rules/packageRules';
import { systemRules } from '../rules/systemRules';
import { CommandParser } from './commandParser';
import { RiskScorer } from './riskScorer';
import { AnalysisResult, Finding, ParsedCommand, Rule, ShellType } from './types';

export class RiskEngine {
  private rules: Rule[] = [];

  constructor(customRules: Rule[] = []) {
    this.rules = [
      ...filesystemRules,
      ...gitRules,
      ...databaseRules,
      ...networkRules,
      ...packageRules,
      ...systemRules,
      ...customRules
    ];
  }

  public analyze(commandLine: string, shell: ShellType): AnalysisResult {
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

    const parsed: ParsedCommand = CommandParser.parse(trimmed, shell);
    const findings: Finding[] = [];
    const matchedRuleIds = new Set<string>();

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
        description:
          'This command contains nested subshells $(...) or dynamic evaluation that may execute uninspected code.',
        recommendedChecks: [
          'Inspect the nested subshell expression separately before running.',
          'Verify that dynamic variables do not contain untrusted input.'
        ],
        matchedSegment: trimmed
      });
    }

    const { level, score } = RiskScorer.calculateOverallRisk(findings);

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

