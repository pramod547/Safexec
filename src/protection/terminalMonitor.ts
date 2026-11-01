import * as vscode from 'vscode';
import { RiskEngine } from '../core/riskEngine';
import { ShellDetector } from '../core/shellDetector';
import { AuditLogger } from '../storage/auditLogger';

export class TerminalMonitor {
  private riskEngine: RiskEngine;
  private auditLogger: AuditLogger;
  private disposables: vscode.Disposable[] = [];

  constructor(riskEngine: RiskEngine, auditLogger: AuditLogger) {
    this.riskEngine = riskEngine;
    this.auditLogger = auditLogger;
  }

  public activate(): vscode.Disposable {
    const config = vscode.workspace.getConfiguration('safexec');
    const enabled = config.get<boolean>('terminalMonitor.enabled', true);

    if (!enabled) {
      return { dispose: () => {} };
    }

    // Check if VS Code shell integration API is available in this environment
    if ('onDidStartTerminalShellExecution' in vscode.window) {
      const anyWindow = vscode.window as unknown as {
        onDidStartTerminalShellExecution: (
          listener: (e: { execution: { commandLine: { value: string } }; terminal: vscode.Terminal }) => void
        ) => vscode.Disposable;
      };

      const sub = anyWindow.onDidStartTerminalShellExecution(async (event) => {
        const cmdLine = event.execution?.commandLine?.value;
        if (!cmdLine || !cmdLine.trim()) return;

        const shell = ShellDetector.detectCurrentShell(event.terminal);
        const analysis = this.riskEngine.analyze(cmdLine, shell);

        if (analysis.overallRisk === 'critical' || analysis.overallRisk === 'high') {
          await this.auditLogger.log({
            command: cmdLine,
            riskLevel: analysis.overallRisk,
            riskScore: analysis.riskScore,
            matchedRules: analysis.findings.map((f) => f.id),
            decision: 'observed',
            source: 'terminal_observation',
            shell
          });

          vscode.window.showWarningMessage(
            `[Safexec Terminal Observer] Risky command started in terminal: "${cmdLine}".\n` +
              `Risk: ${analysis.overallRisk.toUpperCase()} — Note: This is an observational notice; execution may already be in progress.`,
            'Open Safexec Dashboard'
          ).then((choice) => {
            if (choice === 'Open Safexec Dashboard') {
              vscode.commands.executeCommand('safexec.showDashboard');
            }
          });
        }
      });

      this.disposables.push(sub);
    }

    return {
      dispose: () => {
        for (const d of this.disposables) {
          d.dispose();
        }
        this.disposables = [];
      }
    };
  }
}

