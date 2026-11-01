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
exports.HistoryTreeItem = exports.HistoryTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
class HistoryTreeProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    auditLogger;
    constructor(auditLogger) {
        this.auditLogger = auditLogger;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return Promise.resolve([]);
        }
        const history = this.auditLogger.getHistory();
        if (history.length === 0) {
            return Promise.resolve([
                new HistoryTreeItem('No history recorded', 'Executed commands will appear here', 'low')
            ]);
        }
        const items = history.slice(0, 50).map((entry) => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            return new HistoryTreeItem(`[${entry.decision.toUpperCase()}] ${entry.command}`, `${entry.riskLevel.toUpperCase()} • ${time} • ${entry.source}`, entry.riskLevel, entry);
        });
        return Promise.resolve(items);
    }
}
exports.HistoryTreeProvider = HistoryTreeProvider;
class HistoryTreeItem extends vscode.TreeItem {
    label;
    descriptionText;
    riskLevel;
    entry;
    constructor(label, descriptionText, riskLevel, entry) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.descriptionText = descriptionText;
        this.riskLevel = riskLevel;
        this.entry = entry;
        this.description = descriptionText;
        this.tooltip = entry
            ? `Command: ${entry.command}\nRisk: ${entry.riskLevel.toUpperCase()} (${entry.riskScore}/100)\nDecision: ${entry.decision}\nRules: ${entry.matchedRules.join(', ') || 'None'}`
            : label;
        if (riskLevel === 'critical') {
            this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('errorForeground'));
        }
        else if (riskLevel === 'high') {
            this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('problemsWarningIcon.foreground'));
        }
        else if (riskLevel === 'medium') {
            this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('problemsInfoIcon.foreground'));
        }
        else {
            this.iconPath = new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed'));
        }
    }
}
exports.HistoryTreeItem = HistoryTreeItem;
//# sourceMappingURL=settingsView.js.map