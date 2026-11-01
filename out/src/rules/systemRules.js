"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemRules = void 0;
exports.systemRules = [
    {
        id: 'SYS001',
        name: 'System Shutdown or Restart',
        category: 'system',
        riskLevel: 'critical',
        description: 'Triggers an immediate or scheduled host system shutdown or restart.',
        recommendedChecks: [
            'Ensure you do not have unsaved files, background services, or remote sessions active.',
            'Check if command is intended for a virtual machine or the local workstation.'
        ],
        evaluate: (segment) => {
            const cmd = segment.command.toLowerCase();
            const raw = segment.raw.toLowerCase();
            if (['shutdown', 'reboot', 'poweroff', 'init', 'halt'].includes(cmd)) {
                if (cmd === 'init' && !['0', '6'].includes(segment.args[0])) {
                    return null;
                }
                return {
                    id: 'SYS001',
                    ruleName: 'System Shutdown or Restart',
                    category: 'system',
                    riskLevel: 'critical',
                    title: `System Power Operation (${cmd.toUpperCase()})`,
                    description: `This command will terminate the operating system session or restart the machine.`,
                    affectedTarget: 'host machine',
                    recommendedChecks: [
                        'Save all unsaved work in IDE and other applications.',
                        'Verify machine target before triggering shutdown.'
                    ],
                    matchedSegment: segment.raw
                };
            }
            if (['stop-computer', 'restart-computer'].includes(cmd)) {
                return {
                    id: 'SYS001',
                    ruleName: 'System Shutdown or Restart',
                    category: 'system',
                    riskLevel: 'critical',
                    title: `PowerShell Host Shutdown (${cmd})`,
                    description: 'PowerShell cmdlet to shutdown or restart the computer.',
                    affectedTarget: 'host machine',
                    recommendedChecks: [
                        'Save all work across all open applications.',
                        'Confirm intention to restart workstation.'
                    ],
                    matchedSegment: segment.raw
                };
            }
            return null;
        }
    },
    {
        id: 'SYS002',
        name: 'Stop or Disable System Services',
        category: 'system',
        riskLevel: 'high',
        description: 'Stops or disables system background services or daemons.',
        recommendedChecks: [
            'Confirm the service name and whether other dependent services will be impacted.',
            'Check service status with systemctl status or Get-Service.'
        ],
        evaluate: (segment) => {
            const cmd = segment.command.toLowerCase();
            const raw = segment.raw.toLowerCase();
            // systemctl stop / disable / mask
            if (cmd === 'systemctl') {
                const action = segment.args[0]?.toLowerCase();
                if (['stop', 'disable', 'mask'].includes(action)) {
                    const serviceName = segment.args[1] || 'service';
                    return {
                        id: 'SYS002',
                        ruleName: 'Stop or Disable System Services',
                        category: 'system',
                        riskLevel: 'high',
                        title: `Systemd Service Interruption (${action})`,
                        description: `Interpreted systemctl ${action} for service "${serviceName}".`,
                        affectedTarget: serviceName,
                        recommendedChecks: [
                            'Verify service dependencies.',
                            'Ensure production or essential development databases/servers are not disrupted.'
                        ],
                        matchedSegment: segment.raw
                    };
                }
            }
            // Stop-Service or sc stop or net stop
            if (cmd === 'stop-service' || (cmd === 'sc' && segment.args[0]?.toLowerCase() === 'stop') || (cmd === 'net' && segment.args[0]?.toLowerCase() === 'stop')) {
                const serviceName = segment.args[1] || segment.args[0] || 'service';
                return {
                    id: 'SYS002',
                    ruleName: 'Stop or Disable System Services',
                    category: 'system',
                    riskLevel: 'high',
                    title: 'Windows Service Stoppage',
                    description: `Halts execution of Windows service "${serviceName}".`,
                    affectedTarget: serviceName,
                    recommendedChecks: [
                        'Check service dependencies before stopping.',
                        'Verify you have privileges to restart the service later.'
                    ],
                    matchedSegment: segment.raw
                };
            }
            return null;
        }
    },
    {
        id: 'SYS003',
        name: 'Resource Exhaustion / Fork Bomb',
        category: 'system',
        riskLevel: 'critical',
        description: 'Self-replicating recursion designed to exhaust process table or system memory.',
        recommendedChecks: [
            'Do not execute under any circumstances.',
            'Close terminal or script containing this string.'
        ],
        evaluate: (segment, fullCommand) => {
            const raw = fullCommand.raw;
            const isForkBomb = /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/i.test(raw) ||
                /\$0\s*\|\s*\$0\s*&/i.test(raw) ||
                /%0\s*\|\s*%0/i.test(raw);
            if (isForkBomb) {
                return {
                    id: 'SYS003',
                    ruleName: 'Resource Exhaustion / Fork Bomb',
                    category: 'system',
                    riskLevel: 'critical',
                    title: 'Fork Bomb / Exhaustion Pattern Detected',
                    description: 'This command recursively replicates processes until system crash or freeze.',
                    affectedTarget: 'system kernel process table',
                    recommendedChecks: [
                        'Abort immediately.',
                        'Never execute self-calling piped functions.'
                    ],
                    matchedSegment: segment.raw
                };
            }
            return null;
        }
    },
    {
        id: 'SYS004',
        name: 'Elevated Root Shell Invocation',
        category: 'system',
        riskLevel: 'medium',
        description: 'Opens an interactive superuser shell or unrestricted root environment.',
        recommendedChecks: [
            'Run individual commands with sudo rather than switching to an unrestricted root shell.',
            'Exit the root shell promptly when maintenance is complete.'
        ],
        evaluate: (segment) => {
            const raw = segment.raw.toLowerCase();
            if (raw === 'sudo su' || raw === 'sudo -i' || raw === 'sudo bash' || raw === 'sudo sh' || raw === 'su -') {
                return {
                    id: 'SYS004',
                    ruleName: 'Elevated Root Shell Invocation',
                    category: 'system',
                    riskLevel: 'medium',
                    title: 'Unrestricted Root Shell Invocation',
                    description: 'Opens an interactive superuser shell session with global system permissions.',
                    affectedTarget: 'interactive user session',
                    recommendedChecks: [
                        'Use targeted single commands with sudo instead.',
                        'Exercise extra caution while executing commands as root.'
                    ],
                    matchedSegment: segment.raw
                };
            }
            return null;
        }
    }
];
//# sourceMappingURL=systemRules.js.map