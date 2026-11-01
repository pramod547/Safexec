import * as readline from 'readline';
import { RiskEngine } from './core/riskEngine';
import { ShellDetector } from './core/shellDetector';
import { PolicyEngine } from './policy/policyEngine';
import { SecretRedactor } from './ai/secretRedactor';

const riskEngine = new RiskEngine();
const policyEngine = new PolicyEngine();
const detectedShell = ShellDetector.detectCurrentShell();

console.log('====================================================');
console.log('            SAFEXEC COMMAND GUARD DEMO             ');
console.log('====================================================');
console.log(`Detected Platform Shell: ${detectedShell.toUpperCase()}`);
console.log('Type any terminal command to inspect risk level.');
console.log('Type "exit" or press Ctrl+C to quit.\n');

const sampleCommands = [
  'rm -rf /',
  'git reset --hard HEAD~1',
  'curl -sSL https://example.com/install.sh | bash',
  'psql postgres://admin:secret123@localhost:5432/mydb -c "DROP DATABASE production;"',
  'npm run build && git status'
];

console.log('Quick suggestions to try:');
sampleCommands.forEach((cmd, idx) => {
  console.log(` [${idx + 1}] ${cmd}`);
});
console.log('----------------------------------------------------\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptUser() {
  rl.question('safexec> ', (input) => {
    const trimmed = input.trim();
    if (!trimmed) {
      promptUser();
      return;
    }

    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
    }

    // Check if user selected 1-5
    const num = parseInt(trimmed, 10);
    const cmdToTest = num >= 1 && num <= sampleCommands.length ? sampleCommands[num - 1] : trimmed;

    const redacted = SecretRedactor.redact(cmdToTest);
    const analysis = riskEngine.analyze(cmdToTest, detectedShell);
    const decision = policyEngine.evaluate(analysis);

    const colors = {
      reset: '\x1b[0m',
      critical: '\x1b[31;1m', // Bright Red
      high: '\x1b[33;1m',     // Bright Yellow
      medium: '\x1b[36m',      // Cyan
      low: '\x1b[32m'          // Green
    };

    const riskColor = colors[analysis.overallRisk] || colors.reset;

    console.log('\n--- Safexec Analysis Result ---');
    console.log(`Input Command : ${redacted}`);
    console.log(`Risk Level    : ${riskColor}${analysis.overallRisk.toUpperCase()}${colors.reset} (Score: ${analysis.riskScore}/100)`);
    console.log(`Policy Action : ${decision.toUpperCase()}`);

    if (analysis.findings.length > 0) {
      console.log('Findings:');
      analysis.findings.forEach((f) => {
        console.log(`  • [${f.id}] ${f.title}`);
        console.log(`    Detail : ${f.description}`);
        if (f.recommendedChecks.length > 0) {
          console.log(`    Checks : ${f.recommendedChecks.join(' | ')}`);
        }
      });
    } else {
      console.log('Findings      : No dangerous patterns identified (clean baseline).');
    }

    console.log('--------------------------------\n');
    promptUser();
  });
}

promptUser();
