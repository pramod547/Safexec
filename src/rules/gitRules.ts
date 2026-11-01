import { Finding, ParsedCommand, ParsedSegment, Rule } from '../core/types';

export const gitRules: Rule[] = [
  {
    id: 'GIT001',
    name: 'Git Hard Reset',
    category: 'git',
    riskLevel: 'high',
    description: 'Resets working tree and index. Discards all uncommitted changes permanently.',
    recommendedChecks: [
      'Run "git status" to review uncommitted changes.',
      'Run "git diff" to verify what will be discarded.',
      'Commit your work or use "git stash" before resetting.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const cmd = segment.command.toLowerCase();
      if (cmd === 'git') {
        const subCmd = segment.args[0]?.toLowerCase();
        if (subCmd === 'reset') {
          const hasHard = segment.args.some((a) => a.toLowerCase() === '--hard');
          if (hasHard) {
            const targetCommit = segment.args.find((a, idx) => idx > 0 && !a.startsWith('-')) || 'HEAD';
            return {
              id: 'GIT001',
              ruleName: 'Git Hard Reset',
              category: 'git',
              riskLevel: 'high',
              title: 'Git Hard Reset (git reset --hard)',
              description: 'This can discard uncommitted changes in the working tree and index permanently.',
              affectedTarget: targetCommit,
              recommendedChecks: [
                'Run "git status" to inspect pending modifications.',
                'Run "git diff" to inspect modified code.',
                'Run "git stash" to save current progress safely.'
              ],
              matchedSegment: segment.raw
            };
          }
        }
      }
      return null;
    }
  },
  {
    id: 'GIT002',
    name: 'Destructive Git Clean',
    category: 'git',
    riskLevel: 'high',
    description: 'Removes untracked files and directories permanently from the working tree.',
    recommendedChecks: [
      'Run "git clean -nd" (dry-run) first to preview which files will be deleted.',
      'Check if any newly created source files are untracked.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const cmd = segment.command.toLowerCase();
      if (cmd === 'git') {
        const subCmd = segment.args[0]?.toLowerCase();
        if (subCmd === 'clean') {
          const hasForce = segment.args.some((a) => /-[a-z]*f/i.test(a) || a.toLowerCase() === '--force');
          const isDryRun = segment.args.some((a) => /-[a-z]*n/i.test(a) || a.toLowerCase() === '--dry-run');

          if (hasForce && !isDryRun) {
            const removesIgnored = segment.args.some((a) => /-[a-z]*x/i.test(a));
            return {
              id: 'GIT002',
              ruleName: 'Destructive Git Clean',
              category: 'git',
              riskLevel: 'high',
              title: 'Destructive Git Clean (git clean -f)',
              description: `Deletes untracked ${removesIgnored ? 'and ignored ' : ''}files without moving to trash.`,
              affectedTarget: 'untracked repository files',
              recommendedChecks: [
                'Run "git clean -nd" first to preview untracked files to be deleted.',
                'Ensure .env or local config files are not unintentionally deleted.'
              ],
              matchedSegment: segment.raw
            };
          }
        }
      }
      return null;
    }
  },
  {
    id: 'GIT003',
    name: 'Git Force Push',
    category: 'git',
    riskLevel: 'high',
    description: 'Overwrites remote branch history, potentially destroying collaborators’ commits.',
    recommendedChecks: [
      'Ensure you are pushing to a feature branch, not main/master.',
      'Consider using "--force-with-lease" if a forced push is necessary.',
      'Communicate with team members who may have pulled the remote branch.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const cmd = segment.command.toLowerCase();
      if (cmd === 'git') {
        const subCmd = segment.args[0]?.toLowerCase();
        if (subCmd === 'push') {
          const hasForce = segment.args.some((a) =>
            ['-f', '--force', '--force-with-lease'].includes(a.toLowerCase()) ||
            (a.startsWith('+') && a.length > 1)
          );

          if (hasForce) {
            const remoteTarget = segment.args.filter((a, idx) => idx > 0 && !a.startsWith('-')).join(' ') || 'remote';
            return {
              id: 'GIT003',
              ruleName: 'Git Force Push',
              category: 'git',
              riskLevel: 'high',
              title: 'Git Force Push Detected',
              description: 'Force pushing rewrites remote branch history and can discard upstream commits.',
              affectedTarget: remoteTarget,
              recommendedChecks: [
                'Verify target branch is not protected (e.g. main/master/production).',
                'Verify "git log" against "git log @{u}" before pushing.',
                'Prefer "--force-with-lease" instead of "--force".'
              ],
              matchedSegment: segment.raw
            };
          }
        }
      }
      return null;
    }
  },
  {
    id: 'GIT004',
    name: 'Forced Branch Deletion',
    category: 'git',
    riskLevel: 'medium',
    description: 'Deletes a Git branch even if its changes are unmerged.',
    recommendedChecks: [
      'Confirm the branch commits are merged into your target branch.',
      'Use "-d" instead of "-D" to safely check merge status.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const cmd = segment.command.toLowerCase();
      if (cmd === 'git') {
        const subCmd = segment.args[0]?.toLowerCase();
        if (subCmd === 'branch') {
          const hasBigD = segment.args.some((a) => a === '-D' || a === '--delete --force');
          if (hasBigD) {
            const branchName = segment.args.find((a, idx) => idx > 0 && !a.startsWith('-')) || 'branch';
            return {
              id: 'GIT004',
              ruleName: 'Forced Branch Deletion',
              category: 'git',
              riskLevel: 'medium',
              title: 'Forced Git Branch Deletion (git branch -D)',
              description: `Deletes branch "${branchName}" even if it contains unmerged commits.`,
              affectedTarget: branchName,
              recommendedChecks: [
                'Try "git branch -d <branch>" first to ensure all commits are merged.',
                'Record the branch commit hash before deleting.'
              ],
              matchedSegment: segment.raw
            };
          }
        }
      }
      return null;
    }
  },
  {
    id: 'GIT005',
    name: 'Discard Working Directory Changes',
    category: 'git',
    riskLevel: 'medium',
    description: 'Discards uncommitted changes in current directory using git checkout or git restore.',
    recommendedChecks: [
      'Check modified files with "git status".',
      'Use "git stash" if you might need these edits later.'
    ],
    evaluate: (segment: ParsedSegment): Finding | null => {
      const cmd = segment.command.toLowerCase();
      if (cmd === 'git') {
        const subCmd = segment.args[0]?.toLowerCase();
        const hasDot = segment.args.some((a) => a === '.' || a === '*');
        if ((subCmd === 'checkout' && segment.args.includes('--') && hasDot) ||
            (subCmd === 'restore' && hasDot)) {
          return {
            id: 'GIT005',
            ruleName: 'Discard Working Directory Changes',
            category: 'git',
            riskLevel: 'medium',
            title: 'Discard Working Tree Changes (git restore/checkout .)',
            description: 'Reverts local modifications to files in the working directory.',
            affectedTarget: 'all modified files in current path',
            recommendedChecks: [
              'Run "git diff" to see the edits you are about to discard.',
              'Stash them instead: "git stash push -m backup".'
            ],
            matchedSegment: segment.raw
          };
        }
      }
      return null;
    }
  }
];
