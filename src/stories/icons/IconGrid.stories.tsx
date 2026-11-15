import React from 'react';
import type { Meta } from '@storybook/react';
import IconGrid from '../../components/IconGrid.js';

const meta: Meta<typeof IconGrid> = {
  id: 'xds-icongrid',
  title: 'Icons/IconGrid',
  component: IconGrid,
};

export default meta;

export const Default = () => (
  <IconGrid
    items={[
      { label: 'Shield' },
      { label: 'Metrics' },
      { label: 'Layers' },
      { label: 'Trust' },
      { label: 'Node' },
    ]}
  />
);
