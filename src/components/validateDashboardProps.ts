import type { ValidateFunction } from 'ajv';
import * as generated from '../validation/dashboardValidators.generated.js';
import type {
  DashboardComponentId,
  DashboardComponentPropsMap,
} from './UnderwritingDashboard.types.js';

const validators: Record<
  DashboardComponentId,
  ((value: unknown) => boolean) & Pick<ValidateFunction, 'errors'>
> = {
  'xds.result-metric-card': generated.resultMetricCard,
  'xds.loss-ratio-trajectory': generated.lossRatioTrajectory,
  'xds.allocation-list': generated.allocationList,
  'xds.nat-cat-risk-banner': generated.natCatRiskBanner,
  'xds.treaty-renewal-watchlist': generated.treatyRenewalWatchlist,
  'xds.submission-pipeline-overview': generated.submissionPipelineOverview,
  'xds.appetite-distribution': generated.appetiteDistribution,
  'xds.sla-velocity-panel': generated.slaVelocityPanel,
  'xds.priority-underwriter-queue': generated.priorityUnderwriterQueue,
};

/** Validate endpoint data using shared schemas compiled at build time (CSP-safe). */
export function validateDashboardProps<K extends DashboardComponentId>(
  component: K,
  value: unknown,
): DashboardComponentPropsMap[K] {
  const validate = validators[component];
  if (!validate(value)) {
    const detail = validate.errors
      ?.map((error) => `${error.instancePath || '/'} ${error.message}`)
      .join('; ');
    throw new Error(`Invalid response for ${component}: ${detail}`);
  }
  return value as DashboardComponentPropsMap[K];
}
