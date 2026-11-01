"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandParser = void 0;
class CommandParser {
    static PS_ALIASES = {
        rm: 'Remove-Item',
        del: 'Remove-Item',
        erase: 'Remove-Item',
        rd: 'Remove-Item',
        rmdir: 'Remove-Item',
        ri: 'Remove-Item',
        rni: 'Rename-Item',
        ren: 'Rename-Item',
        mi: 'Move-Item',
        mv: 'Move-Item',
        move: 'Move-Item',
        cpi: 'Copy-Item',
        cp: 'Copy-Item',
        copy: 'Copy-Item',
        ni: 'New-Item',
        cat: 'Get-Content',
        type: 'Get-Content',
        gc: 'Get-Content',
        sc: 'Set-Content',
        curl: 'Invoke-WebRequest',
        wget: 'Invoke-WebRequest',
        iwr: 'Invoke-WebRequest',
        irm: 'Invoke-RestMethod',
        iex: 'Invoke-Expression',
        kill: 'Stop-Process',
        saps: 'Start-Process'
    };
    static parse(commandLine, shell) {
        const trimmed = commandLine.trim();
        if (!trimmed) {
            return {
                raw: commandLine,
                shell,
                segments: [],
                hasSubshells: false,
                hasPipes: false,
                hasDynamicSubstitution: false
            };
        }
        const hasSubshells = /\$\([^\)]+\)/.test(trimmed) ||
            /`[^`]+`/.test(trimmed) ||
            /\b(eval|Invoke-Expression|iex)\b/i.test(trimmed);
        const hasDynamicSubstitution = /\$\{?[A-Za-z0-9_]+\}?/.test(trimmed) ||
            /%[A-Za-z0-9_]+%/.test(trimmed) ||
            /\$env:[A-Za-z0-9_]+/i.test(trimmed);
        const rawSegments = this.splitSegments(trimmed);
        const hasPipes = rawSegments.some((s) => s.operator === '|');
        const segments = rawSegments.map((seg) => {
            const tokens = this.tokenize(seg.text);
            let command = tokens.length > 0 ? tokens[0] : '';
            const args = tokens.slice(1);
            // Handle PowerShell / CMD normalization
            if (shell === 'powershell') {
                const lowerCmd = command.toLowerCase();
                if (this.PS_ALIASES[lowerCmd]) {
                    command = this.PS_ALIASES[lowerCmd];
                }
            }
            return {
                raw: seg.text.trim(),
                command,
                args,
                operator: seg.operator
            };
        });
        return {
            raw: commandLine,
            shell,
            segments,
            hasSubshells,
            hasPipes,
            hasDynamicSubstitution
        };
    }
    static splitSegments(input) {
        const results = [];
        let current = '';
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let inBacktick = false;
        let i = 0;
        while (i < input.length) {
            const char = input[i];
            const nextChar = input[i + 1];
            // Handle escape backslash outside single quote
            if (char === '\\' && !inSingleQuote && i + 1 < input.length) {
                current += char + nextChar;
                i += 2;
                continue;
            }
            // Handle quotes
            if (char === "'" && !inDoubleQuote && !inBacktick) {
                inSingleQuote = !inSingleQuote;
                current += char;
                i++;
                continue;
            }
            if (char === '"' && !inSingleQuote && !inBacktick) {
                inDoubleQuote = !inDoubleQuote;
                current += char;
                i++;
                continue;
            }
            if (char === '`' && !inSingleQuote && !inDoubleQuote) {
                inBacktick = !inBacktick;
                current += char;
                i++;
                continue;
            }
            // If outside quotes, check operators
            if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
                if (char === '&' && nextChar === '&') {
                    results.push({ text: current.trim(), operator: '&&' });
                    current = '';
                    i += 2;
                    continue;
                }
                if (char === '|' && nextChar === '|') {
                    results.push({ text: current.trim(), operator: '||' });
                    current = '';
                    i += 2;
                    continue;
                }
                if (char === ';') {
                    results.push({ text: current.trim(), operator: ';' });
                    current = '';
                    i++;
                    continue;
                }
                if (char === '|') {
                    results.push({ text: current.trim(), operator: '|' });
                    current = '';
                    i++;
                    continue;
                }
                if (char === '&') {
                    results.push({ text: current.trim(), operator: '&' });
                    current = '';
                    i++;
                    continue;
                }
            }
            current += char;
            i++;
        }
        if (current.trim().length > 0) {
            results.push({ text: current.trim() });
        }
        return results;
    }
    static tokenize(input) {
        const tokens = [];
        let current = '';
        let inSingle = false;
        let inDouble = false;
        let i = 0;
        while (i < input.length) {
            const char = input[i];
            if (char === '\\' && !inSingle && i + 1 < input.length) {
                current += input[i + 1];
                i += 2;
                continue;
            }
            if (char === "'" && !inDouble) {
                inSingle = !inSingle;
                i++;
                continue;
            }
            if (char === '"' && !inSingle) {
                inDouble = !inDouble;
                i++;
                continue;
            }
            if (/\s/.test(char) && !inSingle && !inDouble) {
                if (current.length > 0) {
                    tokens.push(current);
                    current = '';
                }
                i++;
                continue;
            }
            current += char;
            i++;
        }
        if (current.length > 0) {
            tokens.push(current);
        }
        return tokens;
    }
}
exports.CommandParser = CommandParser;
//# sourceMappingURL=commandParser.js.map