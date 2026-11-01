"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyEngine = void 0;
const defaultPolicy_1 = require("./defaultPolicy");
class PolicyEngine {
    config;
    constructor(config) {
        this.config = {
            ...defaultPolicy_1.DEFAULT_SAFEXEC_CONFIG,
            ...config
        };
    }
    updateConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };
    }
    evaluate(result) {
        switch (result.overallRisk) {
            case 'critical':
                return this.config.criticalAction;
            case 'high':
                return this.config.highAction;
            case 'medium':
                return this.config.mediumAction;
            case 'low':
            default:
                return 'allow';
        }
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.PolicyEngine = PolicyEngine;
//# sourceMappingURL=policyEngine.js.map