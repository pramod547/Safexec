import { Finding, ParsedCommand, ParsedSegment, Rule } from '../core/types';

export const networkRules: Rule[] = [
  {
    id: 'NET001',
    name: 'Remote Script Piped to Shell',
    category: 'network',
    riskLevel: 'critical',
    description: 'Downloads a script from a remote URL and pipes it directly into a shell interpreter for execution.',
    recommendedChecks: [
      'Download the script file first to inspect its contents.',
      'Verify the domain, HTTPS certificate, and SHA-256 hash or signature of the script.',
      'Never pipe untrusted remote web responses directly to bash, sh, or iex.'
    ],
    evaluate: (segment: ParsedSegment, fullCommand: ParsedCommand): Finding | null => {
      const rawFull = fullCommand.raw.toLowerCase();

      // Check pipe patterns in compound or full command:
      // curl ... | bash, wget ... | sh, irm ... | iex
      const pipeMatch =
        /(curl|wget|fetch|invoke-webrequest|iwr|invoke-restmethod|irm)\b[^|;&]*\|\s*(bash|sh|zsh|dash|ksh|python|perl|powershell|pwsh|invoke-expression|iex)\b/i.test(
          rawFull
        );

      if (pipeMatch) {
        return {
          id: 'NET001',
          ruleName: 'Remote Script Piped to Shell',
          category: 'network',
          riskLevel: 'critical',
          title: 'Remote Script Execution via Pipe (curl | sh / irm | iex)',
          description: 'Piping remote web content directly into a shell allows untrusted remote code execution without inspection.',
          affectedTarget: 'system execution environment',
          recommendedChecks: [
            'Download the script locally first: curl -fsSL <url> -o script.sh',
            'Read and inspect script contents before execution.',
            'Confirm the author and source authenticity.'
          ],
          matchedSegment: segment.raw
        };
      }

      return null;
    }
  },
  {
    id: 'NET002',
    name: 'Insecure Download and Immediate Execution',
    category: 'network',
    riskLevel: 'high',
    description: 'Downloads an executable or script and immediately marks it executable and runs it.',
    recommendedChecks: [
      'Inspect downloaded file contents prior to running.',
      'Ensure the source is a trusted developer or official repository.'
    ],
    evaluate: (segment: ParsedSegment, fullCommand: ParsedCommand): Finding | null => {
      const raw = fullCommand.raw.toLowerCase();
      const chainedRun =
        /(curl|wget).+&&\s*(chmod\s+\+x\s+.+&&\s*)?\.\/[a-z0-9_\-\.]+/i.test(raw) ||
        /invoke-webrequest.+;\s*start-process/i.test(raw);

      if (chainedRun) {
        return {
          id: 'NET002',
          ruleName: 'Insecure Download and Immediate Execution',
          category: 'network',
          riskLevel: 'high',
          title: 'Chained Download and Execution',
          description: 'Downloads an external file and executes it immediately in the same command chain.',
          affectedTarget: 'downloaded file',
          recommendedChecks: [
            'Separate download and execution into distinct steps.',
            'Review the script or binary hash before launching.'
          ],
          matchedSegment: segment.raw
        };
      }
      return null;
    }
  },
  {
    id: 'NET003',
    name: 'Reverse Shell / Remote Command Redirection',
    category: 'network',
    riskLevel: 'critical',
    description: 'Known reverse shell pattern directing interactive shell I/O to a network socket.',
    recommendedChecks: [
      'Immediately verify command source.',
      'Do not execute commands containing /dev/tcp or nc -e redirects.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const raw = segment.raw.toLowerCase();
      const isReverseShell =
        /\/dev\/tcp\/[0-9a-z\.\-_]+\/[0-9]+/i.test(raw) ||
        /\bnc(\.traditional)?\s+.*-e\s+(\/bin\/)?(sh|bash)/i.test(raw) ||
        /\bncat\s+.*-e\s+(\/bin\/)?(sh|bash)/i.test(raw) ||
        /\bsocat\s+exec:.*pty/i.test(raw);

      if (isReverseShell) {
        return {
          id: 'NET003',
          ruleName: 'Reverse Shell / Remote Command Redirection',
          category: 'network',
          riskLevel: 'critical',
          title: 'Reverse Shell Construction Detected',
          description: 'This command establishes an interactive shell attached to a remote network socket.',
          affectedTarget: 'network socket connection',
          recommendedChecks: [
            'Reject this command immediately.',
            'Inspect origin if copied from untrusted clipboard or prompt.'
          ],
          matchedSegment: segment.raw
        };
      }
      return null;
    }
  },
  {
    id: 'NET004',
    name: 'Disabled TLS / Certificate Check',
    category: 'network',
    riskLevel: 'medium',
    description: 'Disables SSL / TLS certificate validation for network requests.',
    recommendedChecks: [
      'Remove --insecure or -k flag.',
      'Install the required root certificate rather than disabling verification.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const cmd = segment.command.toLowerCase();
      if (cmd === 'curl' && segment.args.some((a) => a === '-k' || a === '--insecure')) {
        return {
          id: 'NET004',
          ruleName: 'Disabled TLS / Certificate Check',
          category: 'network',
          riskLevel: 'medium',
          title: 'Insecure TLS Certificate Verification (curl -k)',
          description: 'Disables TLS certificate verification, leaving connections susceptible to Man-in-the-Middle attacks.',
          affectedTarget: 'remote network connection',
          recommendedChecks: [
            'Verify server certificates with official CA bundle.',
            'Avoid bypassing certificate validation.'
          ],
          matchedSegment: segment.raw
        };
      }
      if (cmd === 'wget' && segment.args.some((a) => a === '--no-check-certificate')) {
        return {
          id: 'NET004',
          ruleName: 'Disabled TLS / Certificate Check',
          category: 'network',
          riskLevel: 'medium',
          title: 'Insecure TLS Certificate Verification (wget --no-check-certificate)',
          description: 'Bypasses SSL/TLS certificate verification on download.',
          affectedTarget: 'remote network connection',
          recommendedChecks: [
            'Validate the certificate chain properly.',
            'Check system CA store.'
          ],
          matchedSegment: segment.raw
        };
      }
      return null;
    }
  }
];
