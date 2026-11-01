import * as vscode from 'vscode';
import { SecretRedactor } from '../ai/secretRedactor';
import { AuditEntry, RiskLevel, ShellType } from '../core/types';

export class AuditLogger {
  private static readonly STORAGE_KEY = 'safexec.audit.history';
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public async log(params: {
    command: string;
    riskLevel: RiskLevel;
    riskScore: number;
    matchedRules: string[];
    decision: 'analyzed' | 'allowed' | 'denied' | 'cancelled' | 'observed';
    source: 'protected_runner' | 'terminal_observation' | 'analyzer';
    shell: ShellType;
  }): Promise<AuditEntry> {
    const config = vscode.workspace.getConfiguration('safexec');
    const redactSecrets = config.get<boolean>('history.redactSecrets', true);
    const maxEntries = config.get<number>('history.maxEntries', 100);

    const commandText = redactSecrets ? SecretRedactor.redact(params.command) : params.command;

    const entry: AuditEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      command: commandText,
      riskLevel: params.riskLevel,
      riskScore: params.riskScore,
      matchedRules: params.matchedRules,
      decision: params.decision,
      source: params.source,
      shell: params.shell
    };

    const history = this.getHistory();
    history.unshift(entry);

    if (history.length > maxEntries) {
      history.length = maxEntries;
    }

    await this.context.globalState.update(AuditLogger.STORAGE_KEY, history);
    return entry;
  }

  public getHistory(): AuditEntry[] {
    return this.context.globalState.get<AuditEntry[]>(AuditLogger.STORAGE_KEY, []);
  }

  public async clearHistory(): Promise<void> {
    await this.context.globalState.update(AuditLogger.STORAGE_KEY, []);
  }

  public getStatistics(): {
    total: number;
    byRisk: Record<RiskLevel, number>;
    byDecision: Record<string, number>;
    bySource: Record<string, number>;
  } {
    const history = this.getHistory();
    const byRisk: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    const byDecision: Record<string, number> = {
      analyzed: 0,
      allowed: 0,
      denied: 0,
      cancelled: 0,
      observed: 0
    };
    const bySource: Record<string, number> = {
      protected_runner: 0,
      terminal_observation: 0,
      analyzer: 0
    };

    for (const item of history) {
      if (byRisk[item.riskLevel] !== undefined) {
        byRisk[item.riskLevel]++;
      }
      if (byDecision[item.decision] !== undefined) {
        byDecision[item.decision]++;
      }
      if (bySource[item.source] !== undefined) {
        bySource[item.source]++;
      }
    }

    return {
      total: history.length,
      byRisk,
      byDecision,
      bySource
    };
  }
}

