import * as vscode from 'vscode';
import { AuditEntry } from '../core/types';
import { AuditLogger } from '../storage/auditLogger';

export class HistoryTreeProvider implements vscode.TreeDataProvider<HistoryTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<HistoryTreeItem | undefined | null | void> = new vscode.EventEmitter<
    HistoryTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<HistoryTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: HistoryTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: HistoryTreeItem): Thenable<HistoryTreeItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const history = this.auditLogger.getHistory();
    if (history.length === 0) {
      return Promise.resolve([
        new HistoryTreeItem(
          'No history recorded',
          'Executed commands will appear here',
          'low'
        )
      ]);
    }

    const items = history.slice(0, 50).map((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      return new HistoryTreeItem(
        `[${entry.decision.toUpperCase()}] ${entry.command}`,
        `${entry.riskLevel.toUpperCase()} • ${time} • ${entry.source}`,
        entry.riskLevel,
        entry
      );
    });

    return Promise.resolve(items);
  }
}

export class HistoryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly descriptionText: string,
    public readonly riskLevel: string,
    public readonly entry?: AuditEntry
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = descriptionText;
    this.tooltip = entry
      ? `Command: ${entry.command}\nRisk: ${entry.riskLevel.toUpperCase()} (${entry.riskScore}/100)\nDecision: ${entry.decision}\nRules: ${entry.matchedRules.join(', ') || 'None'}`
      : label;

    if (riskLevel === 'critical') {
      this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('errorForeground'));
    } else if (riskLevel === 'high') {
      this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('problemsWarningIcon.foreground'));
    } else if (riskLevel === 'medium') {
      this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('problemsInfoIcon.foreground'));
    } else {
      this.iconPath = new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed'));
    }
  }
}
