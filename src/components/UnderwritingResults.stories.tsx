import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import styled from 'styled-components';
import { spacing } from '../tokens';
import ResultsToolbar from './ResultsToolbar';
import ResultMetricCard from './ResultMetricCard';
import ResultsPanel from './ResultsPanel';
import AllocationList from './AllocationList';
import LossRatioTrajectory from './LossRatioTrajectory';
import Button from './Button';
import NatCatRiskBanner from './NatCatRiskBanner';
import TreatyRenewalWatchlist from './TreatyRenewalWatchlist';
import riskPreview from './NatCatRiskBanner.stories';
import renewalPreview from './TreatyRenewalWatchlist.stories';
import SubmissionPipelineOverview from './SubmissionPipelineOverview';
import pipelinePreview from './SubmissionPipelineOverview.stories';
import type {
  DashboardFilters,
  LossRatioTrajectoryPoint,
  UnderwritingDashboardPreviewProps,
  UnderwritingDashboardData,
} from './UnderwritingDashboard.types';

const Layout = styled.div`
  display: grid;
  gap: ${spacing.lg}px;
  max-width: 1680px;
  margin: auto;
`;
const Metrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: ${spacing.md}px;
`;
const Charts = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${spacing.md}px;
  @media (max-width: 800px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
const lossRatio = (losses: number, premium: number) => (premium > 0 ? losses / premium : null);
// Separate portfolio fixtures; aggregate dollar amounts before calculating ratios.
function trajectory(filtered: boolean): LossRatioTrajectoryPoint[] {
  return [
    'Oct 25',
    'Nov 25',
    'Dec 25',
    'Jan 26',
    'Feb 26',
    'Mar 26',
    'Apr 26',
    'May 26',
    'Jun 26',
    'Jul 26',
    'Aug 26',
    'Sep 26',
  ].map((month, i) => {
    const scale = filtered ? 0.34 : 1;
    const proposedPremium = (900000 + i * 32000) * scale;
    const boundPremium = (610000 + i * 24000) * scale;
    const earnedPremium = (420000 + i * 21000) * scale;
    const incomingLoss = proposedPremium * ((filtered ? 0.49 : 0.53) + i * 0.007);
    const boundLoss = boundPremium * ((filtered ? 0.46 : 0.5) + i * 0.006);
    const paid = earnedPremium * (0.2 + i * 0.012);
    const caseReserves = earnedPremium * (0.11 + i * 0.002);
    // Reported Bornhuetter–Ferguson: expected losses × unreported proportion.
    // Prior expected ratios and cumulative development factors are illustrative.
    const ibnr = earnedPremium * (filtered ? 0.54 : 0.59) * (1 - 1 / (2.4 - i * 0.06));
    return {
      month,
      incomingCount: filtered ? 8 + i : 24 + i * 2,
      boundCount: filtered ? 3 + i : 12 + i,
      proposedPremium,
      boundPremium,
      earnedPremium,
      incomingLoss,
      boundLoss,
      paid,
      caseReserves,
      ibnr,
      incomingRatio: lossRatio(incomingLoss, proposedPremium),
      boundRatio: lossRatio(boundLoss, boundPremium),
      claimsRatio: lossRatio(paid + caseReserves + ibnr, earnedPremium),
    };
  });
}
function Preview({ unavailable = false }: UnderwritingDashboardPreviewProps) {
  const [filters, setFilters] = useState<DashboardFilters>({ businessLines: [] });
  const filtered = filters.businessLines.includes('cyber');
  const setFiltered = (selected: boolean) =>
    setFilters({ businessLines: selected ? ['cyber'] : [] });
  const latest = trajectory(filtered)[11];
  const count = filtered ? 8 : 24;
  const dashboard: UnderwritingDashboardData = {
    toolbar: {
      title: 'Underwriting & Analytics Dashboard',
      description: 'Design preview · Illustrative fixture data',
      periodLabel: 'YTD 2026',
      matchedCount: count,
      activeFilterCount: filtered ? 1 : 0,
    },
    metrics: [
      {
        label: 'Matching submissions',
        value: String(count),
        basis: 'Received in the selected period',
      },
      {
        label: 'Quoted premium',
        value: unavailable ? null : filtered ? '$4.1M' : '$12.4M',
        coverage: { populated: filtered ? 6 : 18, total: count },
        basis: 'USD · Quoted amounts only',
        status: { label: 'Partial data', tone: 'warning' },
      },
      {
        label: 'Insured exposure',
        value: unavailable ? null : filtered ? '$32M' : '$96M',
        coverage: { populated: filtered ? 5 : 15, total: count },
        basis: 'USD · Declared insured value',
      },
      {
        label: 'Aggregated ultimate claims',
        value: unavailable ? null : money(latest.paid + latest.caseReserves + latest.ibnr),
        basis: 'Latest snapshot · Paid + case reserves + IBNR',
      },
      {
        label: 'Solvency coverage',
        value: null,
        message: 'Available and required capital are required.',
      },
    ],
    lossTrajectory: {
      points: trajectory(filtered),
      currency: 'USD',
      reinsuranceBasis: 'gross',
      valuationDate: '2026-09-30',
      actuarialMethod: 'bornhuetter-ferguson',
      targetLossRatio: 0.65,
      state: unavailable ? 'unavailable' : 'ready',
      illustrative: true,
    },
    allocation: {
      basis: 'Fixture counts. Categories in this example are mutually exclusive.',
      items: filtered
        ? [{ id: 'cyber', label: 'Cyber', formattedValue: '8 submissions', share: 100 }]
        : [
            { id: 'property', label: 'Property', formattedValue: '12 submissions', share: 50 },
            {
              id: 'cyber',
              label: 'Cyber',
              formattedValue: '8 submissions',
              share: 33.3,
              tone: 'tertiary',
            },
            {
              id: 'unknown',
              label: 'Unclassified',
              formattedValue: '4 submissions',
              share: 16.7,
              tone: 'neutral',
            },
          ],
    },
    catastrophe: { ...riskPreview.args, state: unavailable ? 'unavailable' : 'ready' },
    renewals: { ...renewalPreview.args, state: unavailable ? 'unavailable' : 'ready' },
    pipeline: { ...pipelinePreview.args, state: unavailable ? 'unavailable' : 'ready' },
  };
  return (
    <Layout>
      <ResultsToolbar
        {...dashboard.toolbar}
        onOpenFilters={() => setFiltered(true)}
        onClearFilters={() => setFiltered(false)}
        actions={
          <Button variant="secondary" onClick={() => setFiltered(!filtered)}>
            Toggle sample selection
          </Button>
        }
      />
      <Metrics>
        {dashboard.metrics.map((metric) => (
          <ResultMetricCard key={metric.label} {...metric} />
        ))}
      </Metrics>
      <LossRatioTrajectory
        data={dashboard.lossTrajectory}
        selectionLabel={filtered ? 'Cyber' : 'All business lines'}
      />
      <Charts>
        <ResultsPanel
          title="Business-line allocation"
          description="Share of the filtered submissions"
          state={unavailable ? 'empty' : 'ready'}
        >
          <AllocationList {...dashboard.allocation} />
        </ResultsPanel>
      </Charts>
      <NatCatRiskBanner {...dashboard.catastrophe} />
      <TreatyRenewalWatchlist {...dashboard.renewals} />
      <SubmissionPipelineOverview {...dashboard.pipeline} />
    </Layout>
  );
}
const meta = {
  title: 'Results/Underwriting dashboard',
  component: Preview,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Preview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
export const MissingData: Story = { args: { unavailable: true } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } } };
