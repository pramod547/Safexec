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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const explanationProvider_1 = require("./ai/explanationProvider");
const riskEngine_1 = require("./core/riskEngine");
const policyEngine_1 = require("./policy/policyEngine");
const safeRunner_1 = require("./protection/safeRunner");
const terminalMonitor_1 = require("./protection/terminalMonitor");
const auditLogger_1 = require("./storage/auditLogger");
const dashboard_1 = require("./ui/dashboard");
const findingsView_1 = require("./ui/findingsView");
const settingsView_1 = require("./ui/settingsView");
function activate(context) {
    // Load configuration
    const loadConfig = () => {
        const cfg = vscode.workspace.getConfiguration('safexec');
        return {
            criticalAction: cfg.get('policy.criticalAction', 'deny'),
            highAction: cfg.get('policy.highAction', 'confirm'),
            mediumAction: cfg.get('policy.mediumAction', 'prompt'),
            terminalMonitorEnabled: cfg.get('terminalMonitor.enabled', true),
            maxHistoryEntries: cfg.get('history.maxEntries', 100),
            redactSecrets: cfg.get('history.redactSecrets', true),
            aiEnabled: cfg.get('ai.enabled', false),
            aiEndpoint: cfg.get('ai.endpoint', ''),
            aiApiKey: cfg.get('ai.apiKey', '')
        };
    };
    const initialConfig = loadConfig();
    // Core singletons
    const riskEngine = new riskEngine_1.RiskEngine();
    const policyEngine = new policyEngine_1.PolicyEngine(initialConfig);
    const auditLogger = new auditLogger_1.AuditLogger(context);
    const explanationProvider = new explanationProvider_1.ExplanationProvider(initialConfig);
    const safeRunner = new safeRunner_1.SafeRunner(riskEngine, policyEngine, auditLogger, explanationProvider);
    const terminalMonitor = new terminalMonitor_1.TerminalMonitor(riskEngine, auditLogger);
    // UI Providers
    const findingsProvider = new findingsView_1.FindingsViewProvider();
    const historyProvider = new settingsView_1.HistoryTreeProvider(auditLogger);
    vscode.window.registerTreeDataProvider('safexec.findings', findingsProvider);
    vscode.window.registerTreeDataProvider('safexec.history', historyProvider);
    // Register commands
    const analyzeCmd = vscode.commands.registerCommand('safexec.analyzeCommand', async (cmd) => {
        const analysis = await safeRunner.analyzeOnly(cmd);
        if (analysis) {
            findingsProvider.setAnalysis(analysis);
            historyProvider.refresh();
            if (dashboard_1.DashboardPanel.currentPanel) {
                dashboard_1.DashboardPanel.currentPanel.update();
            }
        }
    });
    const runProtectedCmd = vscode.commands.registerCommand('safexec.runProtected', async (cmd) => {
        await safeRunner.runProtected(cmd);
        historyProvider.refresh();
        if (dashboard_1.DashboardPanel.currentPanel) {
            dashboard_1.DashboardPanel.currentPanel.update();
        }
    });
    const showDashboardCmd = vscode.commands.registerCommand('safexec.showDashboard', () => {
        dashboard_1.DashboardPanel.createOrShow(context.extensionUri, auditLogger);
    });
    const showHistoryCmd = vscode.commands.registerCommand('safexec.showHistory', () => {
        dashboard_1.DashboardPanel.createOrShow(context.extensionUri, auditLogger);
    });
    const clearHistoryCmd = vscode.commands.registerCommand('safexec.clearHistory', async () => {
        const confirm = await vscode.window.showWarningMessage('Are you sure you want to clear your local Safexec audit history?', { modal: true }, 'Clear History');
        if (confirm === 'Clear History') {
            await auditLogger.clearHistory();
            historyProvider.refresh();
            if (dashboard_1.DashboardPanel.currentPanel) {
                dashboard_1.DashboardPanel.currentPanel.update();
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
    context.subscriptions.push(analyzeCmd, runProtectedCmd, showDashboardCmd, showHistoryCmd, clearHistoryCmd, monitorDisposable, configWatcher);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map