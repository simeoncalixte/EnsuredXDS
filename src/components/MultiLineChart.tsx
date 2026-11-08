import React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { colors } from '../colors.js';

import type { MultiLineChartProps } from './UnderwritingDashboard.types.js';
export type { LineSeries, MultiLineChartProps } from './UnderwritingDashboard.types.js';

const TOOLTIP_STYLE = {
  background: colors.surfacePanel,
  border: `1px solid ${colors.surfaceHigh}`,
  borderRadius: 4,
  fontSize: 11,
};

export default function MultiLineChart({
  data,
  xKey,
  series,
  xFormatter,
  yFormatter,
  refLine,
  refLineLabel,
  height = 200,
  tooltipContent,
}: MultiLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.text.secondary,
        }}
      >
        No data
      </div>
    );
  }

  const yFmt =
    yFormatter ?? ((v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 12 }}>
          <CartesianGrid stroke={colors.surfaceLow} strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
            tickFormatter={xFormatter ?? ((v) => String(v))}
            tick={{ fill: colors.text.secondary, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={yFmt}
            tick={{ fill: colors.text.secondary, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={tooltipContent}
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: colors.text.secondary }}
            labelFormatter={xFormatter ? (v) => xFormatter(v) : undefined}
            formatter={(value: ValueType | undefined, name: NameType | undefined) => {
              const key = String(name ?? '');
              const s = series.find((s) => s.key === key);
              const fmt = s?.format ?? yFmt;
              return [fmt(Number(value)), s?.label ?? key];
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 11, color: colors.text.secondary, paddingTop: 4 }}
          />
          {refLine !== undefined && (
            <ReferenceLine
              y={refLine}
              stroke={colors.dataViz.red}
              strokeDasharray="5 3"
              label={{
                value: refLineLabel ?? String(refLine),
                fill: colors.dataViz.red,
                fontSize: 10,
              }}
            />
          )}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? '6 3' : undefined}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
