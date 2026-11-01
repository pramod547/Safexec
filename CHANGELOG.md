# Change Log

All notable changes to the "safexec" extension will be documented in this file.

## [0.1.0] - 2026-11-01

### Added
- **Initial release of Safexec** — Safer terminal commands. Smarter execution.
- **Offline Risk Engine**:
  - Deterministic evaluation of risky command patterns across 6 categories: Filesystem, Git, Database, Network, Package management, and System.
  - Risk categorization: Low, Medium, High, Critical.
- **Protected Runner**:
  - Primary pre-execution safety boundary (`Safexec: Run Protected Command`).
  - Critical risk default-deny policy.
  - High risk explicit confirmation dialog with explanation.
  - Medium risk review prompt.
- **Shell-Aware Parsing & Detection**:
  - Compound command splitting (`&&`, `||`, `;`, `|`).
  - Subshell / dynamic substitution detection (`$(...)`, `eval`, `iex`).
  - Shell detection for PowerShell, Windows CMD, Bash, and Zsh.
  - PowerShell cmdlet alias normalization (`rm` -> `Remove-Item`, `irm` -> `Invoke-RestMethod`, etc.).
- **Terminal Shell Integration Observer**:
  - Best-effort observation of direct-terminal commands with execution notices.
- **Audit History & Privacy**:
  - Local globalState bounded history.
  - Automated secret redaction for API keys, bearer tokens, passwords, and connection strings.
  - Clear history command (`Safexec: Clear Audit History`).
- **Security Dashboard**:
  - Interactive Webview dashboard (`Safexec: Show Security Dashboard`) with risk metrics and recent activity.
  - Side bar tree views for Findings and Audit History.
- **Advisory AI Support**:
  - Opt-in explanation provider that cannot override local deterministic security policies.

