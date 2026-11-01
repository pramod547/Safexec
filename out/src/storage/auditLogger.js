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
exports.AuditLogger = void 0;
const vscode = __importStar(require("vscode"));
const secretRedactor_1 = require("../ai/secretRedactor");
class AuditLogger {
    static STORAGE_KEY = 'safexec.audit.history';
    context;
    constructor(context) {
        this.context = context;
    }
    async log(params) {
        const config = vscode.workspace.getConfiguration('safexec');
        const redactSecrets = config.get('history.redactSecrets', true);
        const maxEntries = config.get('history.maxEntries', 100);
        const commandText = redactSecrets ? secretRedactor_1.SecretRedactor.redact(params.command) : params.command;
        const entry = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: Date.now(),
            command: commandText,
            riskLevel: params.riskLevel,
            riskScore: params.riskScore,
            matchedRules: params.matchedRules,
            decision: params.decision,
            source: params.source,
            shell: params.shell
        };
        const history = this.getHistory();
        history.unshift(entry);
        if (history.length > maxEntries) {
            history.length = maxEntries;
        }
        await this.context.globalState.update(AuditLogger.STORAGE_KEY, history);
        return entry;
    }
    getHistory() {
        return this.context.globalState.get(AuditLogger.STORAGE_KEY, []);
    }
    async clearHistory() {
        await this.context.globalState.update(AuditLogger.STORAGE_KEY, []);
    }
    getStatistics() {
        const history = this.getHistory();
        const byRisk = {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
        };
        const byDecision = {
            analyzed: 0,
            allowed: 0,
            denied: 0,
            cancelled: 0,
            observed: 0
        };
        const bySource = {
            protected_runner: 0,
            terminal_observation: 0,
            analyzer: 0
        };
        for (const item of history) {
            if (byRisk[item.riskLevel] !== undefined) {
                byRisk[item.riskLevel]++;
            }
            if (byDecision[item.decision] !== undefined) {
                byDecision[item.decision]++;
            }
            if (bySource[item.source] !== undefined) {
                bySource[item.source]++;
            }
        }
        return {
            total: history.length,
            byRisk,
            byDecision,
            bySource
        };
    }
}
exports.AuditLogger = AuditLogger;
//# sourceMappingURL=auditLogger.js.map