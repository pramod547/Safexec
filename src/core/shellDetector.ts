import type * as vscodeTypes from 'vscode';
import { Platform, ShellType } from './types';

let vscodeModule: typeof vscodeTypes | undefined;
try {
  vscodeModule = require('vscode');
} catch {
  // Running in standalone Node or outside VS Code extension host
}

export class ShellDetector {
  public static getPlatform(): Platform {
    const p = process.platform;
    if (p === 'win32') return 'win32';
    if (p === 'linux') return 'linux';
    if (p === 'darwin') return 'darwin';
    return 'unknown';
  }

  public static detectCurrentShell(terminal?: vscodeTypes.Terminal): ShellType {
    const platform = this.getPlatform();

    // 1. Try to detect from active or provided VS Code terminal
    if (terminal) {
      const shellPath = (terminal.creationOptions as vscodeTypes.TerminalOptions)?.shellPath?.toLowerCase();
      if (shellPath) {
        if (shellPath.includes('pwsh') || shellPath.includes('powershell')) return 'powershell';
        if (shellPath.includes('cmd.exe')) return 'cmd';
        if (shellPath.includes('zsh')) return 'zsh';
        if (shellPath.includes('bash')) return 'bash';
      }
    }

    // 2. Check VS Code configuration for default profile
    if (vscodeModule && vscodeModule.workspace) {
      const config = vscodeModule.workspace.getConfiguration('terminal.integrated.defaultProfile');
      const profile =
        platform === 'win32'
          ? config.get<string>('windows')
          : platform === 'darwin'
            ? config.get<string>('osx')
            : config.get<string>('linux');

        if (profile) {
          const lowerProfile = profile.toLowerCase();
          if (lowerProfile.includes('powershell') || lowerProfile.includes('pwsh')) return 'powershell';
          if (lowerProfile.includes('cmd')) return 'cmd';
          if (lowerProfile.includes('zsh')) return 'zsh';
          if (lowerProfile.includes('bash')) return 'bash';
        }
      }

    // 3. Check environment variables
    const shellEnv = (process.env.SHELL || '').toLowerCase();
    if (shellEnv.includes('zsh')) return 'zsh';
    if (shellEnv.includes('bash')) return 'bash';
    if (shellEnv.includes('pwsh') || shellEnv.includes('powershell')) return 'powershell';
    if (shellEnv.includes('cmd.exe')) return 'cmd';

    // 4. Default based on platform
    if (platform === 'win32') {
      if (process.env.PSModulePath || process.env.POWERSHELL_DISTRIBUTION_CHANNEL) {
        return 'powershell';
      }
      return 'powershell';
    } else if (platform === 'darwin') {
      return 'zsh';
    } else if (platform === 'linux') {
      return 'bash';
    }

      return 'unknown';
    }
  }

