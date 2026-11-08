import React from 'react';
import styled from 'styled-components';
import { spacing } from '../tokens.js';
import { colors } from '../colors.js';
import ResultsPanel from './ResultsPanel.js';
import ResultMetricCard from './ResultMetricCard.js';
import MultiLineChart from './MultiLineChart.js';
import type {
  LossRatioTrajectoryProps,
  LossRatioTooltipProps,
} from './UnderwritingDashboard.types.js';
const Metrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: ${spacing.md}px;
`;
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const Evidence = styled.div`
  margin-top: ${spacing.md}px;
  font-size: 12px;
  line-height: 1.6;
  .table-scroll {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid ${colors.outlineVariant};
    white-space: nowrap;
  }
  p {
    color: ${colors.onSurfaceVariant};
  }
  summary {
    cursor: pointer;
  }
`;
function LossTooltip({ active, payload, currency = 'USD' }: LossRatioTooltipProps) {
  const money = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const pct = (value: number | null) => (value === null ? 'Unavailable' : percent(value));
  return (
    <div
      style={{
        padding: 12,
        maxWidth: 320,
        background: colors.surfaceContainerHigh,
        color: colors.onSurface,
        border: `1px solid ${colors.outlineVariant}`,
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <strong>{row.month} · Monthly snapshot</strong>
      <div>
        Incoming: {pct(row.incomingRatio)} · {row.incomingCount} submissions
      </div>
      <div>
        Expected losses: {money(row.incomingLoss)} / Proposed premium: {money(row.proposedPremium)}
      </div>
      <div>
        Bound: {pct(row.boundRatio)} · {row.boundCount} policies
      </div>
      <div>
        Expected losses: {money(row.boundLoss)} / Bound premium: {money(row.boundPremium)}
      </div>
      <div>Claims ultimate: {pct(row.claimsRatio)}</div>
      <div>
        Paid: {money(row.paid)} · Case reserves: {money(row.caseReserves)}
      </div>
      <div>
        IBNR: {money(row.ibnr)} / Earned premium: {money(row.earnedPremium)}
      </div>
    </div>
  );
}
export function LossRatioTrajectory({
  data: trajectoryData,
  selectionLabel,
  title = 'Expected vs Emerging Loss Ratio',
  message,
  onRetry,
}: LossRatioTrajectoryProps) {
  const data = trajectoryData.points;
  const money = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: trajectoryData.currency,
      maximumFractionDigits: 0,
    }).format(value);
  const latest = data[data.length - 1];
  const pct = (value: number | null) => (value === null ? 'Unavailable' : percent(value));
  if (trajectoryData.state !== 'ready' || !latest)
    return (
      <ResultsPanel
        title={title}
        state={trajectoryData.state === 'ready' ? 'empty' : trajectoryData.state}
        message={message}
        onRetry={onRetry}
      />
    );
  return (
    <ResultsPanel
      title={title}
      description={`${data.length} monthly snapshots · ${trajectoryData.currency} · ${trajectoryData.reinsuranceBasis === 'gross' ? 'Gross' : 'Net'} of reinsurance · Valued ${trajectoryData.valuationDate}${trajectoryData.illustrative ? ' · Illustrative estimates' : ''}`}
      state={trajectoryData.state}
      message="Expected losses, premiums, paid claims, case reserves and IBNR are required to display this trajectory."
    >
      <Metrics>
        <ResultMetricCard
          label="Incoming expected loss ratio"
          value={pct(latest.incomingRatio)}
          basis={`${latest.incomingCount} submissions · Expected losses / proposed premium`}
        />
        <ResultMetricCard
          label="Bound expected loss ratio"
          value={pct(latest.boundRatio)}
          basis={`${latest.boundCount} policies · Bind-time expected losses / bound premium`}
        />
        <ResultMetricCard
          label="Claims-based ultimate loss ratio"
          value={pct(latest.claimsRatio)}
          basis="Paid + case reserves + IBNR / earned premium"
        />
      </Metrics>
      <MultiLineChart
        data={data.map((point) => ({ ...point }))}
        xKey="month"
        series={[
          {
            key: 'incomingRatio',
            label: 'Incoming · Expected',
            color: colors.dataViz.purple,
            dashed: true,
          },
          { key: 'boundRatio', label: 'Bound · Expected', color: colors.dataViz.green },
          { key: 'claimsRatio', label: 'Claims · Ultimate', color: colors.dataViz.orange },
        ]}
        tooltipContent={<LossTooltip currency={trajectoryData.currency} />}
        yFormatter={percent}
        refLine={trajectoryData.targetLossRatio ?? undefined}
        refLineLabel={
          trajectoryData.targetLossRatio === null
            ? undefined
            : `${percent(trajectoryData.targetLossRatio)} underwriting target`
        }
        height={320}
      />
      <Evidence>
        <p>
          Incoming and bound lines use full-term pricing expectations. Claims use earned premium for
          elapsed exposure. IBNR uses Bornhuetter–Ferguson estimates.
          {trajectoryData.illustrative ? ' These values and assumptions are illustrative.' : ''}
        </p>
        <details>
          <summary>View monthly submission and aggregated claims values</summary>
          <div className="table-scroll">
            <table>
              <caption>
                Monthly as-of snapshots · {selectionLabel} · {trajectoryData.currency}
              </caption>
              <thead>
                <tr>
                  {[
                    'Month',
                    'Incoming submissions',
                    'Bound policies',
                    'Incoming LR',
                    'Bound LR',
                    'Claims ultimate LR',
                    'Expected incoming losses',
                    'Proposed premium',
                    'Expected bound losses',
                    'Bound premium',
                    'Earned premium',
                    'Paid claims',
                    'Case reserves',
                    'IBNR',
                  ].map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.month}>
                    <th scope="row">{row.month}</th>
                    <td>{row.incomingCount}</td>
                    <td>{row.boundCount}</td>
                    <td>{pct(row.incomingRatio)}</td>
                    <td>{pct(row.boundRatio)}</td>
                    <td>{pct(row.claimsRatio)}</td>
                    {[
                      row.incomingLoss,
                      row.proposedPremium,
                      row.boundLoss,
                      row.boundPremium,
                      row.earnedPremium,
                      row.paid,
                      row.caseReserves,
                      row.ibnr,
                    ].map((value, i) => (
                      <td key={i}>{money(value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Evidence>
    </ResultsPanel>
  );
}

export default LossRatioTrajectory;
