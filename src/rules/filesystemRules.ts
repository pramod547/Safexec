import { Finding, ParsedCommand, ParsedSegment, Rule } from '../core/types';

export const filesystemRules: Rule[] = [
  {
    id: 'FS001',
    name: 'Root / System Directory Deletion',
    category: 'filesystem',
    riskLevel: 'critical',
    description: 'Attempts to delete the filesystem root, user home, or critical system directory.',
    recommendedChecks: [
      'Verify target path is not / or a system directory.',
      'Check current working directory and relative paths.',
      'Ensure recursive flag is intentionally targeted at a specific temporary path.'
    ],
    evaluate: (segment: ParsedSegment, _full: ParsedCommand): Finding | null => {
      const raw = segment.raw.toLowerCase();
      const cmd = segment.command.toLowerCase();

      // Check Unix rm -rf / or rm -rf /* or rm -rf ~
      if (cmd === 'rm') {
        const hasRecurse = segment.args.some((a) => /^-[a-z]*r/i.test(a));
        const hasForce = segment.args.some((a) => /^-[a-z]*f/i.test(a));
        const targets = segment.args.filter((a) => !a.startsWith('-'));

        if (hasRecurse) {
          const isRootOrCritical = targets.some((t) =>
            ['/', '/*', '~', '$home', '/etc', '/bin', '/usr', '/var'].includes(t.toLowerCase())
          );
          if (isRootOrCritical || targets.length === 0) {
            return {
              id: 'FS001',
              ruleName: 'Root / System Directory Deletion',
              category: 'filesystem',
              riskLevel: 'critical',
              title: 'Critical Filesystem Deletion Detected',
              description: 'This command attempts to recursively delete root or critical system directories.',
              affectedTarget: targets.join(' ') || 'root',
              recommendedChecks: [
                'Abort immediately.',
                'Do not execute commands targeting / or $HOME recursively.'
              ],
              matchedSegment: segment.raw
            };
          }
        }
      }

      // Check Windows / PowerShell Remove-Item on root/drive
      if (cmd === 'remove-item' || cmd === 'rd' || cmd === 'rmdir') {
        const isRecurse = segment.args.some((a) => /-(r|recurse)/i.test(a) || /\/s/i.test(a));
        const targets = segment.args.filter((a) => !a.startsWith('-') && !a.startsWith('/'));
        const isRootTarget = targets.some((t) =>
          ['c:', 'c:\\', 'c:/', '\\', '/', '$env:systemroot', 'c:\\windows'].includes(t.toLowerCase())
        );

        if (isRecurse && isRootTarget) {
          return {
            id: 'FS001',
            ruleName: 'Root / System Directory Deletion',
            category: 'filesystem',
            riskLevel: 'critical',
            title: 'Critical Windows System Drive Deletion',
            description: 'This command attempts to recursively delete the system root or drive.',
            affectedTarget: targets.join(' '),
            recommendedChecks: [
              'Verify you are not wiping system drives or user profiles.',
              'Check destination path before proceeding.'
            ],
            matchedSegment: segment.raw
          };
        }
      }

      return null;
    }
  },
  {
    id: 'FS002',
    name: 'Recursive Forced File Deletion',
    category: 'filesystem',
    riskLevel: 'high',
    description: 'Recursively deletes files and directories with force without prompting.',
    recommendedChecks: [
      'List contents of the directory first (ls or dir).',
      'Verify the target path is not empty, parent folder (..), or current folder (.).',
      'Ensure you have backups of any uncommitted or critical files.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const cmd = segment.command.toLowerCase();

      // Unix rm -rf or rm -r -f
      if (cmd === 'rm') {
        const hasRecurse = segment.args.some((a) => /^-[a-z]*r/i.test(a));
        const hasForce = segment.args.some((a) => /^-[a-z]*f/i.test(a));
        if (hasRecurse && hasForce) {
          const targets = segment.args.filter((a) => !a.startsWith('-'));
          return {
            id: 'FS002',
            ruleName: 'Recursive Forced File Deletion',
            category: 'filesystem',
            riskLevel: 'high',
            title: 'Recursive Forced File Deletion (rm -rf)',
            description: 'Recursively removes directories and contents without confirmation prompts.',
            affectedTarget: targets.join(' ') || 'specified path',
            recommendedChecks: [
              'Check target directory contents before deleting.',
              'Verify current working directory matches expectations.'
            ],
            matchedSegment: segment.raw
          };
        }
      }

      // PowerShell Remove-Item -Recurse -Force
      if (cmd === 'remove-item') {
        const hasRecurse = segment.args.some((a) => /-(r|recurse)/i.test(a));
        const hasForce = segment.args.some((a) => /-(f|force)/i.test(a));
        if (hasRecurse && hasForce) {
          const targets = segment.args.filter((a) => !a.startsWith('-'));
          return {
            id: 'FS002',
            ruleName: 'Recursive Forced File Deletion',
            category: 'filesystem',
            riskLevel: 'high',
            title: 'PowerShell Recursive Forced Item Removal',
            description: 'Remove-Item with -Recurse and -Force deletes child items without warning.',
            affectedTarget: targets.join(' ') || 'specified path',
            recommendedChecks: [
              'Run with -WhatIf parameter first to preview deletions.',
              'Double check target paths.'
            ],
            matchedSegment: segment.raw
          };
        }
      }

      // CMD del /s /q or rmdir /s /q
      if (cmd === 'del' || cmd === 'rmdir' || cmd === 'rd') {
        const hasS = segment.args.some((a) => /\/s/i.test(a));
        const hasQ = segment.args.some((a) => /\/q/i.test(a));
        if (hasS && hasQ) {
          return {
            id: 'FS002',
            ruleName: 'Recursive Forced File Deletion',
            category: 'filesystem',
            riskLevel: 'high',
            title: 'CMD Silent Recursive Deletion',
            description: 'Deletes directories or subdirectories silently (/s /q).',
            affectedTarget: segment.args.filter((a) => !a.startsWith('/')).join(' ') || 'specified path',
            recommendedChecks: [
              'Verify directory path without /q first.',
              'Confirm files to be removed are obsolete.'
            ],
            matchedSegment: segment.raw
          };
        }
      }

      return null;
    }
  },
  {
    id: 'FS003',
    name: 'Disk and Filesystem Formatting',
    category: 'filesystem',
    riskLevel: 'critical',
    description: 'Disk partition formatting or repartitioning operation.',
    recommendedChecks: [
      'Double-check target disk/drive identifier.',
      'Ensure drive does not contain OS, workspace, or irreplaceable data.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const cmd = segment.command.toLowerCase();
      if (['mkfs', 'mkfs.ext4', 'mkfs.xfs', 'mkfs.vfat', 'format', 'fdisk', 'parted', 'diskpart'].includes(cmd)) {
        return {
          id: 'FS003',
          ruleName: 'Disk and Filesystem Formatting',
          category: 'filesystem',
          riskLevel: 'critical',
          title: 'Disk Formatting / Partition Tool Detected',
          description: `The command "${cmd}" can erase an entire filesystem or volume partition.`,
          affectedTarget: segment.args.join(' ') || 'storage volume',
          recommendedChecks: [
            'Check target volume carefully.',
            'Confirm data has been backed up.'
          ],
          matchedSegment: segment.raw
        };
      }
      return null;
    }
  },
  {
    id: 'FS004',
    name: 'Broad Recursive Permission Change',
    category: 'filesystem',
    riskLevel: 'high',
    description: 'Modifies permissions broadly or recursively, potentially creating severe security exposure.',
    recommendedChecks: [
      'Grant only the minimum required permissions.',
      'Avoid 777 or Everyone:(F) permissions on project directories.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const cmd = segment.command.toLowerCase();

      if (cmd === 'chmod') {
        const has777 = segment.args.some((a) => a === '777' || a === 'a+rwx' || a === '-R');
        const hasRecurse = segment.args.some((a) => /-[a-z]*R/i.test(a));
        if (has777 || (hasRecurse && segment.args.some((a) => a.includes('777')))) {
          return {
            id: 'FS004',
            ruleName: 'Broad Recursive Permission Change',
            category: 'filesystem',
            riskLevel: 'high',
            title: 'Permissive File Mode (chmod 777)',
            description: 'Grants read, write, and execute permissions to all users on target files.',
            affectedTarget: segment.args.slice(1).join(' ') || 'target path',
            recommendedChecks: [
              'Use specific permissions like 755 for executables or 644 for files.',
              'Never apply 777 recursively across project directories.'
            ],
            matchedSegment: segment.raw
          };
        }
      }

      if (cmd === 'icacls') {
        const grantEveryone = segment.args.some((a) => /grant.*everyone/i.test(a) || /grant.*builtin\\users/i.test(a));
        if (grantEveryone) {
          return {
            id: 'FS004',
            ruleName: 'Broad Recursive Permission Change',
            category: 'filesystem',
            riskLevel: 'high',
            title: 'Broad Windows ACL Modification (icacls)',
            description: 'Grants full or broad access to Everyone or all Users.',
            affectedTarget: segment.args[0] || 'target path',
            recommendedChecks: [
              'Restrict ACL grants to the active user account or group.',
              'Review inheritance settings.'
            ],
            matchedSegment: segment.raw
          };
        }
      }

      return null;
    }
  },
  {
    id: 'FS005',
    name: 'Direct Disk / Raw Device Write',
    category: 'filesystem',
    riskLevel: 'critical',
    description: 'Writes directly to a raw disk device or partitions using dd or direct redirection.',
    recommendedChecks: [
      'Inspect of= (output file) parameter carefully.',
      'Ensure destination is not /dev/sd* or /dev/nvme*.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const cmd = segment.command.toLowerCase();
      if (cmd === 'dd') {
        const ofArg = segment.args.find((a) => a.toLowerCase().startsWith('of='));
        if (ofArg && /\/dev\/(sd[a-z]|nvme[0-9]|disk[0-9])/i.test(ofArg)) {
          return {
            id: 'FS005',
            ruleName: 'Direct Disk / Raw Device Write',
            category: 'filesystem',
            riskLevel: 'critical',
            title: 'Direct Raw Block Device Overwrite (dd)',
            description: 'Command writes raw data directly to a storage device, which will destroy existing partitions.',
            affectedTarget: ofArg,
            recommendedChecks: [
              'Verify the device name.',
              'Ensure unmounting and partition accuracy.'
            ],
            matchedSegment: segment.raw
          };
        }
      }
      return null;
    }
  }
];
