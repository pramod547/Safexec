export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ShellType = 'powershell' | 'cmd' | 'bash' | 'zsh' | 'unknown';

export type Platform = 'win32' | 'linux' | 'darwin' | 'unknown';

export type RuleCategory =
  | 'filesystem'
  | 'git'
  | 'database'
  | 'network'
  | 'system'
  | 'package'
  | 'custom';

export interface Finding {
  id: string;
  ruleName: string;
  category: RuleCategory;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  affectedTarget?: string;
  recommendedChecks: string[];
  matchedSegment: string;
}

export interface ParsedSegment {
  raw: string;
  command: string;
  args: string[];
  operator?: '&&' | '||' | ';' | '|' | '&';
}

export interface ParsedCommand {
  raw: string;
  shell: ShellType;
  segments: ParsedSegment[];
  hasSubshells: boolean;
  hasPipes: boolean;
  hasDynamicSubstitution: boolean;
}

export interface Rule {
  id: string;
  name: string;
  category: RuleCategory;
  riskLevel: RiskLevel;
  description: string;
  recommendedChecks: string[];
  applicableShells?: ShellType[];
  evaluate: (segment: ParsedSegment, fullCommand: ParsedCommand) => Finding | null;
}

export interface AnalysisResult {
  command: string;
  shell: ShellType;
  overallRisk: RiskLevel;
  riskScore: number;
  findings: Finding[];
  isBlocked: boolean;
  explanation?: string;
  timestamp: number;
}

export type PolicyDecision = 'allow' | 'prompt' | 'confirm' | 'deny';

export interface AuditEntry {
  id: string;
  timestamp: number;
  command: string;
  riskLevel: RiskLevel;
  riskScore: number;
  matchedRules: string[];
  decision: 'analyzed' | 'allowed' | 'denied' | 'cancelled' | 'observed';
  source: 'protected_runner' | 'terminal_observation' | 'analyzer';
  shell: ShellType;
}

export interface SafexecConfig {
  criticalAction: 'deny' | 'confirm';
  highAction: 'confirm' | 'allow';
  mediumAction: 'prompt' | 'allow';
  terminalMonitorEnabled: boolean;
  maxHistoryEntries: number;
  redactSecrets: boolean;
  aiEnabled: boolean;
  aiEndpoint?: string;
  aiApiKey?: string;
}

