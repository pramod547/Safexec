import { SafexecConfig } from '../core/types';

export const DEFAULT_SAFEXEC_CONFIG: SafexecConfig = {
  criticalAction: 'deny',
  highAction: 'confirm',
  mediumAction: 'prompt',
  terminalMonitorEnabled: true,
  maxHistoryEntries: 100,
  redactSecrets: true,
  aiEnabled: false
};
