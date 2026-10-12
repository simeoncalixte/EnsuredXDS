import type React from 'react';
import type { XdsBadgeVariant } from './Badge';
import type { ProgressBarTone } from './ProgressBar';

export type ResultState = 'ready' | 'loading' | 'empty' | 'unavailable' | 'error';
export interface ResultsPanelProps {
  title: string;
  description?: string;
  state?: ResultState;
  /** Explain missing evidence or a failed request in user-facing language. */
  message?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

export interface ResultsToolbarProps {
  title: string;
  description?: string;
  periodLabel: string;
  matchedCount?: number;
  activeFilterCount?: number;
  loading?: boolean;
  onOpenFilters: () => void;
  onClearFilters?: () => void;
  /** Optional period selector or export action built from existing XDS controls. */
  actions?: React.ReactNode;
}

export interface ResultMetricCardProps {
  label: string;
  /** Already formatted, with currency or units. Null means unavailable; zero is valid. */
  value: string | null;
  state?: ResultState;
  message?: string;
  status?: { label: string; tone?: XdsBadgeVariant };
  comparison?: {
    label: string;
    direction?: 'up' | 'down' | 'flat';
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
  };
  coverage?: { populated: number; total: number };
  target?: { label: string; value: number; max: number };
  /** Period, valuation basis, or revision information relevant to interpreting the result. */
  basis?: string;
  onRetry?: () => void;
  className?: string;
}

export interface AllocationItem {
  id: string;
  label: string;
  /** Explicit share of the stated denominator, in percent. Null means unknown. */
  share: number | null;
  formattedValue: string;
  tone?: ProgressBarTone;
  annotation?: { label: string; tone?: XdsBadgeVariant };
}
export interface AllocationListProps {
  items: AllocationItem[];
  /** Name the denominator and explain overlapping categories where applicable. */
  basis: string;
  emptyMessage?: string;
}

export interface AppetiteSegment {
  id: string;
  label: string;
  percent: number | null;
  tone?: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
}
export interface AppetiteDistributionProps {
  title: string;
  description?: string;
  segments: AppetiteSegment[];
  basis: string;
  note?: string;
  state?: ResultState;
  message?: string;
}

export interface NatCatRiskBannerProps {
  title: string;
  grossExposure: string | null;
  netRetained: string | null;
  treatyCount?: number;
  status?: { label: string; tone?: XdsBadgeVariant };
  bufferLabel?: string;
  /** Name valuation time, currency and scenario assumptions when available. */
  basis?: string;
  state?: ResultState;
  message?: string;
  onRetry?: () => void;
  onViewHazard?: () => void;
  onRunStressTest?: () => void;
  stressTestRunning?: boolean;
  stressTestError?: string;
  details?: React.ReactNode;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export interface PipelineStageCardProps {
  title: string;
  count: number | null;
  exposure: string | null;
  exposureLabel?: string;
  tone?: XdsBadgeVariant;
  metric?: { label: string; value: string | null };
  /** Explicit stage share or completion percentage, paired with its basis. */
  progress?: { percent: number; label: string };
  notes?: string[];
  state?: ResultState;
  message?: string;
  onOpen?: () => void;
}

export interface PriorityQueueItem {
  id: string;
  title: string;
  description?: string;
  status: { label: string; tone?: XdsBadgeVariant };
  critical?: boolean;
}
export interface PriorityUnderwriterQueueProps {
  title: string;
  description?: string;
  items: PriorityQueueItem[];
  escalationNote?: string;
  state?: ResultState;
  message?: string;
  onRetry?: () => void;
  onOpenSubmission?: (id: string) => void;
}

export interface SlaVelocityPanelProps {
  title: string;
  description?: string;
  cycleTime: string | null;
  clearanceEfficiency: string | null;
  onTime?: { label: string; tone?: XdsBadgeVariant };
  comparison?: {
    label: string;
    direction?: 'up' | 'down' | 'flat';
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
  };
  basis: string;
  queueNote?: string;
  state?: ResultState;
  message?: string;
  onRetry?: () => void;
}

export interface PipelineStage extends Omit<PipelineStageCardProps, 'onOpen'> {
  id: string;
}
export interface SubmissionPipelineOverviewProps {
  title: string;
  description?: string;
  stages: PipelineStage[];
  /** Authoritative total; stages may overlap, so counts are never automatically summed. */
  activeCount?: number | null;
  capacity?: string | null;
  basis?: string;
  state?: ResultState;
  message?: string;
  onRetry?: () => void;
  onOpenStage?: (id: string) => void;
  /** Compose AppetiteDistribution, SlaVelocityPanel and PriorityUnderwriterQueue here. */
  children?: React.ReactNode;
}

export interface TreatyRenewalCardProps {
  title: string;
  broker?: string | null;
  treatyReference: string;
  status: { label: string; tone?: XdsBadgeVariant };
  targetLimit: string | null;
  indicativeRate: string | null;
  /** ISO calendar date; display label remains supplied by the application. */
  expiryDate?: string | null;
  expiryLabel: string | null;
  participation: string | null;
  rateChange?: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' };
  terms?: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' };
  onOpen?: () => void;
}

export interface TreatyRenewalItem extends Omit<TreatyRenewalCardProps, 'onOpen'> {
  id: string;
  critical?: boolean;
}
export interface TreatyRenewalWatchlistProps {
  title: string;
  description?: string;
  items: TreatyRenewalItem[];
  /** Supplied aggregate with currency. Never sum display strings or mixed currencies. */
  totalRenewingLimit?: string | null;
  /** Explain the population/valuation underlying the supplied total. */
  basis?: string;
  state?: ResultState;
  message?: string;
  onRetry?: () => void;
  onOpenTreaty?: (id: string) => void;
}

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  format?: (v: number) => string;
  dashed?: boolean;
}

export interface MultiLineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: LineSeries[];
  xFormatter?: (v: unknown) => string;
  yFormatter?: (v: number) => string;
  /** Draw a horizontal reference line at this Y value (e.g. 1.0 = 100% combined ratio) */
  refLine?: number;
  refLineLabel?: string;
  height?: number;
  /** Optional detailed tooltip for domain-specific evidence. */
  tooltipContent?: React.ReactElement;
}

/** Current preview selection. An empty list selects all business lines. */
export interface DashboardFilters {
  businessLines: string[];
}

/** Monthly as-of snapshot. Monetary values are in the trajectory's currency.
 * Ratios are fractions (0.65 = 65%), uncapped; null means no valid denominator.
 * Counts and amounts describe each snapshot and must not be summed over time.
 */
export interface LossRatioTrajectoryPoint {
  month: string;
  incomingCount: number;
  boundCount: number;
  proposedPremium: number;
  boundPremium: number;
  earnedPremium: number;
  incomingLoss: number;
  boundLoss: number;
  paid: number;
  caseReserves: number;
  ibnr: number;
  incomingRatio: number | null;
  boundRatio: number | null;
  claimsRatio: number | null;
}

export interface LossRatioTrajectoryData {
  points: LossRatioTrajectoryPoint[];
  currency: string;
  reinsuranceBasis: 'gross' | 'net';
  /** ISO calendar date of the latest snapshot. */
  valuationDate: string;
  actuarialMethod: 'bornhuetter-ferguson';
  /** Fraction, not percent; null means no selected target. */
  targetLossRatio: number | null;
  state: ResultState;
  illustrative: boolean;
}

/** Current dashboard presentation contract, reusing existing component types.
 * This is a view model, not a backend API schema. Event handlers remain in the UI.
 */
export interface UnderwritingDashboardData {
  toolbar: Pick<
    ResultsToolbarProps,
    'title' | 'description' | 'periodLabel' | 'matchedCount' | 'activeFilterCount'
  >;
  metrics: Omit<ResultMetricCardProps, 'onRetry' | 'className'>[];
  lossTrajectory: LossRatioTrajectoryData;
  allocation: AllocationListProps;
  catastrophe: Omit<
    NatCatRiskBannerProps,
    'onRetry' | 'onViewHazard' | 'onRunStressTest' | 'onExpandedChange'
  >;
  renewals: Omit<TreatyRenewalWatchlistProps, 'onRetry' | 'onOpenTreaty'>;
  pipeline: Omit<SubmissionPipelineOverviewProps, 'onRetry' | 'onOpenStage'>;
}

export interface UnderwritingDashboardPreviewProps {
  unavailable?: boolean;
}

/** Shared props for the dashboard's trajectory panel and custom chart tooltip. */
export interface LossRatioTrajectoryProps {
  data: LossRatioTrajectoryData;
  selectionLabel: string;
  title?: string;
  message?: string;
  onRetry?: () => void;
}
export interface LossRatioTooltipProps {
  currency?: string;
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: LossRatioTrajectoryPoint }>;
}

/** Approved components for the configurable insurer workspace. */
export interface DashboardComponentPropsMap {
  'xds.result-metric-card': ResultMetricCardProps;
  'xds.loss-ratio-trajectory': LossRatioTrajectoryProps;
  'xds.allocation-list': AllocationListProps;
  'xds.nat-cat-risk-banner': NatCatRiskBannerProps;
  'xds.treaty-renewal-watchlist': TreatyRenewalWatchlistProps;
  'xds.submission-pipeline-overview': SubmissionPipelineOverviewProps;
  'xds.appetite-distribution': AppetiteDistributionProps;
  'xds.sla-velocity-panel': SlaVelocityPanelProps;
  'xds.priority-underwriter-queue': PriorityUnderwriterQueueProps;
}
export type DashboardComponentId = keyof DashboardComponentPropsMap;

/** JSON configuration contains no callbacks, expressions or module paths. */
export type DashboardJsonValue =
  string | number | boolean | null | DashboardJsonValue[] | { [key: string]: DashboardJsonValue };
export interface DashboardWidgetConfig {
  id: string;
  component: DashboardComponentId;
  title: string;
  description?: string;
  layout: 'metric' | 'half' | 'full';
  source: { method: 'POST'; path: string; adapter: 'component-props' | 'submission-count' };
  props: Record<string, DashboardJsonValue>;
}
export interface DashboardConfiguration {
  version: 1;
  id: string;
  title: string;
  description: string;
  filters: { parameter: 'submissionFilters'; optionsPath: '/api/underwriting/submissions/search' };
  widgets: DashboardWidgetConfig[];
}
