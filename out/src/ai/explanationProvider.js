"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplanationProvider = void 0;
const secretRedactor_1 = require("./secretRedactor");
class ExplanationProvider {
    config;
    constructor(config) {
        this.config = config;
    }
    updateConfig(config) {
        this.config = config;
    }
    async getExplanation(result) {
        if (!this.config.aiEnabled) {
            return this.generateDeterministicSummary(result);
        }
        const sanitizedCommand = secretRedactor_1.SecretRedactor.redact(result.command);
        if (this.config.aiEndpoint && this.config.aiApiKey) {
            try {
                const response = await fetch(this.config.aiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.config.aiApiKey}`
                    },
                    body: JSON.stringify({
                        command: sanitizedCommand,
                        shell: result.shell,
                        findings: result.findings.map((f) => ({
                            rule: f.ruleName,
                            risk: f.riskLevel,
                            target: f.affectedTarget
                        }))
                    })
                });
                if (response.ok) {
                    const data = (await response.json());
                    if (data && data.explanation) {
                        return `[AI Advisory] ${data.explanation}`;
                    }
                }
            }
            catch (err) {
                // Fallback gracefully without breaking execution flow
            }
        }
        return this.generateDeterministicSummary(result, sanitizedCommand);
    }
    generateDeterministicSummary(result, commandText) {
        const cmd = commandText || result.command;
        if (result.findings.length === 0) {
            return `Safexec analyzed command: "${cmd}". No risky patterns detected by the offline rule engine.`;
        }
        const lines = [
            `Safexec Risk Assessment: ${result.overallRisk.toUpperCase()} (Score: ${result.riskScore}/100)`,
            `Command: ${cmd}`,
            '',
            'Key Findings:'
        ];
        for (const f of result.findings) {
            lines.push(`• [${f.riskLevel.toUpperCase()}] ${f.title}: ${f.description}`);
            if (f.recommendedChecks && f.recommendedChecks.length > 0) {
                lines.push(`  Checks: ${f.recommendedChecks.join('; ')}`);
            }
        }
        return lines.join('\n');
    }
}
exports.ExplanationProvider = ExplanationProvider;
//# sourceMappingURL=explanationProvider.js.map