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
exports.SafeRunner = void 0;
const vscode = __importStar(require("vscode"));
const shellDetector_1 = require("../core/shellDetector");
class SafeRunner {
    riskEngine;
    policyEngine;
    auditLogger;
    explanationProvider;
    protectedTerminal;
    constructor(riskEngine, policyEngine, auditLogger, explanationProvider) {
        this.riskEngine = riskEngine;
        this.policyEngine = policyEngine;
        this.auditLogger = auditLogger;
        this.explanationProvider = explanationProvider;
    }
    async runProtected(prefilledCommand) {
        const command = prefilledCommand ||
            (await vscode.window.showInputBox({
                title: 'Safexec: Protected Runner',
                prompt: 'Enter the shell command to analyze and safely execute',
                placeHolder: 'e.g. git reset --hard, npm install, docker run ...',
                ignoreFocusOut: true
            }));
        if (!command || !command.trim()) {
            return;
        }
        const shell = shellDetector_1.ShellDetector.detectCurrentShell(vscode.window.activeTerminal);
        const analysis = this.riskEngine.analyze(command, shell);
        const decisionPolicy = this.policyEngine.evaluate(analysis);
        const explanation = await this.explanationProvider.getExplanation(analysis);
        // CRITICAL RISK
        if (analysis.overallRisk === 'critical') {
            const matchedNames = analysis.findings.map((f) => f.title).join(', ');
            if (decisionPolicy === 'deny') {
                await this.auditLogger.log({
                    command,
                    riskLevel: analysis.overallRisk,
                    riskScore: analysis.riskScore,
                    matchedRules: analysis.findings.map((f) => f.id),
                    decision: 'denied',
                    source: 'protected_runner',
                    shell
                });
                await vscode.window.showErrorMessage(`[SAFEXEC BLOCKED] Critical Risk Command Denied!\n` +
                    `Command: ${command}\n` +
                    `Matched: ${matchedNames}\n` +
                    `Execution was blocked by default policy to prevent destructive impact.`, { modal: true, detail: explanation }, 'Acknowledge');
                return;
            }
            else {
                // Policy configured to confirm instead of strict deny
                const userChoice = await vscode.window.showWarningMessage(`[SAFEXEC CRITICAL WARNING] Dangerous command detected:\n${command}\n` +
                    `Findings: ${matchedNames}`, { modal: true, detail: explanation }, 'Override and Execute', 'Cancel');
                if (userChoice !== 'Override and Execute') {
                    await this.auditLogger.log({
                        command,
                        riskLevel: analysis.overallRisk,
                        riskScore: analysis.riskScore,
                        matchedRules: analysis.findings.map((f) => f.id),
                        decision: 'cancelled',
                        source: 'protected_runner',
                        shell
                    });
                    vscode.window.showInformationMessage('Safexec: Execution cancelled.');
                    return;
                }
            }
        }
        // HIGH RISK
        else if (analysis.overallRisk === 'high') {
            const matchedNames = analysis.findings.map((f) => f.title).join(', ');
            const userChoice = await vscode.window.showWarningMessage(`SAFEXEC — HIGH RISK COMMAND DETECTED\n\nCommand:\n${command}\n\n` +
                `Why flagged:\n${analysis.findings.map((f) => '• ' + f.description).join('\n')}`, { modal: true, detail: explanation }, 'Run Anyway', 'Cancel');
            if (userChoice !== 'Run Anyway') {
                await this.auditLogger.log({
                    command,
                    riskLevel: analysis.overallRisk,
                    riskScore: analysis.riskScore,
                    matchedRules: analysis.findings.map((f) => f.id),
                    decision: 'cancelled',
                    source: 'protected_runner',
                    shell
                });
                vscode.window.showInformationMessage('Safexec: Command execution cancelled.');
                return;
            }
        }
        // MEDIUM RISK
        else if (analysis.overallRisk === 'medium') {
            const userChoice = await vscode.window.showInformationMessage(`Safexec Review: Medium risk command detected.\n"${command}"`, { detail: explanation }, 'Run Command', 'Cancel');
            if (userChoice !== 'Run Command') {
                await this.auditLogger.log({
                    command,
                    riskLevel: analysis.overallRisk,
                    riskScore: analysis.riskScore,
                    matchedRules: analysis.findings.map((f) => f.id),
                    decision: 'cancelled',
                    source: 'protected_runner',
                    shell
                });
                return;
            }
        }
        // APPROVED EXECUTION (Low or User Confirmed)
        await this.auditLogger.log({
            command,
            riskLevel: analysis.overallRisk,
            riskScore: analysis.riskScore,
            matchedRules: analysis.findings.map((f) => f.id),
            decision: 'allowed',
            source: 'protected_runner',
            shell
        });
        this.executeInTerminal(command);
    }
    async analyzeOnly(prefilledCommand) {
        const command = prefilledCommand ||
            (await vscode.window.showInputBox({
                title: 'Safexec: Analyze Command',
                prompt: 'Enter the shell command to inspect without executing',
                placeHolder: 'e.g. curl https://example.com/install.sh | bash',
                ignoreFocusOut: true
            }));
        if (!command || !command.trim()) {
            return undefined;
        }
        const shell = shellDetector_1.ShellDetector.detectCurrentShell(vscode.window.activeTerminal);
        const analysis = this.riskEngine.analyze(command, shell);
        const explanation = await this.explanationProvider.getExplanation(analysis);
        await this.auditLogger.log({
            command,
            riskLevel: analysis.overallRisk,
            riskScore: analysis.riskScore,
            matchedRules: analysis.findings.map((f) => f.id),
            decision: 'analyzed',
            source: 'analyzer',
            shell
        });
        if (analysis.overallRisk === 'critical') {
            vscode.window.showErrorMessage(`Safexec Analysis: CRITICAL RISK (Score: ${analysis.riskScore}/100)`, { modal: true, detail: explanation }, 'Close');
        }
        else if (analysis.overallRisk === 'high') {
            vscode.window.showWarningMessage(`Safexec Analysis: HIGH RISK (Score: ${analysis.riskScore}/100)`, { modal: true, detail: explanation }, 'Close');
        }
        else if (analysis.overallRisk === 'medium') {
            vscode.window.showInformationMessage(`Safexec Analysis: MEDIUM RISK (Score: ${analysis.riskScore}/100)`, { detail: explanation }, 'Close');
        }
        else {
            vscode.window.showInformationMessage(`Safexec Analysis: LOW RISK (Score: ${analysis.riskScore}/100)\nNo dangerous patterns detected.`, 'Close');
        }
        return analysis;
    }
    executeInTerminal(command) {
        if (!this.protectedTerminal || this.protectedTerminal.exitStatus !== undefined) {
            this.protectedTerminal = vscode.window.createTerminal({
                name: 'Safexec Protected Terminal'
            });
        }
        this.protectedTerminal.show(false);
        this.protectedTerminal.sendText(command, true);
    }
}
exports.SafeRunner = SafeRunner;
//# sourceMappingURL=safeRunner.js.map