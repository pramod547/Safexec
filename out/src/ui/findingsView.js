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
exports.FindingTreeItem = exports.FindingsViewProvider = void 0;
const vscode = __importStar(require("vscode"));
class FindingsViewProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    currentAnalysis = null;
    setAnalysis(analysis) {
        this.currentAnalysis = analysis;
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this.currentAnalysis) {
            return Promise.resolve([
                new FindingTreeItem('No recent command analyzed', 'Use Safexec: Analyze a Command or Run Protected', vscode.TreeItemCollapsibleState.None, 'info')
            ]);
        }
        if (!element) {
            // Top level: show summary item and finding items
            const summaryItem = new FindingTreeItem(`Risk: ${this.currentAnalysis.overallRisk.toUpperCase()} (Score: ${this.currentAnalysis.riskScore}/100)`, this.currentAnalysis.command, vscode.TreeItemCollapsibleState.None, this.currentAnalysis.overallRisk);
            const findingItems = this.currentAnalysis.findings.map((f) => new FindingTreeItem(`[${f.id}] ${f.title}`, f.description, f.recommendedChecks && f.recommendedChecks.length > 0
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None, f.riskLevel, f));
            return Promise.resolve([summaryItem, ...findingItems]);
        }
        else if (element.finding && element.finding.recommendedChecks) {
            // Nested: show recommended checks
            const checkItems = element.finding.recommendedChecks.map((chk) => new FindingTreeItem(`Check: ${chk}`, '', vscode.TreeItemCollapsibleState.None, 'check'));
            return Promise.resolve(checkItems);
        }
        return Promise.resolve([]);
    }
}
exports.FindingsViewProvider = FindingsViewProvider;
class FindingTreeItem extends vscode.TreeItem {
    label;
    descriptionText;
    collapsibleState;
    severity;
    finding;
    constructor(label, descriptionText, collapsibleState, severity, finding) {
        super(label, collapsibleState);
        this.label = label;
        this.descriptionText = descriptionText;
        this.collapsibleState = collapsibleState;
        this.severity = severity;
        this.finding = finding;
        this.description = descriptionText;
        this.tooltip = `${label} - ${descriptionText}`;
        if (severity === 'critical') {
            this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
        }
        else if (severity === 'high') {
            this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'));
        }
        else if (severity === 'medium') {
            this.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('problemsInfoIcon.foreground'));
        }
        else if (severity === 'check') {
            this.iconPath = new vscode.ThemeIcon('check');
        }
        else {
            this.iconPath = new vscode.ThemeIcon('shield');
        }
    }
}
exports.FindingTreeItem = FindingTreeItem;
//# sourceMappingURL=findingsView.js.map