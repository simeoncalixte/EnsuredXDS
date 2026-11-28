import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { radii, spacing, typography } from '../tokens.js';
import { Button } from './Button.js';

export type StructureTreeNodeKind = 'section' | 'subsection' | 'component';

/** Text marker on a node. Each marker shows a text tag and a leading rule; colour is never the only cue. */
export type StructureTreeMarker = 'ai' | 'new';

export type StructureTreeNode = {
  id: string;
  kind: StructureTreeNodeKind;
  /** Visible name, e.g. "Locations" or "Total insured value". */
  label: string;
  /** Plain-text kind shown beside the label, e.g. "Section", "List 1–50", "Table" or "Text". */
  kindLabel?: string;
  /** Catalogue id of the component this node renders, e.g. "xds.editable-table". Shown to the caller only. */
  componentRef?: string;
  /** The section repeats per record (e.g. one Buildings block per building). Shown as "Repeats" when there is no kindLabel. */
  repeatable?: boolean;
  /** Protected node, e.g. a field that rating depends on. It can't be moved, reordered or removed. `reason` is shown as a text tag. */
  locked?: { reason: string };
  markers?: StructureTreeMarker[];
  /** Children of a section or sub-section. Components have none. */
  children?: StructureTreeNode[];
};

export type StructureTreeMove = { id: string; newParentId: string | null; index: number };
export type StructureTreeReorder = { id: string; index: number };

/** What happened, for the polite live region. Pass `announce` to replace the default text. */
export type StructureTreeAnnouncement =
  | {
      type: 'reorder';
      node: StructureTreeNode;
      index: number;
      siblingCount: number;
      parentLabel: string;
    }
  | { type: 'move'; node: StructureTreeNode; parentLabel: string }
  | { type: 'locked'; node: StructureTreeNode };

export type StructureTreeMoveTarget = {
  /** `null` is the top level. */
  parentId: string | null;
  label: string;
  /** What choosing this target does, e.g. "Moves into Buildings, level 3". */
  effectText: string;
  /** When set, the option is shown but can't be chosen. */
  disabledReason?: string;
};

export type StructureTreeProps = {
  /** Accessible name of the tree, e.g. "Commercial property shape". */
  label: string;
  nodes: StructureTreeNode[];
  /** Controlled selection. Selection follows focus. */
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Controlled expansion. When omitted, every node starts expanded and the tree tracks it. */
  expandedIds?: string[];
  onToggle?: (id: string) => void;
  onMove?: (move: StructureTreeMove) => void;
  onReorder?: (reorder: StructureTreeReorder) => void;
  onAddChild?: (parentId: string | null, kind: StructureTreeNodeKind) => void;
  onRemove?: (id: string) => void;
  onRename?: (id: string, label: string) => void;
  /** Called instead of move, reorder or remove on a locked node, so the caller can explain why. */
  onLockedAttempt?: (id: string) => void;
  /** Deepest level a section or sub-section can sit at. Components can go inside any of them. Defaults to 3. */
  maxDepth?: number;
  /** When set, every add control is disabled and points to this reason (e.g. "This shape is published. Create a new version to edit it."). */
  disabledAddReason?: string;
  /** Navigation and selection only: no toolbar, no keyboard edits. */
  readOnly?: boolean;
  loading?: boolean;
  /** Shown when `nodes` is empty. Defaults to "No sections yet. Add a section to start the shape." */
  emptyMessage?: string;
  /** Replaces the default live-region text. */
  announce?: (event: StructureTreeAnnouncement) => string;
  className?: string;
};

type FlatNode = {
  node: StructureTreeNode;
  level: number;
  parentId: string | null;
  index: number;
  siblingCount: number;
};

const ROOT_LABEL = 'Top level';
const DEFAULT_EMPTY = 'No sections yet. Add a section to start the shape.';

const isContainer = (node: StructureTreeNode) => node.kind !== 'component';

/** How many container levels a subtree occupies (a lone section is 1, a component is 0). */
const containerHeight = (node: StructureTreeNode): number =>
  isContainer(node)
    ? 1 + Math.max(0, ...(node.children ?? []).map((child) => containerHeight(child)))
    : 0;

const indexTree = (nodes: StructureTreeNode[]) => {
  const byId = new Map<string, FlatNode>();
  const walk = (list: StructureTreeNode[], level: number, parentId: string | null) =>
    list.forEach((node, index) => {
      byId.set(node.id, { node, level, parentId, index, siblingCount: list.length });
      if (node.children) walk(node.children, level + 1, node.id);
    });
  walk(nodes, 1, null);
  return byId;
};

const defaultAnnouncement = (event: StructureTreeAnnouncement) => {
  switch (event.type) {
    case 'reorder':
      return `${event.node.label} moved to position ${event.index + 1} of ${event.siblingCount} in ${event.parentLabel}.`;
    case 'move':
      return `${event.node.label} moved into ${event.parentLabel}.`;
    case 'locked':
      return `${event.node.label} is locked: ${event.node.locked?.reason ?? ''}. It can't be moved or removed.`;
  }
};

const Root = styled.div`
  display: grid;
  gap: ${spacing.sm}px;
  min-width: 0;
  font-family: ${typography.fontFamily};
  color: ${colors.onSurface};
  font-size: ${typography.sizes.sm}px;
  line-height: 1.4;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.xs}px;

  button[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.6;
  }

  @media (pointer: coarse) {
    button {
      min-height: 44px;
    }
  }
`;

const Reason = styled.p`
  margin: 0;
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.xs}px;
`;

const TreeList = styled.ul`
  list-style: none;
  margin: 0;
  padding: ${spacing.xs}px 0;
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.md}px;
  background: ${colors.surface};
  min-width: 0;
`;

const GroupList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Item = styled.li`
  outline: none;

  &:focus-visible > [data-part='row'] {
    outline: 2px solid ${colors.secondary};
    outline-offset: -2px;
  }
`;

const Row = styled.div<{ $level: number; $marked: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${spacing.sm}px;
  min-height: 32px;
  box-sizing: border-box;
  padding: ${spacing.xs}px ${spacing.sm}px;
  /* Indent by level, capped so deep trees still fit a phone. */
  padding-left: ${({ $level }) => spacing.sm + Math.min($level - 1, 4) * spacing.md}px;
  border-left: 3px solid ${({ $marked }) => ($marked ? colors.secondary : 'transparent')};
  cursor: pointer;
  overflow-wrap: anywhere;

  &:hover {
    background: ${colors.surfaceContainer};
  }

  [aria-selected='true'] > & {
    background: ${colors.surfaceContainerHigh};
    font-weight: ${typography.weights.semibold};
  }

  &[data-move-target='true'] {
    outline: 2px dashed ${colors.secondary};
    outline-offset: -2px;
  }

  @media (pointer: coarse) {
    min-height: 44px;
  }
`;

const Twisty = styled.span`
  display: inline-flex;
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: 3px;
  color: ${colors.onSurfaceVariant};

  svg {
    display: block;
    width: 16px;
    height: 16px;
  }
`;

const RowContent = styled.span`
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: ${spacing.xs}px ${spacing.sm}px;
  min-width: 0;
`;

const Label = styled.span`
  min-width: 0;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 ${spacing.xs}px;
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.sm}px;
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.medium};
  white-space: nowrap;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const MarkerTag = styled(Tag)`
  border-color: ${colors.secondary};
  color: ${colors.onSurface};
`;

const RenameInput = styled.input`
  min-width: 0;
  flex: 1 1 160px;
  padding: 2px ${spacing.xs}px;
  border: 1px solid ${colors.outline};
  border-radius: ${radii.sm}px;
  background: ${colors.surface};
  color: ${colors.onSurface};
  font: inherit;

  &:focus-visible {
    outline: 2px solid ${colors.secondary};
    outline-offset: 1px;
  }
`;

const Empty = styled.p`
  margin: 0;
  padding: ${spacing.md}px;
  border: 1px dashed ${colors.outlineVariant};
  border-radius: ${radii.md}px;
  color: ${colors.onSurfaceVariant};
`;

const Skeleton = styled.div`
  display: grid;
  gap: ${spacing.sm}px;
  padding: ${spacing.sm}px;
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.md}px;

  span {
    display: block;
    height: 16px;
    border-radius: ${radii.sm}px;
    background: ${colors.surfaceContainerHigh};
  }
`;

const MovePanel = styled.div`
  display: grid;
  gap: ${spacing.xs}px;
  padding: ${spacing.sm}px;
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.md}px;
  background: ${colors.surfaceContainer};
`;

const MoveHeading = styled.p`
  margin: 0;
  font-weight: ${typography.weights.semibold};
`;

const Option = styled.li`
  display: grid;
  gap: 2px;
  padding: ${spacing.xs}px ${spacing.sm}px;
  border-radius: ${radii.sm}px;
  cursor: pointer;

  &[data-active='true'] {
    background: ${colors.surfaceContainerHigh};
    outline: 2px solid ${colors.secondary};
    outline-offset: -2px;
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
  }

  &[aria-disabled='true'] [data-part='option-label'] {
    color: ${colors.onSurfaceVariant};
  }

  @media (pointer: coarse) {
    min-height: 44px;
  }
`;

const OptionText = styled.span`
  color: ${colors.onSurfaceVariant};
  font-size: ${typography.sizes.xs}px;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path
      d={open ? 'M4 6l4 4 4-4' : 'M6 4l4 4-4 4'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
    <rect x="2" y="5.5" width="8" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4 5.5V4a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const MARKER_TEXT: Record<StructureTreeMarker, string> = { ai: 'AI proposed', new: 'New' };

/**
 * Structure tree (WAI-ARIA tree pattern) for a submission shape or risk-class template:
 * sections, sub-sections at any allowed depth, and the components inside them.
 *
 * Keyboard, on a focused node:
 * - Up/Down move between visible nodes (selection follows focus); Home/End go to the first and last.
 * - Right expands, or moves to the first child; Left collapses, or moves to the parent.
 * - Alt+Up/Down reorder among siblings (`onReorder`).
 * - M opens a "Move to" listbox (`onMove`). Each option says what it does or why it can't be chosen.
 * - F2 renames (`onRename`); Delete asks to remove (`onRemove`).
 * - On a locked node, move, reorder and remove call `onLockedAttempt` instead.
 *
 * Every change is a callback; the caller owns `nodes` and persistence. Moves and reorders are
 * announced in a polite live region. Nothing here is drag-only (WCAG 2.5.7).
 */
export function StructureTree({
  label,
  nodes,
  selectedId: selectedIdProp,
  onSelect,
  expandedIds: expandedIdsProp,
  onToggle,
  onMove,
  onReorder,
  onAddChild,
  onRemove,
  onRename,
  onLockedAttempt,
  maxDepth = 3,
  disabledAddReason,
  readOnly = false,
  loading = false,
  emptyMessage = DEFAULT_EMPTY,
  announce = defaultAnnouncement,
  className,
}: StructureTreeProps) {
  const baseId = useId();
  const byId = useMemo(() => indexTree(nodes), [nodes]);

  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const selectedId = selectedIdProp !== undefined ? selectedIdProp : internalSelected;
  const [internalCollapsed, setInternalCollapsed] = useState<Set<string>>(() => new Set());
  const isExpanded = (id: string) =>
    expandedIdsProp ? expandedIdsProp.includes(id) : !internalCollapsed.has(id);

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveFor, setMoveFor] = useState<string | null>(null);
  const [moveActive, setMoveActive] = useState(0);
  const [message, setMessage] = useState('');
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const listboxRef = useRef<HTMLUListElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const typeahead = useRef({ text: '', at: 0 });

  // Visible nodes in document order.
  const visible: FlatNode[] = [];
  const collect = (list: StructureTreeNode[]) =>
    list.forEach((node) => {
      const entry = byId.get(node.id);
      if (entry) visible.push(entry);
      if (node.children?.length && isExpanded(node.id)) collect(node.children);
    });
  collect(nodes);

  const tabStopId =
    (focusedId && byId.has(focusedId) && focusedId) ||
    (selectedId && byId.has(selectedId) && selectedId) ||
    visible[0]?.node.id ||
    null;

  useEffect(() => {
    if (pendingFocus.current) {
      itemRefs.current.get(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
  });

  useEffect(() => {
    if (moveFor) listboxRef.current?.focus();
  }, [moveFor]);

  const say = (event: StructureTreeAnnouncement) => setMessage(announce(event));

  const focusNode = (id: string, select = true) => {
    setFocusedId(id);
    itemRefs.current.get(id)?.focus();
    if (select && id !== selectedId) {
      if (selectedIdProp === undefined) setInternalSelected(id);
      onSelect?.(id);
    }
  };

  const toggle = (id: string) => {
    if (!expandedIdsProp)
      setInternalCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    onToggle?.(id);
  };

  const parentLabel = (parentId: string | null) =>
    parentId ? (byId.get(parentId)?.node.label ?? ROOT_LABEL) : ROOT_LABEL;

  const lockedAttempt = (entry: FlatNode) => {
    say({ type: 'locked', node: entry.node });
    onLockedAttempt?.(entry.node.id);
  };

  const reorder = (entry: FlatNode, delta: number) => {
    if (readOnly || !onReorder) return;
    if (entry.node.locked) return lockedAttempt(entry);
    const index = entry.index + delta;
    if (index < 0 || index >= entry.siblingCount) return;
    onReorder({ id: entry.node.id, index });
    pendingFocus.current = entry.node.id;
    say({
      type: 'reorder',
      node: entry.node,
      index,
      siblingCount: entry.siblingCount,
      parentLabel: parentLabel(entry.parentId),
    });
  };

  const moveTargets = (entry: FlatNode): StructureTreeMoveTarget[] => {
    const node = entry.node;
    const height = containerHeight(node);
    const descendants = new Set<string>();
    const mark = (n: StructureTreeNode) => {
      descendants.add(n.id);
      n.children?.forEach(mark);
    };
    mark(node);
    const targets: StructureTreeMoveTarget[] = [];
    const describe = (parentId: string | null, level: number, targetLabel: string) => {
      let disabledReason: string | undefined;
      if (parentId === entry.parentId) disabledReason = 'Already here.';
      else if (parentId === null && !isContainer(node))
        disabledReason = 'Components must sit inside a section.';
      else if (level - 1 + height > maxDepth)
        disabledReason = `Too deep: sections can nest ${maxDepth} levels.`;
      targets.push({
        parentId,
        label: targetLabel,
        effectText:
          parentId === null
            ? 'Moves to the end of the top level, level 1.'
            : `Moves to the end of ${targetLabel}, level ${level}.`,
        disabledReason,
      });
    };
    describe(null, 1, ROOT_LABEL);
    for (const candidate of byId.values()) {
      if (!isContainer(candidate.node) || descendants.has(candidate.node.id)) continue;
      describe(candidate.node.id, candidate.level + 1, candidate.node.label);
    }
    return targets;
  };

  const moveEntry = moveFor ? byId.get(moveFor) : undefined;
  const targets = moveEntry ? moveTargets(moveEntry) : [];

  const openMove = (entry: FlatNode) => {
    if (readOnly || !onMove) return;
    if (entry.node.locked) return lockedAttempt(entry);
    const options = moveTargets(entry);
    const firstEnabled = options.findIndex((option) => !option.disabledReason);
    setMoveActive(firstEnabled < 0 ? 0 : firstEnabled);
    setMoveFor(entry.node.id);
  };

  const closeMove = () => {
    if (moveFor) pendingFocus.current = moveFor;
    setMoveFor(null);
  };

  const chooseMove = (index: number) => {
    const target = targets[index];
    if (!moveEntry || !target || target.disabledReason) return;
    const siblings = target.parentId ? (byId.get(target.parentId)?.node.children ?? []) : nodes;
    onMove?.({ id: moveEntry.node.id, newParentId: target.parentId, index: siblings.length });
    say({ type: 'move', node: moveEntry.node, parentLabel: target.label });
    closeMove();
  };

  const remove = (entry: FlatNode) => {
    if (readOnly || !onRemove) return;
    if (entry.node.locked) return lockedAttempt(entry);
    onRemove(entry.node.id);
  };

  const startRename = (entry: FlatNode) => {
    if (readOnly || !onRename) return;
    setRenamingId(entry.node.id);
    setRenameValue(entry.node.label);
  };

  const finishRename = (commit: boolean) => {
    const id = renamingId;
    if (!id) return;
    const value = renameValue.trim();
    if (commit && value && value !== byId.get(id)?.node.label) onRename?.(id, value);
    setRenamingId(null);
    pendingFocus.current = id;
  };

  const onTreeKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (renamingId) return;
    const current = tabStopId ? byId.get(tabStopId) : undefined;
    if (!current) return;
    const position = visible.findIndex((entry) => entry.node.id === current.node.id);
    const { key } = event;
    const hasChildren = Boolean(current.node.children?.length);
    if (event.altKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
      event.preventDefault();
      reorder(current, key === 'ArrowUp' ? -1 : 1);
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      const next = visible[position + 1];
      if (next) focusNode(next.node.id);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      const prev = visible[position - 1];
      if (prev) focusNode(prev.node.id);
    } else if (key === 'Home') {
      event.preventDefault();
      if (visible[0]) focusNode(visible[0].node.id);
    } else if (key === 'End') {
      event.preventDefault();
      const last = visible[visible.length - 1];
      if (last) focusNode(last.node.id);
    } else if (key === 'ArrowRight') {
      event.preventDefault();
      if (!hasChildren) return;
      if (!isExpanded(current.node.id)) toggle(current.node.id);
      else focusNode(current.node.children![0].id);
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      if (hasChildren && isExpanded(current.node.id)) toggle(current.node.id);
      else if (current.parentId) focusNode(current.parentId);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      focusNode(current.node.id);
    } else if (key === 'F2') {
      event.preventDefault();
      startRename(current);
    } else if (key === 'Delete') {
      event.preventDefault();
      remove(current);
    } else if ((key === 'm' || key === 'M') && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      openMove(current);
    } else if (key.length === 1 && /\S/.test(key) && !event.ctrlKey && !event.metaKey) {
      // Typeahead on the label's first characters (M is taken by Move).
      const now = Date.now();
      const state = typeahead.current;
      state.text = now - state.at > 500 ? key : state.text + key;
      state.at = now;
      const query = state.text.toLowerCase();
      for (let step = 1; step <= visible.length; step += 1) {
        const candidate = visible[(position + step) % visible.length];
        if (candidate.node.label.toLowerCase().startsWith(query)) {
          focusNode(candidate.node.id);
          break;
        }
      }
    }
  };

  const onListboxKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const { key } = event;
    if (key === 'ArrowDown') {
      event.preventDefault();
      setMoveActive((i) => Math.min(targets.length - 1, i + 1));
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      setMoveActive((i) => Math.max(0, i - 1));
    } else if (key === 'Home') {
      event.preventDefault();
      setMoveActive(0);
    } else if (key === 'End') {
      event.preventDefault();
      setMoveActive(targets.length - 1);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      chooseMove(moveActive);
    } else if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMove();
    }
  };

  // Toolbar state for the selected node.
  const selected = selectedId ? byId.get(selectedId) : undefined;
  const container = selected
    ? isContainer(selected.node)
      ? selected
      : selected.parentId
        ? byId.get(selected.parentId)
        : undefined
    : undefined;
  const subsectionReason =
    disabledAddReason ??
    (!container
      ? 'Select a section first.'
      : container.level >= maxDepth
        ? `Level limit reached: sections can nest ${maxDepth} levels.`
        : undefined);
  const componentReason = disabledAddReason ?? (!container ? 'Select a section first.' : undefined);
  const sectionReason = disabledAddReason;
  const selectedLockedReason = selected?.node.locked
    ? `${selected.node.label} is locked: ${selected.node.locked.reason}.`
    : undefined;
  const noSelectionReason = selected ? undefined : 'Select a node first.';
  const moveReason = selectedLockedReason ?? noSelectionReason;

  const reasonIds = {
    section: `${baseId}-reason-section`,
    subsection: `${baseId}-reason-subsection`,
    component: `${baseId}-reason-component`,
    move: `${baseId}-reason-move`,
    remove: `${baseId}-reason-remove`,
  };

  const toolbarButton = (
    text: string,
    reason: string | undefined,
    reasonId: string,
    onClick: () => void,
  ) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-disabled={reason ? 'true' : undefined}
      aria-describedby={reason ? reasonId : undefined}
      onClick={() => {
        if (!reason) onClick();
      }}
    >
      {text}
    </Button>
  );

  const renderNode = (entry: FlatNode): React.ReactNode => {
    const { node, level, index, siblingCount } = entry;
    const id = `${baseId}-node-${node.id}`;
    const hasChildren = Boolean(node.children?.length);
    const expanded = hasChildren && isExpanded(node.id);
    const kindText = node.kindLabel ?? (node.repeatable ? 'Repeats' : undefined);
    const describedBy = [
      kindText ? `${id}-kind` : null,
      node.locked ? `${id}-locked` : null,
      node.markers?.length ? `${id}-markers` : null,
    ].filter(Boolean);
    const isMoveTarget =
      moveEntry && targets[moveActive] && targets[moveActive].parentId === node.id;
    return (
      <Item
        key={node.id}
        id={id}
        role="treeitem"
        aria-level={level}
        aria-posinset={index + 1}
        aria-setsize={siblingCount}
        aria-selected={node.id === selectedId ? 'true' : 'false'}
        aria-expanded={hasChildren ? (expanded ? 'true' : 'false') : undefined}
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy.length ? describedBy.join(' ') : undefined}
        tabIndex={node.id === tabStopId ? 0 : -1}
        data-kind={node.kind}
        ref={(el) => {
          if (el) itemRefs.current.set(node.id, el);
          else itemRefs.current.delete(node.id);
        }}
        onFocus={(event) => {
          if (event.target === event.currentTarget) setFocusedId(node.id);
        }}
      >
        <Row
          data-part="row"
          $level={level}
          $marked={Boolean(node.markers?.length)}
          data-move-target={isMoveTarget ? 'true' : undefined}
          onClick={(event) => {
            event.stopPropagation();
            if (renamingId === node.id) return;
            focusNode(node.id);
            if (hasChildren && (event.target as Element).closest('[data-part="twisty"]'))
              toggle(node.id);
          }}
        >
          <Twisty data-part="twisty">{hasChildren ? <ChevronIcon open={expanded} /> : null}</Twisty>
          <RowContent>
            {renamingId === node.id ? (
              <RenameInput
                aria-label={`Rename ${node.label}`}
                value={renameValue}
                autoFocus
                onChange={(event) => setRenameValue(event.target.value)}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === 'Enter') finishRename(true);
                  else if (event.key === 'Escape') finishRename(false);
                }}
                onBlur={() => finishRename(true)}
              />
            ) : (
              <Label id={`${id}-label`}>{node.label}</Label>
            )}
            {kindText ? <Tag id={`${id}-kind`}>{kindText}</Tag> : null}
            {node.locked ? (
              <Tag id={`${id}-locked`}>
                <LockIcon />
                Locked: {node.locked.reason}
              </Tag>
            ) : null}
            {node.markers?.length ? (
              <span id={`${id}-markers`} style={{ display: 'inline-flex', gap: spacing.xs }}>
                {node.markers.map((marker) => (
                  <MarkerTag key={marker}>{MARKER_TEXT[marker]}</MarkerTag>
                ))}
              </span>
            ) : null}
          </RowContent>
        </Row>
        {expanded ? (
          <GroupList role="group">
            {node.children!.map((child) => {
              const childEntry = byId.get(child.id);
              return childEntry ? renderNode(childEntry) : null;
            })}
          </GroupList>
        ) : null}
      </Item>
    );
  };

  const keyboardHelpId = `${baseId}-help`;
  const reasons = [
    [reasonIds.section, sectionReason],
    [reasonIds.subsection, subsectionReason],
    [reasonIds.component, componentReason],
    [reasonIds.move, moveReason],
    [reasonIds.remove, moveReason],
  ] as const;
  const shownReasons = new Map<string, string>();
  const reasonIdFor = (id: string, reason: string | undefined) => {
    if (!reason) return id;
    for (const [shownId, text] of shownReasons) if (text === reason) return shownId;
    shownReasons.set(id, reason);
    return id;
  };
  const resolvedReasonIds = Object.fromEntries(
    reasons.map(([id, reason]) => [id, reasonIdFor(id, reason)]),
  );

  return (
    <Root className={className}>
      {!readOnly ? (
        <>
          <Toolbar role="group" aria-label={`Edit ${label}`}>
            {onAddChild
              ? toolbarButton(
                  'Add section',
                  sectionReason,
                  resolvedReasonIds[reasonIds.section],
                  () => onAddChild(null, 'section'),
                )
              : null}
            {onAddChild
              ? toolbarButton(
                  'Add sub-section',
                  subsectionReason,
                  resolvedReasonIds[reasonIds.subsection],
                  () => container && onAddChild(container.node.id, 'subsection'),
                )
              : null}
            {onAddChild
              ? toolbarButton(
                  'Add component',
                  componentReason,
                  resolvedReasonIds[reasonIds.component],
                  () => container && onAddChild(container.node.id, 'component'),
                )
              : null}
            {onMove
              ? toolbarButton('Move…', moveReason, resolvedReasonIds[reasonIds.move], () => {
                  if (selected) openMove(selected);
                })
              : null}
            {onRemove
              ? toolbarButton('Remove', moveReason, resolvedReasonIds[reasonIds.remove], () => {
                  if (selected) remove(selected);
                })
              : null}
          </Toolbar>
          {[...shownReasons].map(([id, text]) => (
            <Reason key={id} id={id}>
              {text}
            </Reason>
          ))}
        </>
      ) : null}

      {loading ? (
        <Skeleton aria-hidden="true" data-part="skeleton">
          <span style={{ width: '60%' }} />
          <span style={{ width: '45%', marginLeft: spacing.md }} />
          <span style={{ width: '50%', marginLeft: spacing.md }} />
          <span style={{ width: '40%' }} />
        </Skeleton>
      ) : null}
      {loading ? <VisuallyHidden role="status">Loading {label}…</VisuallyHidden> : null}

      {!loading && nodes.length === 0 ? <Empty>{emptyMessage}</Empty> : null}

      {!loading && nodes.length > 0 ? (
        <TreeList
          role="tree"
          aria-label={label}
          aria-describedby={readOnly ? undefined : keyboardHelpId}
          onKeyDown={onTreeKeyDown}
        >
          {nodes.map((node) => {
            const entry = byId.get(node.id);
            return entry ? renderNode(entry) : null;
          })}
        </TreeList>
      ) : null}

      {!readOnly && !loading && nodes.length > 0 ? (
        <Reason id={keyboardHelpId}>
          Alt+Up or Alt+Down reorders. M moves to another section. F2 renames. Delete removes.
        </Reason>
      ) : null}

      {moveEntry ? (
        <MovePanel>
          <MoveHeading id={`${baseId}-move-heading`}>Move {moveEntry.node.label} to</MoveHeading>
          <GroupList
            ref={listboxRef}
            role="listbox"
            tabIndex={0}
            aria-labelledby={`${baseId}-move-heading`}
            aria-activedescendant={`${baseId}-move-${moveActive}`}
            onKeyDown={onListboxKeyDown}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                setMoveFor(null);
            }}
          >
            {targets.map((target, i) => (
              <Option
                key={target.parentId ?? 'root'}
                id={`${baseId}-move-${i}`}
                role="option"
                aria-selected={i === moveActive ? 'true' : 'false'}
                aria-disabled={target.disabledReason ? 'true' : undefined}
                aria-labelledby={`${baseId}-move-${i}-label`}
                aria-describedby={`${baseId}-move-${i}-text`}
                data-active={i === moveActive ? 'true' : undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setMoveActive(i);
                  chooseMove(i);
                }}
              >
                <span id={`${baseId}-move-${i}-label`} data-part="option-label">
                  {target.label}
                </span>
                <OptionText id={`${baseId}-move-${i}-text`}>
                  {target.disabledReason ?? target.effectText}
                </OptionText>
              </Option>
            ))}
          </GroupList>
          <Reason>Enter moves. Esc cancels.</Reason>
        </MovePanel>
      ) : null}

      <VisuallyHidden role="status" aria-live="polite" data-part="announcer">
        {message}
      </VisuallyHidden>
    </Root>
  );
}

export default StructureTree;
