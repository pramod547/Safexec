import * as vscode from 'vscode';
import { AuditLogger } from '../storage/auditLogger';

export class DashboardPanel {
  public static currentPanel: DashboardPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly auditLogger: AuditLogger;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, auditLogger: AuditLogger) {
    this.panel = panel;
    this.auditLogger = auditLogger;

    this.update();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'clearHistory':
            await this.auditLogger.clearHistory();
            vscode.window.showInformationMessage('Safexec: Audit history cleared.');
            this.update();
            break;
          case 'runProtected':
            vscode.commands.executeCommand('safexec.runProtected', message.commandText);
            break;
          case 'openSettings':
            vscode.commands.executeCommand('workbench.action.openSettings', 'safexec');
            break;
        }
      },
      null,
      this.disposables
    );
  }

  public static createOrShow(extensionUri: vscode.Uri, auditLogger: AuditLogger): void {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel.panel.reveal(column);
      DashboardPanel.currentPanel.update();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'safexecDashboard',
      'Safexec Security Dashboard',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel, auditLogger);
  }

  public update(): void {
    const stats = this.auditLogger.getStatistics();
    const history = this.auditLogger.getHistory().slice(0, 25);
    this.panel.webview.html = this.getHtmlForWebview(stats, history);
  }

  public dispose(): void {
    DashboardPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) x.dispose();
    }
  }

  private getHtmlForWebview(
    stats: ReturnType<AuditLogger['getStatistics']>,
    history: ReturnType<AuditLogger['getHistory']>
  ): string {
    const historyRows = history
      .map((entry) => {
        const badgeColor =
          entry.riskLevel === 'critical'
            ? '#e53935'
            : entry.riskLevel === 'high'
            ? '#fb8c00'
            : entry.riskLevel === 'medium'
            ? '#fbc02d'
            : '#43a047';

        const decisionBadge =
          entry.decision === 'denied'
            ? '#d32f2f'
            : entry.decision === 'cancelled'
            ? '#757575'
            : entry.decision === 'allowed'
            ? '#2e7d32'
            : '#0288d1';

        const dateStr = new Date(entry.timestamp).toLocaleTimeString();

        return `
        <tr>
          <td><span class="badge" style="background-color: ${badgeColor};">${entry.riskLevel.toUpperCase()}</span></td>
          <td><code>${this.escapeHtml(entry.command)}</code></td>
          <td><span class="badge" style="background-color: ${decisionBadge};">${entry.decision}</span></td>
          <td>${entry.source}</td>
          <td>${dateStr}</td>
        </tr>
      `;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Safexec Security Dashboard</title>
  <style>
    body {
      font-family: var(--vscode-font-family, sans-serif);
      padding: 24px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    h1, h2 {
      margin-top: 0;
      color: var(--vscode-editor-foreground);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-widget-border, #444);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .card {
      background: var(--vscode-sideBar-background, #252526);
      border: 1px solid var(--vscode-widget-border, #333);
      border-radius: 6px;
      padding: 16px;
    }
    .card-title {
      font-size: 13px;
      text-transform: uppercase;
      opacity: 0.8;
      margin-bottom: 8px;
    }
    .card-value {
      font-size: 28px;
      font-weight: bold;
    }
    .actions {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    button {
      background: var(--vscode-button-background, #0e639c);
      color: var(--vscode-button-foreground, #ffffff);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    button.secondary {
      background: var(--vscode-button-secondaryBackground, #3a3d41);
      color: var(--vscode-button-secondaryForeground, #ffffff);
    }
    button:hover {
      background: var(--vscode-button-hoverBackground, #1177bb);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      text-align: left;
      padding: 8px 12px;
      border-bottom: 1px solid var(--vscode-widget-border, #333);
    }
    th {
      background: var(--vscode-sideBar-background, #252526);
    }
    code {
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      color: white;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Safexec Security Dashboard</h1>
      <p style="opacity: 0.8; margin: 4px 0 0 0;">Safer terminal commands. Smarter execution.</p>
    </div>
    <div class="actions">
      <button onclick="runProtectedPrompt()">Run Protected Command</button>
      <button class="secondary" onclick="openSettings()">Safexec Policy Settings</button>
      <button class="secondary" onclick="clearHistory()">Clear History</button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="card">
      <div class="card-title">Total Commands Analyzed</div>
      <div class="card-value">${stats.total}</div>
    </div>
    <div class="card" style="border-left: 4px solid #e53935;">
      <div class="card-title">Critical Detections</div>
      <div class="card-value" style="color: #e53935;">${stats.byRisk.critical}</div>
    </div>
    <div class="card" style="border-left: 4px solid #fb8c00;">
      <div class="card-title">High Risk Warnings</div>
      <div class="card-value" style="color: #fb8c00;">${stats.byRisk.high}</div>
    </div>
    <div class="card" style="border-left: 4px solid #fbc02d;">
      <div class="card-title">Medium Risk Prompts</div>
      <div class="card-value" style="color: #fbc02d;">${stats.byRisk.medium}</div>
    </div>
    <div class="card" style="border-left: 4px solid #43a047;">
      <div class="card-title">Low Risk Allowed</div>
      <div class="card-value" style="color: #43a047;">${stats.byRisk.low}</div>
    </div>
  </div>

  <h2>Recent Audit Activity</h2>
  ${
    history.length === 0
      ? '<p style="opacity: 0.7;">No commands logged yet. Use <code>Safexec: Run Protected Command</code> to begin.</p>'
      : `
    <table>
      <thead>
        <tr>
          <th>Risk</th>
          <th>Command</th>
          <th>Decision</th>
          <th>Source</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        ${historyRows}
      </tbody>
    </table>
  `
  }

  <script>
    const vscode = acquireVsCodeApi();

    function clearHistory() {
      if (confirm('Are you sure you want to clear your local Safexec audit history?')) {
        vscode.postMessage({ command: 'clearHistory' });
      }
    }

    function runProtectedPrompt() {
      vscode.postMessage({ command: 'runProtected' });
    }

    function openSettings() {
      vscode.postMessage({ command: 'openSettings' });
    }
  </script>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

