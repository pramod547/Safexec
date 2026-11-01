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
exports.ShellDetector = void 0;
const vscode = __importStar(require("vscode"));
class ShellDetector {
    static getPlatform() {
        const p = process.platform;
        if (p === 'win32')
            return 'win32';
        if (p === 'linux')
            return 'linux';
        if (p === 'darwin')
            return 'darwin';
        return 'unknown';
    }
    static detectCurrentShell(terminal) {
        const platform = this.getPlatform();
        // 1. Try to detect from active or provided VS Code terminal
        if (terminal) {
            const shellPath = terminal.creationOptions?.shellPath?.toLowerCase();
            if (shellPath) {
                if (shellPath.includes('pwsh') || shellPath.includes('powershell'))
                    return 'powershell';
                if (shellPath.includes('cmd.exe'))
                    return 'cmd';
                if (shellPath.includes('zsh'))
                    return 'zsh';
                if (shellPath.includes('bash'))
                    return 'bash';
            }
        }
        // 2. Check VS Code configuration for default profile
        const config = vscode.workspace.getConfiguration('terminal.integrated.defaultProfile');
        const profile = platform === 'win32'
            ? config.get('windows')
            : platform === 'darwin'
                ? config.get('osx')
                : config.get('linux');
        if (profile) {
            const lowerProfile = profile.toLowerCase();
            if (lowerProfile.includes('powershell') || lowerProfile.includes('pwsh'))
                return 'powershell';
            if (lowerProfile.includes('cmd'))
                return 'cmd';
            if (lowerProfile.includes('zsh'))
                return 'zsh';
            if (lowerProfile.includes('bash'))
                return 'bash';
        }
        // 3. Check environment variables
        const shellEnv = (process.env.SHELL || process.env.ComSpec || '').toLowerCase();
        if (shellEnv.includes('zsh'))
            return 'zsh';
        if (shellEnv.includes('bash'))
            return 'bash';
        if (shellEnv.includes('pwsh') || shellEnv.includes('powershell'))
            return 'powershell';
        if (shellEnv.includes('cmd.exe'))
            return 'cmd';
        // 4. Default based on platform
        if (platform === 'win32') {
            return 'powershell';
        }
        else if (platform === 'darwin') {
            return 'zsh';
        }
        else if (platform === 'linux') {
            return 'bash';
        }
        return 'unknown';
    }
}
exports.ShellDetector = ShellDetector;
//# sourceMappingURL=shellDetector.js.map