import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn, within, userEvent, expect, waitFor } from '@storybook/test';
import StructureTree, {
  type StructureTreeNode,
  type StructureTreeProps,
} from '../../components/StructureTree.js';
import { cssVariables, xdsThemes, type XdsThemeName } from '../../palette.js';
import { colors } from '../../colors.js';
import { expectStoryViewport, storyViewport, storyViewports } from '../viewport.js';

const propertyShape: StructureTreeNode[] = [
  {
    id: 'insured',
    kind: 'section',
    label: 'Named insured',
    kindLabel: 'Section',
    children: [
      { id: 'legal-name', kind: 'component', label: 'Legal name', kindLabel: 'Text' },
      { id: 'fein', kind: 'component', label: 'FEIN', kindLabel: 'Text' },
    ],
  },
  {
    id: 'locations',
    kind: 'section',
    label: 'Locations',
    kindLabel: 'List 1–50',
    repeatable: true,
    children: [
      { id: 'address', kind: 'component', label: 'Address', kindLabel: 'Text' },
      {
        id: 'buildings',
        kind: 'subsection',
        label: 'Buildings',
        kindLabel: 'Table',
        repeatable: true,
        children: [
          {
            id: 'tiv',
            kind: 'component',
            label: 'Total insured value',
            kindLabel: 'Currency',
            locked: { reason: 'rating' },
          },
          {
            id: 'construction',
            kind: 'component',
            label: 'Construction class',
            kindLabel: 'Select',
            locked: { reason: 'rating' },
          },
          {
            id: 'sprinklers',
            kind: 'component',
            label: 'Sprinklered',
            kindLabel: 'Yes / No',
            markers: ['ai'],
          },
        ],
      },
    ],
  },
  {
    id: 'loss-history',
    kind: 'section',
    label: 'Loss history',
    kindLabel: 'List 0–10',
    repeatable: true,
    markers: ['new'],
    children: [{ id: 'loss-date', kind: 'component', label: 'Date of loss', kindLabel: 'Date' }],
  },
];

// --- Pure tree edits for the stateful demo (the caller owns the tree in real use). ---

const detach = (
  list: StructureTreeNode[],
  id: string,
): [StructureTreeNode[], StructureTreeNode | null] => {
  let found: StructureTreeNode | null = null;
  const next = list
    .filter((node) => {
      if (node.id === id) {
        found = node;
        return false;
      }
      return true;
    })
    .map((node) => {
      if (found || !node.children) return node;
      const [children, hit] = detach(node.children, id);
      if (hit) found = hit;
      return hit ? { ...node, children } : node;
    });
  return [next, found];
};

const insert = (
  list: StructureTreeNode[],
  parentId: string | null,
  index: number,
  node: StructureTreeNode,
): StructureTreeNode[] => {
  if (parentId === null) {
    const copy = [...list];
    copy.splice(index, 0, node);
    return copy;
  }
  return list.map((n) =>
    n.id === parentId
      ? { ...n, children: insert(n.children ?? [], null, index, node) }
      : n.children
        ? { ...n, children: insert(n.children, parentId, index, node) }
        : n,
  );
};

const parentOf = (
  list: StructureTreeNode[],
  id: string,
  parent: string | null = null,
): string | null | undefined => {
  for (const node of list) {
    if (node.id === id) return parent;
    const hit = node.children ? parentOf(node.children, id, node.id) : undefined;
    if (hit !== undefined) return hit;
  }
  return undefined;
};

let added = 0;

function EditableTree(props: Partial<StructureTreeProps> & { initial?: StructureTreeNode[] }) {
  const { initial = propertyShape, ...rest } = props;
  const [nodes, setNodes] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rest.selectedId ?? null);
  const [log, setLog] = useState('');
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
      <StructureTree
        label="Commercial property shape"
        {...rest}
        nodes={nodes}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          rest.onSelect?.(id);
        }}
        onReorder={(move) => {
          rest.onReorder?.(move);
          setNodes((current) => {
            const parent = parentOf(current, move.id) ?? null;
            const [without, node] = detach(current, move.id);
            return node ? insert(without, parent, move.index, node) : current;
          });
        }}
        onMove={(move) => {
          rest.onMove?.(move);
          setNodes((current) => {
            const [without, node] = detach(current, move.id);
            if (!node) return current;
            const kind =
              node.kind === 'component' ? 'component' : move.newParentId ? 'subsection' : 'section';
            return insert(without, move.newParentId, move.index, { ...node, kind });
          });
        }}
        onRename={(id, label) => {
          rest.onRename?.(id, label);
          const rename = (list: StructureTreeNode[]): StructureTreeNode[] =>
            list.map((n) =>
              n.id === id
                ? { ...n, label }
                : n.children
                  ? { ...n, children: rename(n.children) }
                  : n,
            );
          setNodes(rename);
        }}
        onRemove={(id) => {
          rest.onRemove?.(id);
          setNodes((current) => detach(current, id)[0]);
          setSelectedId(null);
        }}
        onAddChild={(parentId, kind) => {
          rest.onAddChild?.(parentId, kind);
          added += 1;
          const node: StructureTreeNode = {
            id: `added-${added}`,
            kind,
            label: kind === 'component' ? 'New field' : 'New section',
            markers: ['new'],
          };
          setNodes((current) => insert(current, parentId, Number.MAX_SAFE_INTEGER, node));
        }}
        onLockedAttempt={(id) => {
          rest.onLockedAttempt?.(id);
          setLog(`Locked: ${id}`);
        }}
      />
      <p style={{ margin: 0, fontSize: 12 }} data-testid="log">
        {log}
      </p>
    </div>
  );
}

function ThemeFrame({ theme, children }: React.PropsWithChildren<{ theme: XdsThemeName }>) {
  return (
    <div
      data-theme={theme}
      style={{
        ...(cssVariables(xdsThemes[theme]) as React.CSSProperties),
        background: colors.background,
        color: colors.text.primary,
        padding: 24,
        minHeight: 520,
        boxSizing: 'border-box',
        maxWidth: '100%',
      }}
    >
      {children}
    </div>
  );
}

const themed = (theme: XdsThemeName) => [
  (StoryFn: React.ComponentType) => (
    <ThemeFrame theme={theme}>
      <StoryFn />
    </ThemeFrame>
  ),
];

const meta: Meta<typeof EditableTree> = {
  id: 'xds-structure-tree',
  title: 'Navigation/StructureTree',
  component: EditableTree,
  parameters: { viewport: { viewports: storyViewports } },
  args: {
    maxDepth: 3,
    readOnly: false,
    loading: false,
    onSelect: fn(),
    onMove: fn(),
    onReorder: fn(),
    onRename: fn(),
    onRemove: fn(),
    onAddChild: fn(),
    onLockedAttempt: fn(),
  },
  render: (args) => <EditableTree {...args} />,
};

export default meta;
type Story = StoryObj<typeof EditableTree>;

const tree = (el: HTMLElement) =>
  within(el).getByRole('tree', { name: 'Commercial property shape' });
const item = (el: HTMLElement, name: string) => within(el).getByRole('treeitem', { name });
const announcer = (el: HTMLElement) => el.querySelector('[data-part="announcer"]') as HTMLElement;

/** Nested shape: Locations (repeats 1–50) → Buildings table → fields, with locked and AI-proposed nodes. */
export const Default: Story = {
  decorators: themed('light'),
  play: async ({ canvasElement }) => {
    const t = tree(canvasElement);
    await expect(within(t).getAllByRole('treeitem')).toHaveLength(11);
    const buildings = item(canvasElement, 'Buildings');
    await expect(buildings).toHaveAttribute('aria-level', '2');
    await expect(buildings).toHaveAttribute('aria-expanded', 'true');
    const tiv = item(canvasElement, 'Total insured value');
    await expect(tiv).toHaveAttribute('aria-level', '3');
    await expect(tiv).toHaveAccessibleDescription('Currency Locked: rating');
    await expect(item(canvasElement, 'Sprinklered')).toHaveAccessibleDescription(
      'Yes / No AI proposed',
    );
    // Exactly one tab stop.
    await expect(t.querySelectorAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1);
  },
};

export const Dark: Story = { ...Default, decorators: themed('dark') };

/** Arrow keys move focus and selection; Right/Left expand, collapse and move to the parent. */
export const KeyboardNavigation: Story = {
  name: 'Keyboard · navigate and expand',
  decorators: themed('light'),
  play: async ({ canvasElement, args }) => {
    const insured = item(canvasElement, 'Named insured');
    insured.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(item(canvasElement, 'Legal name')).toHaveFocus();
    await expect(item(canvasElement, 'Legal name')).toHaveAttribute('aria-selected', 'true');
    await expect(args.onSelect).toHaveBeenCalledWith('legal-name');
    await userEvent.keyboard('{ArrowLeft}');
    await expect(insured).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(insured).toHaveAttribute('aria-expanded', 'false');
    await expect(within(canvasElement).queryByRole('treeitem', { name: 'Legal name' })).toBeNull();
    await userEvent.keyboard('{ArrowRight}');
    await expect(insured).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{End}');
    await expect(item(canvasElement, 'Date of loss')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(insured).toHaveFocus();
    await userEvent.keyboard('l');
    await expect(item(canvasElement, 'Legal name')).toHaveFocus();
  },
};

/** Alt+Down reorders among siblings and announces the new position politely. */
export const KeyboardReorder: Story = {
  name: 'Keyboard · reorder (Alt+Arrow)',
  decorators: themed('light'),
  play: async ({ canvasElement, args }) => {
    item(canvasElement, 'Named insured').focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await expect(args.onReorder).toHaveBeenCalledWith({ id: 'insured', index: 1 });
    await waitFor(() =>
      expect(item(canvasElement, 'Named insured')).toHaveAttribute('aria-posinset', '2'),
    );
    await waitFor(() => expect(item(canvasElement, 'Named insured')).toHaveFocus());
    await expect(announcer(canvasElement)).toHaveTextContent(
      'Named insured moved to position 2 of 3 in Top level.',
    );
    await expect(announcer(canvasElement)).toHaveAttribute('aria-live', 'polite');
  },
};

/** M opens "Move to"; disabled targets say why; Enter moves the node into another section. */
export const KeyboardMove: Story = {
  name: 'Keyboard · move to another parent (M)',
  decorators: themed('light'),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    item(canvasElement, 'Date of loss').focus();
    await userEvent.keyboard('m');
    const listbox = await canvas.findByRole('listbox', { name: 'Move Date of loss to' });
    await waitFor(() => expect(listbox).toHaveFocus());
    const top = canvas.getByRole('option', { name: 'Top level' });
    await expect(top).toHaveAttribute('aria-disabled', 'true');
    await expect(top).toHaveAccessibleDescription('Components must sit inside a section.');
    await expect(canvas.getByRole('option', { name: 'Loss history' })).toHaveAccessibleDescription(
      'Already here.',
    );
    const active = listbox.getAttribute('aria-activedescendant');
    await expect(active && document.getElementById(active)).toHaveAccessibleName('Named insured');
    // Move the drop-preview to Buildings and check the tree highlights it as the target.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    const buildingsOption = canvas.getByRole('option', { name: 'Buildings' });
    await expect(buildingsOption).toHaveAttribute('aria-selected', 'true');
    await expect(
      item(canvasElement, 'Buildings').querySelector('[data-part="row"]'),
    ).toHaveAttribute('data-move-target', 'true');
    await userEvent.keyboard('{Enter}');
    await expect(args.onMove).toHaveBeenCalledWith({
      id: 'loss-date',
      newParentId: 'buildings',
      index: 3,
    });
    await waitFor(() =>
      expect(item(canvasElement, 'Date of loss')).toHaveAttribute('aria-level', '3'),
    );
    await waitFor(() => expect(item(canvasElement, 'Date of loss')).toHaveFocus());
    await expect(announcer(canvasElement)).toHaveTextContent('Date of loss moved into Buildings.');
  },
};

/** Esc closes "Move to" without moving and returns focus to the node. */
export const MoveCancelled: Story = {
  name: 'Keyboard · move cancelled (Esc)',
  decorators: themed('light'),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    item(canvasElement, 'Address').focus();
    await userEvent.keyboard('m');
    await canvas.findByRole('listbox');
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('listbox')).toBeNull();
    await waitFor(() => expect(item(canvasElement, 'Address')).toHaveFocus());
    await expect(args.onMove).not.toHaveBeenCalled();
  },
};

/** Locked node: move, reorder and Delete call `onLockedAttempt`; Move and Remove explain why. */
export const LockedNode: Story = {
  decorators: themed('light'),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    item(canvasElement, 'Total insured value').focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Delete}');
    await expect(args.onRemove).not.toHaveBeenCalled();
    await expect(args.onLockedAttempt).toHaveBeenCalledWith('tiv');
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await userEvent.keyboard('m');
    await expect(args.onReorder).not.toHaveBeenCalled();
    await expect(canvas.queryByRole('listbox')).toBeNull();
    await expect(announcer(canvasElement)).toHaveTextContent(
      "Total insured value is locked: rating. It can't be moved or removed.",
    );
    const move = canvas.getByRole('button', { name: 'Move…' });
    await expect(move).toHaveAttribute('aria-disabled', 'true');
    await expect(move).toHaveAccessibleDescription('Total insured value is locked: rating.');
  },
};

/** Depth limit: at level 2 of a 2-level shape, "Add sub-section" stays focusable and says why. */
export const DepthLimit: Story = {
  decorators: themed('light'),
  args: { maxDepth: 2, selectedId: 'buildings' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole('button', { name: 'Add sub-section' });
    await expect(add).toHaveAttribute('aria-disabled', 'true');
    await expect(add).toHaveAccessibleDescription(
      'Level limit reached: sections can nest 2 levels.',
    );
    add.focus();
    await expect(add).toHaveFocus();
    await userEvent.click(add);
    await expect(args.onAddChild).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Add component' }));
    await expect(args.onAddChild).toHaveBeenCalledWith('buildings', 'component');
  },
};

/** F2 renames in place; Enter commits. */
export const Rename: Story = {
  decorators: themed('light'),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    item(canvasElement, 'Address').focus();
    await userEvent.keyboard('{F2}');
    const input = await canvas.findByRole('textbox', { name: 'Rename Address' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Risk address{Enter}');
    await expect(args.onRename).toHaveBeenCalledWith('address', 'Risk address');
    await waitFor(() => expect(item(canvasElement, 'Risk address')).toHaveFocus());
  },
};

/** Read-only (published shape): navigation only; no toolbar; edit keys do nothing. */
export const ReadOnly: Story = {
  decorators: themed('light'),
  args: { readOnly: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button')).toBeNull();
    item(canvasElement, 'Address').focus();
    await userEvent.keyboard('{Delete}{F2}m{Alt>}{ArrowDown}{/Alt}');
    await expect(args.onRemove).not.toHaveBeenCalled();
    await expect(args.onReorder).not.toHaveBeenCalled();
    await expect(canvas.queryByRole('listbox')).toBeNull();
    await expect(canvas.queryByRole('textbox')).toBeNull();
  },
};

/** Shape with a published-version reason: every add control is disabled and says why. */
export const AddDisabled: Story = {
  decorators: themed('light'),
  args: {
    disabledAddReason: 'Version 3 is published. Create version 4 to change its structure.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ['Add section', 'Add sub-section', 'Add component']) {
      const button = canvas.getByRole('button', { name });
      await expect(button).toHaveAttribute('aria-disabled', 'true');
      await expect(button).toHaveAccessibleDescription(
        'Version 3 is published. Create version 4 to change its structure.',
      );
    }
  },
};

export const Empty: Story = {
  decorators: themed('light'),
  args: { initial: [] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('tree')).toBeNull();
    await expect(
      canvas.getByText('No sections yet. Add a section to start the shape.'),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Add section' }));
    await expect(args.onAddChild).toHaveBeenCalledWith(null, 'section');
    await expect(await canvas.findByRole('treeitem', { name: 'New section' })).toBeInTheDocument();
  },
};

export const Loading: Story = {
  decorators: themed('light'),
  args: { loading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('tree')).toBeNull();
    await expect(canvas.getByText('Loading Commercial property shape…')).toBeInTheDocument();
    await expect(canvasElement.querySelector('[data-part="skeleton"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  },
};

/** 375 px: labels and tags wrap, indentation is capped, and nothing scrolls sideways. */
export const Narrow: Story = {
  name: 'Narrow · 375 px',
  decorators: themed('dark'),
  parameters: storyViewport(375),
  play: async ({ canvasElement }) => {
    expectStoryViewport(375);
    await expect(tree(canvasElement)).toBeInTheDocument();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};
