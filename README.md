<p align="center">
  <img src="media/icon.png" width="160" height="160" alt="Safexec Logo" />
</p>

# Safexec

> **Safer terminal commands. Smarter execution.**

Safexec is a cross-platform Visual Studio Code extension designed to help developers identify risky terminal commands before running them through a protected workflow.

It analyzes commands, explains potentially harmful effects, assigns a deterministic risk level, and applies configurable execution policies. Safexec works offline for its core security checks, with optional AI assistance for richer explanations.

---

## Features

### 1. Protected Runner (`Safexec: Run Protected Command`)
The Protected Runner is the primary pre-execution safety boundary:
- Analyzes commands offline before sending them to the terminal.
- **Critical Risk**: Denied by default (`rm -rf /`, `DROP DATABASE`, `curl | bash`, fork bombs).
- **High Risk**: Requires explicit user confirmation (`git reset --hard`, `git push --force`, `del /s /q`).
- **Medium Risk**: Displays review prompts.
- **Low Risk**: Allowed with safety audit trail.

### 2. Standalone Analyzer (`Safexec: Analyze a Command`)
Inspects commands without executing them. Surfaces matched rules, affected targets, and recommended checks.

### 3. Offline Rule Engine
Categorized deterministic detection rules covering:
- **Filesystem**: Recursive forced deletion, root wipes, format commands, and overly broad permissions (`chmod 777`, `icacls Everyone`).
- **Git**: `git reset --hard`, `git clean -f`, force pushes, and forced branch deletions.
- **Database**: `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, unconstrained `DELETE FROM`, and ORM reset migrations.
- **Network & Remote**: Download-and-pipe to shell (`curl | sh`, `irm | iex`), chained downloads, and reverse shells.
- **Package Management**: `--break-system-packages`, unencrypted HTTP registries, `--ignore-scripts`.
- **System**: Host shutdown/reboot, service stoppage, and fork bomb resource exhaustion patterns.

### 4. Direct Terminal Observation
Uses VS Code Terminal Shell Integration where available to observe commands entered in integrated terminals and alert when high-risk commands are started.

### 5. Privacy-First Local Audit History & Security Dashboard
- Audit entries stored strictly locally in your VS Code global state.
- Automatic redaction of credentials, API tokens, passwords, and connection strings.
- Interactive **Security Dashboard** (`Safexec: Show Security Dashboard`) and sidebar views for Findings and History.
- Clear history on demand (`Safexec: Clear Audit History`).

---

## Extension Commands

| Command | Title | Description |
|---|---|---|
| `safexec.runProtected` | **Safexec: Run Protected Command** | Inspects and safely executes command in a protected terminal session |
| `safexec.analyzeCommand` | **Safexec: Analyze a Command** | Evaluates a command line and shows risk analysis without running it |
| `safexec.showDashboard` | **Safexec: Show Security Dashboard** | Opens the interactive webview security overview |
| `safexec.showHistory` | **Safexec: Show Audit History** | Displays audit history panel |
| `safexec.clearHistory` | **Safexec: Clear Audit History** | Clears locally stored command execution audit history |

---

## Configuration Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `safexec.policy.criticalAction` | `string` (`"deny"` / `"confirm"`) | `"deny"` | Protected Runner action for Critical commands |
| `safexec.policy.highAction` | `string` (`"confirm"` / `"allow"`) | `"confirm"` | Protected Runner action for High risk commands |
| `safexec.policy.mediumAction` | `string` (`"prompt"` / `"allow"`) | `"prompt"` | Protected Runner action for Medium risk commands |
| `safexec.terminalMonitor.enabled` | `boolean` | `true` | Observational monitoring of integrated terminals |
| `safexec.history.maxEntries` | `number` | `100` | Maximum number of audit entries retained locally |
| `safexec.history.redactSecrets` | `boolean` | `true` | Automatically redact passwords & tokens before saving |
| `safexec.ai.enabled` | `boolean` | `false` | Enable optional advisory AI explanations |
| `safexec.ai.endpoint` | `string` | `""` | Custom endpoint for advisory AI |
| `safexec.ai.apiKey` | `string` | `""` | API key for advisory AI |

---

## Architecture Principle

Safexec adheres to the following core principle:

> **The local security policy must remain deterministic, understandable, testable, and independent of AI availability.**
> AI assistance is strictly advisory and cannot override or lower deterministic Critical-risk blocks.

---

## License

MIT
