import * as vscode from 'vscode';
import { AnalysisResult, Finding } from '../core/types';

export class FindingsViewProvider implements vscode.TreeDataProvider<FindingTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FindingTreeItem | undefined | null | void> = new vscode.EventEmitter<
    FindingTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<FindingTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private currentAnalysis: AnalysisResult | null = null;

  public setAnalysis(analysis: AnalysisResult | null): void {
    this.currentAnalysis = analysis;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: FindingTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FindingTreeItem): Thenable<FindingTreeItem[]> {
    if (!this.currentAnalysis) {
      return Promise.resolve([
        new FindingTreeItem(
          'No recent command analyzed',
          'Use Safexec: Analyze a Command or Run Protected',
          vscode.TreeItemCollapsibleState.None,
          'info'
        )
      ]);
    }

    if (!element) {
      // Top level: show summary item and finding items
      const summaryItem = new FindingTreeItem(
        `Risk: ${this.currentAnalysis.overallRisk.toUpperCase()} (Score: ${this.currentAnalysis.riskScore}/100)`,
        this.currentAnalysis.command,
        vscode.TreeItemCollapsibleState.None,
        this.currentAnalysis.overallRisk
      );

      const findingItems = this.currentAnalysis.findings.map(
        (f) =>
          new FindingTreeItem(
            `[${f.id}] ${f.title}`,
            f.description,
            f.recommendedChecks && f.recommendedChecks.length > 0
              ? vscode.TreeItemCollapsibleState.Collapsed
              : vscode.TreeItemCollapsibleState.None,
            f.riskLevel,
            f
          )
      );

      return Promise.resolve([summaryItem, ...findingItems]);
    } else if (element.finding && element.finding.recommendedChecks) {
      // Nested: show recommended checks
      const checkItems = element.finding.recommendedChecks.map(
        (chk) =>
          new FindingTreeItem(`Check: ${chk}`, '', vscode.TreeItemCollapsibleState.None, 'check')
      );
      return Promise.resolve(checkItems);
    }

    return Promise.resolve([]);
  }
}

export class FindingTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly descriptionText: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly severity: string,
    public readonly finding?: Finding
  ) {
    super(label, collapsibleState);
    this.description = descriptionText;
    this.tooltip = `${label} - ${descriptionText}`;

    if (severity === 'critical') {
      this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
    } else if (severity === 'high') {
      this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'));
    } else if (severity === 'medium') {
      this.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('problemsInfoIcon.foreground'));
    } else if (severity === 'check') {
      this.iconPath = new vscode.ThemeIcon('check');
    } else {
      this.iconPath = new vscode.ThemeIcon('shield');
    }
  }
}

