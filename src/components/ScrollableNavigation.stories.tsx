import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, waitFor, within } from '@storybook/test'
import ScrollableNavigation from './ScrollableNavigation.js'
const items = ['Dashboard', 'Submissions', 'Underwriting', 'Coverage Structuring', 'Data Pipeline', 'Marketplace', 'Claims', 'Reports', 'Settings', 'Network'].map(label => ({ id: `/${label.toLowerCase().replaceAll(' ', '-')}`, label }))
const meta: Meta<typeof ScrollableNavigation> = {
  title: 'XDS/ScrollableNavigation', component: ScrollableNavigation,
  args: { items, activeId: '/dashboard' }, parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof meta>
export const Desktop: Story = {}
export const Mobile: Story = {
  render: args => <div style={{ width: 320, maxWidth: '100%' }}><ScrollableNavigation {...args} /></div>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rail = canvas.getByRole('navigation', { name: 'Applications' })
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Scroll applications right' })).toBeEnabled())
    expect(canvas.getByRole('button', { name: 'Scroll applications left' })).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Scroll applications right' }))
    await waitFor(() => expect(rail.scrollLeft).toBeGreaterThan(0))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Scroll applications left' })).toBeEnabled())
    await userEvent.click(canvas.getByRole('button', { name: 'Scroll applications left' }))
    await waitFor(() => expect(rail.scrollLeft).toBeLessThan(1))
    const search = canvas.getByRole('searchbox', { name: 'Search applications' })
    await userEvent.type(search, 'network')
    expect(within(rail).getAllByRole('link')).toHaveLength(1)
    await waitFor(() => expect(canvas.queryByRole('button', { name: 'Scroll applications right' })).not.toBeInTheDocument())
    await userEvent.clear(search)
    await userEvent.type(search, 'no-match')
    expect(canvas.getByRole('status')).toHaveTextContent('No applications match')
    await userEvent.keyboard('{Escape}')
    expect(within(rail).getAllByRole('link')).toHaveLength(items.length)
    const result = document.createElement('p')
    result.textContent = 'Mobile navigation checks passed'
    canvasElement.appendChild(result)
  },
}
export const ActiveLinkAtEnd: Story = { ...Mobile, args: { activeId: '/network' }, play: undefined }
export const NoOverflow: Story = { args: { items: items.slice(0, 2) } }
