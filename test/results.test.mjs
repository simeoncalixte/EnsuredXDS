import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';

test('result states preserve zero and suppress stale metrics; shares and targets have valid accessible bounds', async () => {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    const { default: Metric } = await server.ssrLoadModule('/src/components/ResultMetricCard.tsx');
    const { default: Allocation } = await server.ssrLoadModule(
      '/src/components/AllocationList.tsx',
    );
    const render = (props) => renderToStaticMarkup(React.createElement(Metric, props));
    const missing = render({
      label: 'Premium',
      value: null,
      status: { label: 'Healthy', tone: 'success' },
      comparison: { label: 'Stale comparison' },
    });
    assert.match(missing, /Data is not available/);
    assert.doesNotMatch(missing, /Healthy|Stale comparison/);
    assert.doesNotMatch(render({ label: 'Premium', value: '$123', state: 'loading' }), /\$123/);
    assert.match(
      render({ label: 'Premium', value: '$0', coverage: { populated: 0, total: 8 } }),
      /\$0/,
    );
    assert.match(
      render({ label: 'Premium', value: '$0', coverage: { populated: 0, total: 8 } }),
      /Partial data/,
    );
    const target = render({
      label: 'Premium',
      value: '$10',
      target: { label: 'Target progress', value: 20, max: 10 },
    });
    assert.match(target, /aria-valuenow="100"/);
    assert.match(target, /aria-label="Target progress"/);
    const allocation = renderToStaticMarkup(
      React.createElement(Allocation, {
        basis: 'Matching submissions',
        items: [
          { id: 'zero', label: 'Property', share: 0, formattedValue: '0 records' },
          { id: 'unknown', label: 'Cyber', share: null, formattedValue: 'Unknown' },
          { id: 'invalid', label: 'Marine', share: Infinity, formattedValue: 'Unknown' },
        ],
      }),
    );
    assert.equal((allocation.match(/role="progressbar"/g) ?? []).length, 1);
    assert.match(allocation, /aria-label="Property allocation"/);
    assert.match(allocation, /Share unavailable/);
    assert.doesNotMatch(allocation, /Infinity|NaN/);
  } finally {
    await server.close();
  }
});

test('catastrophe and renewal sections keep actions explicit and suppress unavailable aggregates', async () => {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    const { default: Risk } = await server.ssrLoadModule('/src/components/NatCatRiskBanner.tsx');
    const { default: Watchlist } = await server.ssrLoadModule(
      '/src/components/TreatyRenewalWatchlist.tsx',
    );
    const { default: Card } = await server.ssrLoadModule('/src/components/TreatyRenewalCard.tsx');
    const render = (component, props) =>
      renderToStaticMarkup(React.createElement(component, props));
    const risk = render(Risk, {
      title: 'Wind scenario',
      grossExposure: '$0',
      netRetained: null,
      treatyCount: 0,
      onRunStressTest() {},
      stressTestRunning: true,
      details: 'Scenario details',
    });
    assert.match(risk, /\$0/);
    assert.match(risk, /Unavailable/);
    assert.match(risk, /across 0 treaties/);
    assert.match(risk, /disabled=""/);
    assert.match(risk, /aria-expanded="false"/);
    assert.match(risk, /hidden=""/);
    const missingRisk = render(Risk, {
      title: 'Wind scenario',
      grossExposure: '$99M',
      netRetained: '$10M',
      state: 'unavailable',
      onRunStressTest() {},
    });
    assert.doesNotMatch(missingRisk, /\$99M|Run RDS stress test/);
    const item = {
      id: 'one',
      title: 'Marine renewal',
      treatyReference: 'TR-1',
      status: { label: 'Quoting' },
      critical: true,
      targetLimit: '$0',
      indicativeRate: null,
      expiryLabel: 'December 1, 2026',
      expiryDate: '2026-12-01',
      participation: '0%',
      rateChange: { label: 'Stale rate change' },
    };
    const card = render(Card, item);
    assert.match(card, /dateTime="2026-12-01"/i);
    assert.doesNotMatch(card, /Stale rate change/);
    assert.match(card, /\$0/);
    const list = render(Watchlist, { title: 'Renewals', items: [item], totalRenewingLimit: null });
    assert.match(list, /1 critical renewal/);
    assert.match(list, /Total renewing limit: <strong>Unavailable/);
    const empty = render(Watchlist, { title: 'Renewals', items: [], totalRenewingLimit: '$160M' });
    assert.match(empty, /No results match/);
    assert.doesNotMatch(empty, /\$160M/);
    const failed = render(Watchlist, {
      title: 'Renewals',
      items: [item],
      totalRenewingLimit: '$160M',
      state: 'error',
    });
    assert.doesNotMatch(failed, /\$160M|Marine renewal|critical renewal/);
  } finally {
    await server.close();
  }
});

test('pipeline sections preserve missing values and explicit totals without fabricating distributions', async () => {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, hmr: { server: createHttpServer() } },
    ssr: { noExternal: ['styled-components'] },
  });
  try {
    const load = async (name) =>
      (await server.ssrLoadModule(`/src/components/${name}.tsx`)).default;
    const Stage = await load('PipelineStageCard');
    const Appetite = await load('AppetiteDistribution');
    const Sla = await load('SlaVelocityPanel');
    const Queue = await load('PriorityUnderwriterQueue');
    const Pipeline = await load('SubmissionPipelineOverview');
    const render = (component, props) =>
      renderToStaticMarkup(React.createElement(component, props));
    const zero = render(Stage, {
      title: 'Intake',
      count: 0,
      exposure: '$0',
      progress: { percent: 0, label: 'Inquiry share' },
    });
    assert.match(zero, /0 deals/);
    assert.match(zero, /\$0/);
    assert.match(zero, /aria-valuenow="0"/);
    const invalid = render(Stage, {
      title: 'Intake',
      count: -1,
      exposure: null,
      progress: { percent: NaN, label: 'Invalid' },
    });
    assert.match(invalid, /Count unavailable/);
    assert.doesNotMatch(invalid, /role="progressbar"|NaN/);
    const base = { title: 'Appetite', basis: 'Assessed inquiries' };
    const distribution = render(Appetite, {
      ...base,
      segments: [
        { id: 'in', label: 'In appetite', percent: 68 },
        { id: 'zero', label: 'Referral', percent: 0 },
      ],
    });
    assert.match(distribution, /role="img"/);
    assert.match(distribution, /Unspecified: 32%/);
    for (const percentages of [[null], [80, 30], [Infinity]]) {
      const html = render(Appetite, {
        ...base,
        segments: percentages.map((percent, id) => ({
          id: String(id),
          label: 'Category',
          percent,
        })),
      });
      assert.doesNotMatch(html, /role="img"|NaN|Infinity/);
      assert.match(html, /Distribution unavailable/);
    }
    const sla = render(Sla, {
      title: 'SLA',
      cycleTime: null,
      clearanceEfficiency: '0%',
      comparison: { label: 'Stale comparison' },
      basis: 'Completed submissions',
    });
    assert.doesNotMatch(sla, /Stale comparison/);
    assert.match(sla, /0%/);
    const items = [
      { id: 'one', title: 'Critical submission', critical: true, status: { label: '4h left' } },
    ];
    assert.match(render(Queue, { title: 'Queue', items }), /1 critical/);
    for (const state of ['loading', 'error', 'unavailable']) {
      assert.doesNotMatch(
        render(Queue, { title: 'Queue', items, state }),
        /Critical submission|1 critical|4h left/,
      );
      assert.doesNotMatch(
        render(Pipeline, {
          title: 'Pipeline',
          stages: [{ id: 'one', title: 'Intake', count: 5, exposure: '$28M' }],
          activeCount: 13,
          capacity: '$84M',
          state,
        }),
        /13 active inquiries|\$84M|\$28M/,
      );
    }
    const pipeline = render(Pipeline, {
      title: 'Pipeline',
      stages: [{ id: 'one', title: 'Intake', count: 5, exposure: '$28M' }],
      activeCount: 13,
    });
    assert.match(pipeline, /13 active inquiries/);
    assert.doesNotMatch(pipeline, /5 active inquiries/);
    assert.doesNotMatch(
      render(Pipeline, { title: 'Pipeline', stages: [], activeCount: 13 }),
      /13 active inquiries/,
    );
  } finally {
    await server.close();
  }
});

test('dashboard validators work without runtime code generation under a restrictive CSP', () => {
  const generated = readFileSync(
    new URL('../dist/validation/dashboardValidators.generated.js', import.meta.url),
    'utf8',
  ).replace(/export const /g, 'const ');
  const context = { valid: null, invalid: null };
  runInNewContext(
    generated +
      '\nvalid = resultMetricCard({label: "Count", value: "0"}); invalid = resultMetricCard({label: "Count", value: 0});',
    context,
    { codeGeneration: { strings: false, wasm: false } },
  );
  assert.equal(context.valid, true);
  assert.equal(context.invalid, false);
});
