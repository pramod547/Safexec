export class SecretRedactor {
  private static readonly REDACTION_PATTERNS: { pattern: RegExp; replacement: string }[] = [
    // Database connection strings: postgres://user:password@host or mongodb://user:pass@host
    {
      pattern: /(:\/\/)([^:\s]+):([^@\s]+)@/g,
      replacement: '$1$2:***REDACTED_PASSWORD***@'
    },
    // Private keys
    {
      pattern: /-----BEGIN\s+[A-Z\s]+PRIVATE\s+KEY-----[\s\S]*?-----END\s+[A-Z\s]+PRIVATE\s+KEY-----/gi,
      replacement: '***REDACTED_PRIVATE_KEY***'
    },
    // GitHub Personal Access Tokens
    {
      pattern: /\b(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}\b/g,
      replacement: '***REDACTED_GITHUB_TOKEN***'
    },
    // GitLab Personal Access Tokens
    {
      pattern: /\bglpat-[a-zA-Z0-9\-_]{20,}\b/g,
      replacement: '***REDACTED_GITLAB_TOKEN***'
    },
    // AWS Access Key ID
    {
      pattern: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
      replacement: '***REDACTED_AWS_KEY_ID***'
    },
    // OpenAI / general API keys starting with sk-
    {
      pattern: /\bsk-[a-zA-Z0-9_\-]{20,}\b/g,
      replacement: '***REDACTED_API_KEY***'
    },
    // Authorization: Bearer tokens
    {
      pattern: /(Bearer\s+)[A-Za-z0-9_\-\.]{16,}/gi,
      replacement: '$1***REDACTED_BEARER_TOKEN***'
    },
    // CLI password flags: -p password, --password password, --password=password
    {
      pattern: /(--password\s+|=\s*|--pass\s+|=\s*|-p\s+)([^\s"']+)/gi,
      replacement: '$1***REDACTED***'
    },
    // Common environment variable assignments with secrets
    {
      pattern: /\b([A-Za-z0-9_]*(?:SECRET|PASSWORD|PASSWD|API_?KEY|TOKEN|AUTH)[A-Za-z0-9_]*=)([^\s"']+)/gi,
      replacement: '$1***REDACTED***'
    }
  ];

  public static redact(text: string): string {
    if (!text) return text;
    let result = text;
    for (const { pattern, replacement } of this.REDACTION_PATTERNS) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }
}

