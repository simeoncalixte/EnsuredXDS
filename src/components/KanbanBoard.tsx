import React, { useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import { colors } from '../colors.js';
import { spacing, radii, typography } from '../tokens.js';
import { Badge } from './Badge.js';

export type KanbanStage = {
  key: string;
  label: string;
  accent?: string;
  /** Short lane tag shown as a neutral badge beside the heading, e.g. "Decision". */
  tag?: string;
  /** Line under the lane heading, e.g. the statuses the lane holds: "Referred, Approved, Declined". */
  subheading?: string;
  /**
   * Text shown in the lane while a card is dragged over it. Defaults to "Drop to move to {label}".
   * Use it to say what happens next, e.g. "Drop to choose a decision: Approve or Decline".
   */
  dropPreview?: string;
};

export type KanbanItem = {
  id: string;
  stageKey: string;
};

/**
 * Called before a move is applied. Return (or resolve) `false` to veto the move, e.g. after the
 * user cancels a confirmation dialog; the card then stays in its lane. Returning `true` applies
 * the move through `onMoveItem`. A rejected promise counts as a veto.
 */
export type KanbanMoveRequest = (itemId: string, toStageKey: string) => Promise<boolean> | boolean;

export type KanbanCardContext = {
  /** Runs the same request → veto → move path as a drop. Use it from the card's menu or buttons. */
  requestMove: (toStageKey: string) => Promise<boolean>;
  /** True while `onMoveRequest` for this card has not settled. */
  movePending: boolean;
};

export type KanbanBoardProps = {
  stages: KanbanStage[];
  items: KanbanItem[];
  onMoveItem: (itemId: string, stageKey: string) => void;
  /**
   * Card content. The board never wraps it in an interactive element, so cards may contain links,
   * buttons and menus. Every card should offer a button or menu path to move it (WCAG 2.5.7);
   * use `context.requestMove`.
   */
  renderCard: (item: any, context: KanbanCardContext) => React.ReactNode;
  /** Optional confirmation hook run before every move (drop or `requestMove`). */
  onMoveRequest?: KanbanMoveRequest;
  /** Allow pointer drag and drop. Defaults to true. Moving through the card's own controls always works. */
  draggable?: boolean;
  /** Accessible name of the board. Defaults to "Kanban board". */
  ariaLabel?: string;
  /** Heading level of each lane heading. Defaults to 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Text for an empty lane. Defaults to "Drop cards here" when draggable, otherwise "No items". */
  emptyLabel?: string;
};

const Board = styled.div`
  position: relative;
  display: flex;
  gap: ${spacing.md}px;
  align-items: flex-start;
  overflow-x: auto;
  padding: ${spacing.sm}px;
  font-family: ${typography.fontFamily};
`;

const Lane = styled.div<{ $over: boolean }>`
  display: flex;
  flex-direction: column;
  min-width: 240px;
  max-width: 280px;
  flex: 1 0 240px;
  background: ${colors.surfaceContainerLow};
  border: 1px solid ${({ $over }) => ($over ? colors.primary : colors.outlineVariant)};
  border-radius: ${radii.lg}px;
  overflow: hidden;
  transition:
    border-color 120ms ease,
    background 120ms ease;
  ${({ $over }) => ($over ? `background: ${colors.surfaceContainerHigh};` : '')}
`;

const AccentBar = styled.div<{ $accent: string }>`
  height: 4px;
  width: 100%;
  background: ${({ $accent }) => $accent};
`;

const LaneHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: ${spacing.sm}px ${spacing.md}px;
  border-bottom: 1px solid ${colors.outlineVariant};
`;

const LaneHeadingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${spacing.sm}px;
`;

const LaneHeading = styled.h3`
  display: flex;
  align-items: center;
  gap: ${spacing.sm}px;
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: ${typography.sizes.sm}px;
  font-weight: ${typography.weights.semibold};
  color: ${colors.text.primary};
`;

const LaneCount = styled.span`
  margin-left: auto;
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.medium};
  color: ${colors.text.secondary};
  background: ${colors.surfaceContainerHighest};
  border-radius: ${radii.round}px;
  padding: 2px ${spacing.sm}px;
  min-width: 20px;
  text-align: center;
`;

const LaneSubheading = styled.p`
  margin: 0;
  font-size: ${typography.sizes.xs}px;
  color: ${colors.text.secondary};
`;

const LaneBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm}px;
  padding: ${spacing.sm}px;
  min-height: 64px;
  flex: 1;
`;

const CardList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm}px;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const CardSlot = styled.li<{ $dragging: boolean; $draggable: boolean; $pending: boolean }>`
  cursor: ${({ $draggable }) => ($draggable ? 'grab' : 'auto')};
  border-radius: ${radii.md}px;
  /* Drag source and pending moves are marked with an outline, not dimmed, so text keeps its contrast. */
  outline: ${({ $dragging, $pending }) =>
    $dragging
      ? `2px dashed ${colors.primary}`
      : $pending
        ? `2px dashed ${colors.outline}`
        : 'none'};
  outline-offset: 2px;
  &:active {
    cursor: ${({ $draggable }) => ($draggable ? 'grabbing' : 'auto')};
  }
`;

const DropPreview = styled.p`
  margin: 0;
  padding: ${spacing.sm}px;
  border: 1px dashed ${colors.primary};
  border-radius: ${radii.md}px;
  font-size: ${typography.sizes.xs}px;
  font-weight: ${typography.weights.medium};
  color: ${colors.text.primary};
  text-align: center;
`;

const EmptyHint = styled.p`
  margin: 0;
  font-size: ${typography.sizes.xs}px;
  color: ${colors.text.secondary};
  text-align: center;
  padding: ${spacing.md}px ${spacing.sm}px;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stages,
  items,
  onMoveItem,
  renderCard,
  onMoveRequest,
  draggable = true,
  ariaLabel = 'Kanban board',
  headingLevel = 3,
  emptyLabel,
}) => {
  const baseId = useId();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overLaneKey, setOverLaneKey] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const setPending = (itemId: string, pending: boolean) => {
    if (!mounted.current) return;
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  const requestMove = async (itemId: string, toStageKey: string): Promise<boolean> => {
    const item = items.find((it) => it.id === itemId);
    if (!item || item.stageKey === toStageKey) return false;
    if (pendingIds.has(itemId)) return false;
    if (!stages.some((stage) => stage.key === toStageKey)) return false;
    if (!onMoveRequest) {
      // No hook: apply synchronously, as before onMoveRequest existed.
      onMoveItem(itemId, toStageKey);
      return true;
    }
    let allowed: boolean;
    setPending(itemId, true);
    try {
      allowed = (await onMoveRequest(itemId, toStageKey)) === true;
    } catch {
      allowed = false;
    } finally {
      setPending(itemId, false);
    }
    if (allowed) onMoveItem(itemId, toStageKey);
    return allowed;
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, itemId: string) => {
    setDraggingId(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverLaneKey(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stageKey: string) => {
    if (!draggable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overLaneKey !== stageKey) setOverLaneKey(stageKey);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, stageKey: string) => {
    // Only clear if we are actually leaving the lane (not entering a child)
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (overLaneKey === stageKey) setOverLaneKey(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, stageKey: string) => {
    if (!draggable) return;
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId(null);
    setOverLaneKey(null);
    if (itemId) void requestMove(itemId, stageKey);
  };

  const headingTag = `h${headingLevel}` as 'h3';
  const draggingItem = draggingId ? items.find((it) => it.id === draggingId) : undefined;
  const emptyText = emptyLabel ?? (draggable ? 'Drop cards here' : 'No items');

  return (
    <Board role="list" aria-label={ariaLabel}>
      {stages.map((stage, index) => {
        const laneItems = items.filter((it) => it.stageKey === stage.key);
        const accent = stage.accent ?? colors.primary;
        const isOver = overLaneKey === stage.key;
        const showPreview = isOver && !!draggingItem && draggingItem.stageKey !== stage.key;
        const headingId = `${baseId}-lane-${index}`;
        const count = laneItems.length;
        return (
          <Lane
            key={stage.key}
            role="listitem"
            data-stage-key={stage.key}
            aria-labelledby={headingId}
            $over={isOver}
            onDragOver={(e) => handleDragOver(e, stage.key)}
            onDragLeave={(e) => handleDragLeave(e, stage.key)}
            onDrop={(e) => handleDrop(e, stage.key)}
          >
            <AccentBar $accent={accent} aria-hidden="true" />
            <LaneHeader>
              <LaneHeadingRow>
                <LaneHeading as={headingTag} id={headingId}>
                  <span>{stage.label}</span>
                  {stage.tag ? (
                    <>
                      {' '}
                      <Badge variant="neutral">{stage.tag}</Badge>
                    </>
                  ) : null}
                  <LaneCount aria-hidden="true">{count}</LaneCount>
                  <VisuallyHidden>{` (${count} ${count === 1 ? 'item' : 'items'})`}</VisuallyHidden>
                </LaneHeading>
              </LaneHeadingRow>
              {stage.subheading ? <LaneSubheading>{stage.subheading}</LaneSubheading> : null}
            </LaneHeader>
            <LaneBody>
              {showPreview ? (
                <DropPreview data-drop-preview="">
                  {stage.dropPreview ?? `Drop to move to ${stage.label}`}
                </DropPreview>
              ) : null}
              {count === 0 ? (
                showPreview ? null : (
                  <EmptyHint>{emptyText}</EmptyHint>
                )
              ) : (
                <CardList>
                  {laneItems.map((item) => {
                    const pending = pendingIds.has(item.id);
                    return (
                      <CardSlot
                        key={item.id}
                        draggable={draggable && !pending}
                        data-item-id={item.id}
                        aria-busy={pending || undefined}
                        $draggable={draggable}
                        $dragging={draggingId === item.id}
                        $pending={pending}
                        onDragStart={draggable ? (e) => handleDragStart(e, item.id) : undefined}
                        onDragEnd={draggable ? handleDragEnd : undefined}
                      >
                        {renderCard(item, {
                          requestMove: (toStageKey: string) => requestMove(item.id, toStageKey),
                          movePending: pending,
                        })}
                      </CardSlot>
                    );
                  })}
                </CardList>
              )}
            </LaneBody>
          </Lane>
        );
      })}
    </Board>
  );
};

export default KanbanBoard;
