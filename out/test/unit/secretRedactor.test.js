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
const secretRedactor_1 = require("../../src/ai/secretRedactor");
describe('SecretRedactor Unit Tests', () => {
    it('redacts database passwords in connection URIs', () => {
        const raw = 'psql postgres://admin:superSecret123@localhost:5432/mydb';
        const redacted = secretRedactor_1.SecretRedactor.redact(raw);
        assert.strictEqual(redacted, 'psql postgres://admin:***REDACTED_PASSWORD***@localhost:5432/mydb');
        assert.ok(!redacted.includes('superSecret123'));
    });
    it('redacts GitHub Personal Access Tokens', () => {
        const raw = 'curl -H "Authorization: token ghp_1234567890abcdef1234567890abcdef1234" https://api.github.com';
        const redacted = secretRedactor_1.SecretRedactor.redact(raw);
        assert.ok(redacted.includes('***REDACTED_GITHUB_TOKEN***'));
        assert.ok(!redacted.includes('ghp_1234567890abcdef1234567890abcdef1234'));
    });
    it('redacts OpenAI / general sk- API keys', () => {
        const raw = 'export OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456';
        const redacted = secretRedactor_1.SecretRedactor.redact(raw);
        assert.ok(redacted.includes('***REDACTED_API_KEY***') || redacted.includes('***REDACTED***'));
        assert.ok(!redacted.includes('sk-abcdefghijklmnopqrstuvwxyz123456'));
    });
    it('redacts Bearer tokens', () => {
        const raw = 'curl -H "Authorization: Bearer mySecretTokenValue12345678" https://api.service.com';
        const redacted = secretRedactor_1.SecretRedactor.redact(raw);
        assert.ok(redacted.includes('Bearer ***REDACTED_BEARER_TOKEN***'));
        assert.ok(!redacted.includes('mySecretTokenValue12345678'));
    });
    it('redacts CLI password flags', () => {
        const raw = 'mysql -u root -p mySecretPassword -e "SELECT 1"';
        const redacted = secretRedactor_1.SecretRedactor.redact(raw);
        assert.ok(redacted.includes('-p ***REDACTED***'));
        assert.ok(!redacted.includes('mySecretPassword'));
    });
    it('preserves clean commands unchanged', () => {
        const raw = 'git clone https://github.com/microsoft/vscode.git';
        assert.strictEqual(secretRedactor_1.SecretRedactor.redact(raw), raw);
    });
});
//# sourceMappingURL=secretRedactor.test.js.map