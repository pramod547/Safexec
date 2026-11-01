import { Finding, ParsedCommand, ParsedSegment, Rule } from '../core/types';

export const packageRules: Rule[] = [
  {
    id: 'PKG001',
    name: 'Bypass Package Lifecycle Scripts Check',
    category: 'package',
    riskLevel: 'medium',
    description: 'Installs packages ignoring lifecycle scripts or disabling security protections.',
    recommendedChecks: [
      'Ensure dependency source is trusted.',
      'Check if package actually requires postinstall scripts to build.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const cmd = segment.command.toLowerCase();
      if (cmd === 'npm' || cmd === 'pnpm' || cmd === 'yarn') {
        const hasIgnoreScripts = segment.args.some((a) => a.toLowerCase() === '--ignore-scripts');
        if (hasIgnoreScripts) {
          return {
            id: 'PKG001',
            ruleName: 'Bypass Package Lifecycle Scripts Check',
            category: 'package',
            riskLevel: 'medium',
            title: 'Package Lifecycle Script Bypass (--ignore-scripts)',
            description: 'Lifecycle scripts are skipped during package installation.',
            affectedTarget: 'installed node modules',
            recommendedChecks: [
              'Review if dependent packages will compile or function correctly without install hooks.',
              'Audit package source repository.'
            ],
            matchedSegment: segment.raw
          };
        }
      }
      return null;
    }
  },
  {
    id: 'PKG002',
    name: 'Insecure or Custom Package Registry',
    category: 'package',
    riskLevel: 'medium',
    description: 'Installs packages from an unencrypted HTTP registry or non-standard package index.',
    recommendedChecks: [
      'Ensure registry uses HTTPS.',
      'Verify registry URL against organizational allowed package sources.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const raw = segment.raw.toLowerCase();
      if (
        raw.includes('--registry http://') ||
        raw.includes('--index-url http://') ||
        raw.includes('--extra-index-url http://')
      ) {
        return {
          id: 'PKG002',
          ruleName: 'Insecure or Custom Package Registry',
          category: 'package',
          riskLevel: 'medium',
          title: 'Unencrypted Package Registry (HTTP)',
          description: 'Package registry configured over unencrypted HTTP protocol, susceptible to tampering.',
          affectedTarget: 'package repository',
          recommendedChecks: [
            'Change repository protocol from http:// to https://.',
            'Confirm package manager lockfile matches intended registry hashes.'
          ],
          matchedSegment: segment.raw
        };
      }
      return null;
    }
  },
  {
    id: 'PKG003',
    name: 'Break System Packages',
    category: 'package',
    riskLevel: 'high',
    description: 'Installs packages globally overriding system-managed Python package boundaries.',
    recommendedChecks: [
      'Use a virtual environment (python -m venv .venv) instead.',
      'Use pipx for standalone command-line tools.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const raw = segment.raw.toLowerCase();
      if (raw.includes('--break-system-packages')) {
        return {
          id: 'PKG003',
          ruleName: 'Break System Packages',
          category: 'package',
          riskLevel: 'high',
          title: 'System Python Integrity Override (--break-system-packages)',
          description: 'Overriding system package protection can break operating-system package managers and system tools.',
          affectedTarget: 'OS-managed Python environment',
          recommendedChecks: [
            'Create an isolated virtualenv: "python3 -m venv .venv".',
            'Activate the virtual environment before installing packages.',
            'Use pipx for CLI utilities.'
          ],
          matchedSegment: segment.raw
        };
      }
      return null;
    }
  },
  {
    id: 'PKG004',
    name: 'Global Elevated Package Installation',
    category: 'package',
    riskLevel: 'medium',
    description: 'Installs global packages with elevated (sudo/admin) privileges.',
    recommendedChecks: [
      'Prefer user-level global directory or local development dependencies.',
      'Avoid running npm or pip with root privileges.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const raw = segment.raw.toLowerCase();
      if (
        (raw.startsWith('sudo npm install -g') ||
          raw.startsWith('sudo npm i -g') ||
          raw.startsWith('sudo pip install')) &&
        !raw.includes('--user')
      ) {
        return {
          id: 'PKG004',
          ruleName: 'Global Elevated Package Installation',
          category: 'package',
          riskLevel: 'medium',
          title: 'Privileged Global Package Install (sudo npm/pip)',
          description: 'Running package managers as superuser can allow untrusted post-install scripts to compromise root.',
          affectedTarget: 'global system directories',
          recommendedChecks: [
            'Configure npm global prefix inside user home directory.',
            'Use virtual environments or user-scoped installs.'
          ],
          matchedSegment: segment.raw
        };
      }
      return null;
    }
  }
];

