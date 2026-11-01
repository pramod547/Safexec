
# Safexec — Project Plan

**Product:** Safexec  
**Type:** VS Code extension  
**Tagline:** Safer terminal commands. Smarter execution.  
**Version:** 0.1.0 — Planning baseline  
**Status:** MVP planning and starter implementation

---

## 1. Project Overview

Safexec is a cross-platform Visual Studio Code extension designed to help developers identify risky terminal commands before running them through a protected workflow.

It analyzes commands, explains potentially harmful effects, assigns a risk level, and applies configurable execution policies. Safexec is designed to work offline for its core security checks, with optional AI assistance for richer explanations.

Safexec is a safety layer for developer workflows. It is not a replacement for operating-system permissions, endpoint security, backups, shell sandboxing, or careful review by the developer.

## 2. Problem Statement

Developers frequently run commands copied from documentation, issue threads, AI assistants, package instructions, or online tutorials without fully understanding their effects.

Some commands can:
- Delete files or directories recursively.
- Discard uncommitted Git changes or rewrite remote history.
- Drop databases or remove table data.
- Change permissions too broadly.
- Download and execute remote scripts.
- Stop services or interrupt active work.

Most terminal workflows do not provide consistent, context-aware explanations and policy checks before every command. A VS Code extension also cannot universally intercept every command typed directly into every integrated terminal.

Safexec addresses this gap by providing a dedicated protected command workflow, offline risk analysis, clear explanations, and best-effort observation of supported direct-terminal activity.

## 3. Goals

### Primary goals

1. Analyze a command before it is submitted through Safexec's Protected Runner.
2. Identify known risky command patterns using an offline rule engine.
3. Classify findings as Low, Medium, High, or Critical.
4. Deny Critical commands by default in the Protected Runner.
5. Require explicit confirmation for High-risk commands.
6. Explain why a command was flagged and what it may affect.
7. Maintain a local audit history of analyses and execution decisions.
8. Support Windows, Linux, and macOS with shell-aware behavior.

### Secondary goals

- Offer optional AI-generated explanations without making AI necessary for protection.
- Provide configurable policies and rule packs.
- Present a dashboard for reviewing detections and decisions.
- Support exportable audit reports.
- Keep the extension privacy-conscious and offline-first.

## 4. Non-Goals

Safexec will not claim to:
- Block every dangerous command typed directly into an arbitrary terminal.
- Guarantee that a command is safe because no rule matched it.
- Replace OS-level access controls, antivirus, EDR, backups, or container isolation.
- Safely execute arbitrary shell input merely by escaping or quoting a string.
- Allow an AI model to overrule a deterministic Critical-risk block.
- Provide a complete shell sandbox in the initial MVP.

## 5. Target Users

- Students learning command-line tools.
- Full-stack and backend developers.
- Developers working with Git, databases, package managers, and deployment tools.
- Teams that want a review checkpoint for potentially destructive commands.
- Developers who use AI-generated terminal commands and want an independent safety review.

## 6. Supported Platforms and Shells

### Operating systems

- Windows
- Linux
- macOS

### Initial shell targets

| Platform | Shells |
|---|---|
| Windows | PowerShell, Windows CMD |
| Linux | Bash, Zsh |
| macOS | Zsh, Bash |

Shell support must be validated through automated tests and real VS Code environments. Shell-specific parsing and execution behavior must not be assumed to be identical.

## 7. Product Requirements

### 7.1 Command analysis

- Accept a command as text without executing it.
- Identify command segments, operators, and suspicious constructs where supported.
- Apply shell-aware rules when the shell type is known.
- Return a structured analysis result.
- Explain that heuristic analysis is incomplete when syntax cannot be confidently understood.

### 7.2 Risk classification

| Level | Meaning | Default Protected Runner policy |
|---|---|---|
| Low | No known risky pattern matched | Allow after analysis |
| Medium | Potentially sensitive operation | Show review prompt |
| High | Significant destructive or security impact possible | Require explicit confirmation |
| Critical | Severe destructive impact likely from a recognized pattern | Deny by default |

Risk levels are policy categories, not probabilities or guarantees.

### 7.3 Detection rule categories

**Filesystem**
- Recursive forced deletion.
- Disk and filesystem formatting.
- Recursive directory removal.
- Broad file permission changes.

**Git**
- `git reset --hard`.
- Destructive `git clean` combinations.
- Force pushes and history rewrites.

**Database**
- `DROP DATABASE`.
- `DROP SCHEMA`.
- `DROP TABLE`.
- `TRUNCATE TABLE`.
- Broad `DELETE` operations.

**Network and remote execution**
- Download-and-execute patterns.
- Remote content piped into shells.
- PowerShell download-and-evaluate patterns.

**System**
- Shutdown and restart commands.
- Commands that may stop important services.

**Package management**
- Package installation and lifecycle-script risks.
- Unusual or untrusted package sources.

Rules must include tests, examples, known limitations, and false-positive considerations.

### 7.4 Protected Runner

The Protected Runner is the primary pre-execution safety boundary.

Workflow:
1. User opens the Safexec command.
2. User enters a command.
3. Safexec analyzes the command.
4. Safexec displays risk level and findings.
5. Critical commands are denied by default.
6. High-risk commands require explicit user confirmation.
7. Medium-risk commands display a review prompt.
8. Approved commands are sent to a VS Code terminal.
9. Safexec records the decision locally.

The initial runner sends approved input to the configured shell. It is not a sandbox. A later version should introduce constrained, argument-based execution for a limited set of supported operations where practical.

### 7.5 Direct terminal monitoring

- Use VS Code shell integration events where available.
- Observe commands reported by supported shells.
- Analyze and record high-risk or critical patterns.
- Display a warning that the command may already be running.

**Important:** Shell integration command-start events are observational. They do not provide universal pre-execution interception or blocking. Safexec must never describe this feature as guaranteed prevention.

### 7.6 Audit history

Store a bounded local history containing:
- Timestamp.
- Command text, subject to privacy controls.
- Risk level and score.
- Matched rule identifiers.
- Decision: analyzed, allowed, denied, cancelled, or observed.
- Source: Protected Runner or direct-terminal observation.

Privacy requirements:
- Do not transmit command history by default.
- Provide a way to clear history.
- Avoid storing secrets where possible.
- Add configurable retention and redaction.
- Explain where data is stored.

## 8. Hybrid Intelligence Design

Safexec uses two complementary layers.

### Layer A — Deterministic local rule engine

Responsibilities:
- Detect known risky patterns.
- Assign baseline risk.
- Enforce Critical default-deny policy in the Protected Runner.
- Work without internet access or an AI key.

The local rule engine is authoritative for policy enforcement.

### Layer B — Optional AI explanation

Potential responsibilities:
- Explain complex commands in plain language.
- Summarize likely side effects.
- Help users understand unfamiliar flags and command chains.
- Suggest safer alternatives for review.

AI constraints:
- AI is optional and disabled unless configured by the user.
- AI output cannot lower a deterministic risk level or override a block.
- Do not send commands to a remote service without clear user consent.
- Redact likely credentials, tokens, passwords, and sensitive environment values before any request.
- Treat AI output as advisory and potentially incorrect.
- Prefer local models where practical and supported.

## 9. Technical Architecture

### Proposed stack

| Area | Technology |
|---|---|
| Extension language | TypeScript |
| Runtime | Node.js |
| Editor integration | VS Code Extension API |
| Shell observation | VS Code Terminal Shell Integration |
| Parsing | Shell-specific parsers or carefully tested tokenizers |
| Local settings and history | VS Code ExtensionContext globalState |
| UI | VS Code Quick Picks, notifications, Tree View, Webview |
| Testing | Mocha or another VS Code-compatible test framework |
| Packaging | `@vscode/vsce` |
| CI | GitHub Actions |

### High-level architecture

```text
                    VS Code
                       |
             Safexec Extension Host
                       |
          +------------+-------------+
          |                          |
     Protected Runner          Direct Terminal
          |                    Observation
          |                          |
          +------------+-------------+
                       |
                Command Intake
                       |
                Shell Detection
                       |
                Command Parser
                       |
               Risk Rule Engine
                       |
                Policy Engine
                       |
          +------------+-------------+
          |            |             |
        Allow        Confirm        Deny
          |            |             |
          +------------+-------------+
                       |
             Optional AI Explanation
                 (advisory only)
                       |
                 Audit Logger
                       |
                Safexec Dashboard
```

### Suggested project structure

```text
safexec/
├── .vscode/
├── media/
├── src/
│   ├── extension.ts
│   ├── core/
│   │   ├── commandParser.ts
│   │   ├── shellDetector.ts
│   │   ├── riskEngine.ts
│   │   ├── riskScorer.ts
│   │   └── types.ts
│   ├── rules/
│   │   ├── filesystemRules.ts
│   │   ├── gitRules.ts
│   │   ├── databaseRules.ts
│   │   ├── networkRules.ts
│   │   ├── packageRules.ts
│   │   └── systemRules.ts
│   ├── policy/
│   │   ├── policyEngine.ts
│   │   └── defaultPolicy.ts
│   ├── protection/
│   │   ├── safeRunner.ts
│   │   └── terminalMonitor.ts
│   ├── ai/
│   │   ├── explanationProvider.ts
│   │   └── secretRedactor.ts
│   ├── storage/
│   │   └── auditLogger.ts
│   └── ui/
│       ├── dashboard.ts
│       ├── findingsView.ts
│       └── settingsView.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── package.json
├── tsconfig.json
├── README.md
├── CHANGELOG.md
├── LICENSE
└── plan.md
```

## 10. User Experience

### Main commands

- `Safexec: Analyze a Command`
- `Safexec: Run Protected Command`
- `Safexec: Show Security Dashboard`
- `Safexec: Show Audit History`
- `Safexec: Clear Audit History`

### Example warning

```text
SAFEXEC — HIGH RISK

Command:
git reset --hard

Why flagged:
This can discard uncommitted changes in the working tree.

Recommended checks:
1. Run git status.
2. Review changed files.
3. Commit or stash work you need.

[Cancel] [Run Anyway]
```

### Dashboard sections

- Overview: total analyses and risk distribution.
- Recent activity: recent commands and decisions.
- Findings: matched rules and explanations.
- Policies: risk handling preferences.
- Privacy: history retention, clearing, and AI consent.

## 11. Security and Privacy Requirements

1. Critical default-deny must be enforced locally in the Protected Runner.
2. AI must never be part of the critical enforcement path.
3. No command should execute automatically after analysis.
4. Require a separate, explicit user action to approve risky execution.
5. Do not treat direct-terminal observation as prevention.
6. Do not claim that a command is safe merely because it passed the rules.
7. Avoid shell-string construction when argument-based execution is possible.
8. Do not attempt to make arbitrary shell input safe through simplistic escaping.
9. Do not transmit command content or audit history by default.
10. Redact likely secrets before optional AI processing.
11. Keep audit retention bounded and provide a clear-history action.
12. Test malicious, malformed, chained, quoted, and dynamically substituted command inputs.

## 12. MVP Scope

### Included in version 0.1

- VS Code extension activation.
- Analyze-command command.
- Protected Runner workflow.
- Initial offline rule engine.
- Four risk levels.
- Critical default-deny in Protected Runner.
- High-risk confirmation.
- Medium-risk review prompt.
- Local audit history.
- Basic direct-terminal observation when shell integration is available.
- Windows, Linux, and macOS as target platforms.

### Deferred beyond MVP

- Full shell grammar parsing.
- Broad command interception.
- Sandboxed execution.
- Advanced AI integrations.
- Local LLM management.
- Team policy synchronization.
- Centralized audit collection.
- Enterprise policy administration.
- Automatic command rewriting.

## 13. Implementation Roadmap

| Phase | Work | Completion criteria |
|---|---|---|
| 1. Foundation | Extension scaffold, commands, configuration | Extension activates and commands appear |
| 2. Analysis | Parser, shell detection, rule engine | Tested examples return expected findings |
| 3. Policy | Risk policy and default-deny behavior | Critical patterns are denied in Protected Runner |
| 4. Execution | Confirmation and managed terminal workflow | No execution without explicit approval |
| 5. Monitoring | Shell integration observation | Supported events are recorded with clear limitations |
| 6. Audit | Local history and retention | Decisions are stored and can be cleared |
| 7. Dashboard | Overview, findings and settings UI | Users can review activity and policies |
| 8. AI | Optional explanation provider and redaction | AI is opt-in and cannot override local policy |
| 9. Quality | Cross-platform and adversarial testing | CI passes on supported OS/shell combinations |
| 10. Release | Documentation, VSIX and Marketplace | Installable package and release notes are ready |

## 14. Testing Strategy

### Unit tests

- Each detection rule has positive and negative test cases.
- Quoted strings do not accidentally trigger unrelated rules.
- Chained commands are analyzed segment by segment.
- Unknown and malformed syntax is handled conservatively.
- Risk precedence is Critical > High > Medium > Low.
- Secret redaction is tested against representative credentials.

### Integration tests

- Extension activates in Extension Development Host.
- Analyze command does not execute input.
- Critical command is denied in Protected Runner by default.
- High-risk execution requires explicit confirmation.
- Cancelled commands are not sent to the terminal.
- Audit entries reflect the user's actual decision.
- Direct-terminal warnings clearly state that execution may already have started.

### Platform tests

Run CI and manual tests on:
- Windows with PowerShell and CMD.
- Linux with Bash and Zsh.
- macOS with Zsh and Bash.

Do not mark a shell/platform combination supported until its parsing, execution, and monitoring behavior has been tested.

## 15. Success Metrics

Track measurable engineering and usability outcomes:

- Detection precision and recall on a maintained test corpus.
- False-positive rate on benign command fixtures.
- Percentage of test cases with correct risk classification.
- Critical-pattern block rate in Protected Runner tests.
- Percentage of cancelled commands that are not executed.
- Extension activation and analysis latency.
- Shell/platform compatibility test pass rate.
- User-reported false positives and missed detections.

Do not use a single risk score as proof of security effectiveness.

## 16. Release Strategy

### Version 0.1.0 — Developer preview
- Core rule engine.
- Protected Runner.
- Initial risk prompts.
- Local audit history.

### Version 0.2.0 — Stronger detection
- Shell-specific parsing.
- Expanded rule packs.
- Better compound-command analysis.
- More comprehensive tests.

### Version 0.3.0 — Dashboard
- Security overview.
- Policy configuration.
- Audit filtering and export.

### Version 0.4.0 — Hybrid intelligence
- Optional AI explanations.
- Secret redaction.
- Local model support investigation.

### Version 1.0.0 — Public release
- Cross-platform validation.
- Security review.
- Documentation and privacy statement.
- Marketplace publication.

## 17. Immediate Next Tasks

1. Rename the existing CommandGuard starter project and all package identifiers to Safexec.
2. Review and correct the initial detection rules.
3. Add a unit-test suite before expanding the rule set.
4. Implement shell detection and shell-specific parsing.
5. Add a clear-history command and privacy controls.
6. Validate the Protected Runner on Windows, Linux, and macOS.
7. Add the dashboard after the core policy and execution behavior is tested.

---

## Product Principle

**Safexec should make dangerous commands harder to run accidentally, while being transparent about what it can and cannot protect.**

The local security policy must remain deterministic, understandable, testable, and independent of AI availability.
