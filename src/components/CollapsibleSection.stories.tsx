import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { CollapsibleSection } from './CollapsibleSection.js';
import type { CollapsibleSectionProps } from './CollapsibleSection.js';

const meta: Meta<typeof CollapsibleSection> = {
  title: 'XDS/CollapsibleSection',
  component: CollapsibleSection,
};

export default meta;

type Story = StoryObj<typeof CollapsibleSection>;

const StatefulSection: React.FC<
  Omit<CollapsibleSectionProps, 'collapsed' | 'onToggle'> & { initialCollapsed?: boolean }
> = ({ initialCollapsed = true, children, ...rest }) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  return (
    <CollapsibleSection {...rest} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)}>
      {children}
    </CollapsibleSection>
  );
};

export const Default: Story = {
  render: () => (
    <StatefulSection title="Coverage details" description="Property and liability lines">
      <p>This is the collapsible body content for the default tone.</p>
    </StatefulSection>
  ),
};

export const PrimaryWithCount: Story = {
  render: () => (
    <StatefulSection
      title="Open submissions"
      description="Awaiting underwriter review"
      count={7}
      tone="primary"
      initialCollapsed={false}
    >
      <p>Seven submissions are currently open.</p>
    </StatefulSection>
  ),
};

export const TogglesOpenAndClosed: Story = {
  render: () => (
    <StatefulSection title="Risk factors" count={3}>
      <p data-testid="body-content">Detailed risk factor breakdown.</p>
    </StatefulSection>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole('button');

    // Starts collapsed: aria-expanded false, body hidden
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByTestId('body-content')).not.toBeInTheDocument();

    // Click to expand
    await userEvent.click(header);
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByTestId('body-content')).toBeInTheDocument();

    // Click to collapse again
    await userEvent.click(header);
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByTestId('body-content')).not.toBeInTheDocument();
  },
};

function Draft(){const [value,setValue]=useState('');return <label>Draft<input value={value} onChange={e=>setValue(e.target.value)}/></label>;}
export const PreservesMountedDraft:Story={render:()=> <StatefulSection title="Persistent settings" keepMounted><Draft/></StatefulSection>,play:async({canvasElement})=>{const c=within(canvasElement);const header=c.getByRole('button');await expect(c.queryByLabelText('Draft')).not.toBeInTheDocument();await userEvent.click(header);await userEvent.type(c.getByLabelText('Draft'),'unsaved');await userEvent.click(header);await expect(c.getByLabelText('Draft')).not.toBeVisible();await expect(c.queryByRole('textbox')).not.toBeInTheDocument();await expect(header).toHaveAttribute('aria-expanded','false');header.focus();await userEvent.keyboard('{Enter}');await expect(c.getByLabelText('Draft')).toHaveValue('unsaved');await expect(c.getByRole('region')).toHaveAttribute('id',header.getAttribute('aria-controls'));}};
export const LegacyUnmountBehavior:Story={render:()=> <StatefulSection title="Legacy section"><Draft/></StatefulSection>,play:async({canvasElement})=>{const c=within(canvasElement);const header=c.getByRole('button');await userEvent.click(header);await userEvent.type(c.getByLabelText('Draft'),'discarded');await userEvent.click(header);await expect(c.queryByLabelText('Draft')).not.toBeInTheDocument();await userEvent.click(header);await expect(c.getByLabelText('Draft')).toHaveValue('');}};
