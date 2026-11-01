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
const policyEngine_1 = require("../../src/policy/policyEngine");
describe('PolicyEngine Unit Tests', () => {
    it('denies critical risk by default', () => {
        const engine = new policyEngine_1.PolicyEngine();
        const result = {
            command: 'rm -rf /',
            shell: 'bash',
            overallRisk: 'critical',
            riskScore: 95,
            findings: [],
            isBlocked: true,
            timestamp: Date.now()
        };
        assert.strictEqual(engine.evaluate(result), 'deny');
    });
    it('requires confirmation for high risk by default', () => {
        const engine = new policyEngine_1.PolicyEngine();
        const result = {
            command: 'git reset --hard',
            shell: 'bash',
            overallRisk: 'high',
            riskScore: 75,
            findings: [],
            isBlocked: false,
            timestamp: Date.now()
        };
        assert.strictEqual(engine.evaluate(result), 'confirm');
    });
    it('prompts review for medium risk by default', () => {
        const engine = new policyEngine_1.PolicyEngine();
        const result = {
            command: 'git branch -D test',
            shell: 'bash',
            overallRisk: 'medium',
            riskScore: 45,
            findings: [],
            isBlocked: false,
            timestamp: Date.now()
        };
        assert.strictEqual(engine.evaluate(result), 'prompt');
    });
    it('allows low risk automatically', () => {
        const engine = new policyEngine_1.PolicyEngine();
        const result = {
            command: 'ls -l',
            shell: 'bash',
            overallRisk: 'low',
            riskScore: 0,
            findings: [],
            isBlocked: false,
            timestamp: Date.now()
        };
        assert.strictEqual(engine.evaluate(result), 'allow');
    });
    it('allows custom override configuration', () => {
        const engine = new policyEngine_1.PolicyEngine({
            criticalAction: 'confirm',
            highAction: 'allow'
        });
        const highRes = {
            command: 'git reset --hard',
            shell: 'bash',
            overallRisk: 'high',
            riskScore: 75,
            findings: [],
            isBlocked: false,
            timestamp: Date.now()
        };
        assert.strictEqual(engine.evaluate(highRes), 'allow');
    });
});
//# sourceMappingURL=policyEngine.test.js.map