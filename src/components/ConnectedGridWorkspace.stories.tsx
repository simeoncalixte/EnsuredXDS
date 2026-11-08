import React from 'react';
import type { Meta } from '@storybook/react';
import ConnectedGridWorkspace from './ConnectedGridWorkspace.js';
import Badge from './Badge.js';
import Button from './Button.js';
import InfoCard from './InfoCard.js';
import MetricCard from './MetricCard.js';

const meta: Meta<typeof ConnectedGridWorkspace> = {
  title: 'XDS/ConnectedGridWorkspace',
  component: ConnectedGridWorkspace,
};

export default meta;

const SAMPLE_TEMPLATES = [
  {
    id: 'submission-risk',
    label: 'Submission Risk',
    render: () => <Badge variant="primary">Risk Watch</Badge>,
  },
  {
    id: 'portfolio-health',
    label: 'Portfolio Health',
    render: () => <MetricCard label="Portfolio Health" value="91.4" delta="+1.2" />,
  },
  {
    id: 'capital-buffer',
    label: 'Capital Buffer',
    render: () => <InfoCard title="Capital Buffer" value="$2.4M" tone="secondary" />,
  },
  {
    id: 'rebalance-action',
    label: 'Rebalance Action',
    render: () => <Button variant="primary">Run Rebalance</Button>,
  },
];

export const DragNewElementsIntoContainers = () => {
  return (
    <ConnectedGridWorkspace
      title="Connected Grid - Placement Tracker"
      templates={SAMPLE_TEMPLATES}
      storageKey="storybook-connected-grid-workspace-sample"
    />
  );
};

export const RenderedLayoutOnly = () => {
  return (
    <ConnectedGridWorkspace
      title="Connected Grid - Placement Tracker"
      templates={SAMPLE_TEMPLATES}
      storageKey="storybook-connected-grid-workspace-sample"
      initialViewMode="rendered"
      showViewToggle={false}
    />
  );
};
