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
exports.TerminalMonitor = void 0;
const vscode = __importStar(require("vscode"));
const shellDetector_1 = require("../core/shellDetector");
class TerminalMonitor {
    riskEngine;
    auditLogger;
    disposables = [];
    constructor(riskEngine, auditLogger) {
        this.riskEngine = riskEngine;
        this.auditLogger = auditLogger;
    }
    activate() {
        const config = vscode.workspace.getConfiguration('safexec');
        const enabled = config.get('terminalMonitor.enabled', true);
        if (!enabled) {
            return { dispose: () => { } };
        }
        // Check if VS Code shell integration API is available in this environment
        if ('onDidStartTerminalShellExecution' in vscode.window) {
            const anyWindow = vscode.window;
            const sub = anyWindow.onDidStartTerminalShellExecution(async (event) => {
                const cmdLine = event.execution?.commandLine?.value;
                if (!cmdLine || !cmdLine.trim())
                    return;
                const shell = shellDetector_1.ShellDetector.detectCurrentShell(event.terminal);
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
                    vscode.window.showWarningMessage(`[Safexec Terminal Observer] Risky command started in terminal: "${cmdLine}".\n` +
                        `Risk: ${analysis.overallRisk.toUpperCase()} — Note: This is an observational notice; execution may already be in progress.`, 'Open Safexec Dashboard').then((choice) => {
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
exports.TerminalMonitor = TerminalMonitor;
//# sourceMappingURL=terminalMonitor.js.map