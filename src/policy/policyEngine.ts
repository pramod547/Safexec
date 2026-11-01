import { DEFAULT_SAFEXEC_CONFIG } from './defaultPolicy';
import { AnalysisResult, PolicyDecision, SafexecConfig } from '../core/types';

export class PolicyEngine {
  private config: SafexecConfig;

  constructor(config?: Partial<SafexecConfig>) {
    this.config = {
      ...DEFAULT_SAFEXEC_CONFIG,
      ...config
    };
  }

  public updateConfig(newConfig: Partial<SafexecConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  public evaluate(result: AnalysisResult): PolicyDecision {
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

  public getConfig(): SafexecConfig {
    return { ...this.config };
  }
}

