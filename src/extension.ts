import * as vscode from 'vscode';
import { ExplanationProvider } from './ai/explanationProvider';
import { RiskEngine } from './core/riskEngine';
import { SafexecConfig } from './core/types';
import { PolicyEngine } from './policy/policyEngine';
import { SafeRunner } from './protection/safeRunner';
import { TerminalMonitor } from './protection/terminalMonitor';
import { AuditLogger } from './storage/auditLogger';
import { DashboardPanel } from './ui/dashboard';
import { FindingsViewProvider } from './ui/findingsView';
import { HistoryTreeProvider } from './ui/settingsView';

export function activate(context: vscode.ExtensionContext) {
  // Load configuration
  const loadConfig = (): SafexecConfig => {
    const cfg = vscode.workspace.getConfiguration('safexec');
    return {
      criticalAction: cfg.get<'deny' | 'confirm'>('policy.criticalAction', 'deny'),
      highAction: cfg.get<'confirm' | 'allow'>('policy.highAction', 'confirm'),
      mediumAction: cfg.get<'prompt' | 'allow'>('policy.mediumAction', 'prompt'),
      terminalMonitorEnabled: cfg.get<boolean>('terminalMonitor.enabled', true),
      maxHistoryEntries: cfg.get<number>('history.maxEntries', 100),
      redactSecrets: cfg.get<boolean>('history.redactSecrets', true),
      aiEnabled: cfg.get<boolean>('ai.enabled', false),
      aiEndpoint: cfg.get<string>('ai.endpoint', ''),
      aiApiKey: cfg.get<string>('ai.apiKey', '')
    };
  };

  const initialConfig = loadConfig();

  // Core singletons
  const riskEngine = new RiskEngine();
  const policyEngine = new PolicyEngine(initialConfig);
  const auditLogger = new AuditLogger(context);
  const explanationProvider = new ExplanationProvider(initialConfig);
  const safeRunner = new SafeRunner(riskEngine, policyEngine, auditLogger, explanationProvider);
  const terminalMonitor = new TerminalMonitor(riskEngine, auditLogger);

  // UI Providers
  const findingsProvider = new FindingsViewProvider();
  const historyProvider = new HistoryTreeProvider(auditLogger);

  vscode.window.registerTreeDataProvider('safexec.findings', findingsProvider);
  vscode.window.registerTreeDataProvider('safexec.history', historyProvider);

  // Register commands
  const analyzeCmd = vscode.commands.registerCommand('safexec.analyzeCommand', async (cmd?: string) => {
    const analysis = await safeRunner.analyzeOnly(cmd);
    if (analysis) {
      findingsProvider.setAnalysis(analysis);
      historyProvider.refresh();
      if (DashboardPanel.currentPanel) {
        DashboardPanel.currentPanel.update();
      }
    }
  });

  const runProtectedCmd = vscode.commands.registerCommand('safexec.runProtected', async (cmd?: string) => {
    await safeRunner.runProtected(cmd);
    historyProvider.refresh();
    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel.update();
    }
  });

  const showDashboardCmd = vscode.commands.registerCommand('safexec.showDashboard', () => {
    DashboardPanel.createOrShow(context.extensionUri, auditLogger);
  });

  const showHistoryCmd = vscode.commands.registerCommand('safexec.showHistory', () => {
    DashboardPanel.createOrShow(context.extensionUri, auditLogger);
  });

  const clearHistoryCmd = vscode.commands.registerCommand('safexec.clearHistory', async () => {
    const confirm = await vscode.window.showWarningMessage(
      'Are you sure you want to clear your local Safexec audit history?',
      { modal: true },
      'Clear History'
    );
    if (confirm === 'Clear History') {
      await auditLogger.clearHistory();
      historyProvider.refresh();
      if (DashboardPanel.currentPanel) {
        DashboardPanel.currentPanel.update();
      }
      vscode.window.showInformationMessage('Safexec: Audit history cleared.');
    }
  });

  // Terminal observation
  const monitorDisposable = terminalMonitor.activate();

  // Watch configuration updates
  const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('safexec')) {
      const updatedConfig = loadConfig();
      policyEngine.updateConfig(updatedConfig);
      explanationProvider.updateConfig(updatedConfig);
    }
  });

  context.subscriptions.push(
    analyzeCmd,
    runProtectedCmd,
    showDashboardCmd,
    showHistoryCmd,
    clearHistoryCmd,
    monitorDisposable,
    configWatcher
  );
}

export function deactivate() {}
