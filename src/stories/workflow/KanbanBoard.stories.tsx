import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, userEvent, waitFor } from '@storybook/test';
import styled from 'styled-components';
import {
  KanbanBoard,
  KanbanCardContext,
  KanbanItem,
  KanbanStage,
} from '../../components/KanbanBoard.js';
import { Button } from '../../components/Button.js';
import { colors } from '../../colors.js';
import { spacing, radii, typography } from '../../tokens.js';

const meta: Meta<typeof KanbanBoard> = {
  id: 'xds-kanbanboard',
  title: 'Workflow/KanbanBoard',
  component: KanbanBoard,
};

export default meta;

type Story = StoryObj<typeof KanbanBoard>;

const DemoCard = styled.div`
  background: ${colors.surfaceContainerHigh};
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.md}px;
  padding: ${spacing.sm}px ${spacing.md}px;
  color: ${colors.text.primary};
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
`;

const CardTitle = styled.div`
  font-weight: ${typography.weights.semibold};
`;

const CardMeta = styled.div`
  font-size: ${typography.sizes.xs}px;
  color: ${colors.text.secondary};
  margin-top: 2px;
`;

type Deal = KanbanItem & { title: string; premium: string };

const STAGES: KanbanStage[] = [
  { key: 'intake', label: 'Intake', accent: colors.info },
  { key: 'review', label: 'Underwriting Review', accent: colors.warning },
  { key: 'quoted', label: 'Quoted', accent: colors.primary },
  { key: 'bound', label: 'Bound', accent: colors.success },
];

const INITIAL: Deal[] = [
  { id: 'd1', stageKey: 'intake', title: 'Acme Property', premium: '$42k' },
  { id: 'd2', stageKey: 'intake', title: 'Globex Marine', premium: '$118k' },
  { id: 'd3', stageKey: 'review', title: 'Initech Cyber', premium: '$76k' },
  { id: 'd4', stageKey: 'quoted', title: 'Umbrella Casualty', premium: '$210k' },
  { id: 'd5', stageKey: 'bound', title: 'Wayne Aviation', premium: '$540k' },
];

const renderCard = (item: Deal) => (
  <DemoCard>
    <CardTitle>{item.title}</CardTitle>
    <CardMeta>Premium {item.premium}</CardMeta>
  </DemoCard>
);

const Stateful: React.FC<{ stages?: KanbanStage[]; initial?: Deal[] }> = ({
  stages = STAGES,
  initial = INITIAL,
}) => {
  const [items, setItems] = useState<Deal[]>(initial);
  const handleMove = (itemId: string, stageKey: string) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, stageKey } : it)));
  };
  return (
    <KanbanBoard stages={stages} items={items} onMoveItem={handleMove} renderCard={renderCard} />
  );
};

export const Default: Story = {
  render: () => <Stateful />,
};

export const WithEmptyLane: Story = {
  render: () => (
    <Stateful
      initial={[
        { id: 'd1', stageKey: 'intake', title: 'Acme Property', premium: '$42k' },
        { id: 'd2', stageKey: 'intake', title: 'Globex Marine', premium: '$118k' },
      ]}
    />
  ),
};

export const InteractionRendersLanesAndCards: Story = {
  render: () => <Stateful />,
  play: async ({ canvasElement }) => {
    // Hidden lane-count text must stay inside the board's scroll container (AIN-353).
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    const canvas = within(canvasElement);

    // Every stage label is present
    for (const stage of STAGES) {
      await expect(canvas.getByText(stage.label)).toBeInTheDocument();
    }

    // Every card title is present
    for (const deal of INITIAL) {
      await expect(canvas.getByText(deal.title)).toBeInTheDocument();
    }

    // A card sits in the correct lane (Acme Property -> Intake lane)
    const intakeLane = canvasElement.querySelector('[data-stage-key="intake"]') as HTMLElement;
    await expect(intakeLane).toBeTruthy();
    const intake = within(intakeLane);
    await expect(intake.getByText('Acme Property')).toBeInTheDocument();
    await expect(intake.getByText('Globex Marine')).toBeInTheDocument();

    // Quoted lane holds Umbrella Casualty
    const quotedLane = canvasElement.querySelector('[data-stage-key="quoted"]') as HTMLElement;
    await expect(within(quotedLane).getByText('Umbrella Casualty')).toBeInTheDocument();

    // Simulate an HTML5 drag of a card from Intake onto the Review lane.
    const card = canvasElement.querySelector('[data-item-id="d1"]') as HTMLElement;
    const reviewLane = canvasElement.querySelector('[data-stage-key="review"]') as HTMLElement;
    await expect(card).toBeTruthy();
    await expect(reviewLane).toBeTruthy();

    const dataTransfer = {
      data: {} as Record<string, string>,
      effectAllowed: 'move',
      dropEffect: 'move',
      setData(type: string, val: string) {
        this.data[type] = val;
      },
      getData(type: string) {
        return this.data[type] || '';
      },
    };

    const fire = (el: HTMLElement, type: string) => {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'dataTransfer', { value: dataTransfer });
      el.dispatchEvent(ev);
    };

    fire(card, 'dragstart');
    fire(reviewLane, 'dragover');
    fire(reviewLane, 'drop');

    // After the move, the card should now live in the Review lane.
    // React re-renders after the drop event; wait for it (this assertion was flaky on main).
    await waitFor(() => expect(within(reviewLane).getByText('Acme Property')).toBeInTheDocument());
  },
};

// --- AIN-315: lane tags, sub-headings, drop preview, move requests and card controls ---

type Submission = KanbanItem & { ref: string; insured: string };

const UW_STAGES: KanbanStage[] = [
  { key: 'new', label: 'New', subheading: 'Draft, Submitted', accent: colors.info },
  { key: 'triage', label: 'Triage', subheading: 'In triage', accent: colors.warning },
  {
    key: 'decision',
    label: 'Decision',
    tag: 'Decision',
    subheading: 'Referred, Approved, Declined',
    dropPreview: 'Drop to choose a decision: Approve or Decline (asks to confirm)',
    accent: colors.primary,
  },
];

const UW_ITEMS: Submission[] = [
  { id: 'SUB-8401', stageKey: 'new', ref: 'SUB-8401', insured: 'Harborview Logistics LLC' },
  { id: 'SUB-8402', stageKey: 'new', ref: 'SUB-8402', insured: 'Northwind Cold Storage' },
  { id: 'SUB-8405', stageKey: 'triage', ref: 'SUB-8405', insured: 'Bayside Marine Repair' },
];

const NEXT_STAGE: Record<string, string | undefined> = { new: 'triage', triage: 'decision' };

const CardLink = styled.a`
  color: ${colors.primary};
  font-weight: ${typography.weights.semibold};
`;

const CardActions = styled.div`
  margin-top: ${spacing.sm}px;
`;

const SubmissionCard: React.FC<{ item: Submission; context: KanbanCardContext }> = ({
  item,
  context,
}) => {
  const next = NEXT_STAGE[item.stageKey];
  const nextLabel = UW_STAGES.find((stage) => stage.key === next)?.label;
  return (
    <DemoCard>
      <CardLink href={`#/submissions/${item.ref}`}>{item.ref}</CardLink>
      <CardMeta>{item.insured}</CardMeta>
      {next && nextLabel ? (
        <CardActions>
          <Button
            size="sm"
            variant="outline"
            disabled={context.movePending}
            aria-label={`Move ${item.ref} to ${nextLabel}`}
            onClick={() => void context.requestMove(next)}
          >
            {`Move to ${nextLabel}`}
          </Button>
        </CardActions>
      ) : null}
    </DemoCard>
  );
};

const ConfirmBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm}px;
  margin: ${spacing.sm}px;
  padding: ${spacing.sm}px ${spacing.md}px;
  border: 1px solid ${colors.outlineVariant};
  border-radius: ${radii.md}px;
  color: ${colors.text.primary};
  font-family: ${typography.fontFamily};
  font-size: ${typography.sizes.sm}px;
`;

type UnderwritingBoardProps = {
  initial?: Submission[];
  confirmDecision?: boolean;
  neverSettle?: boolean;
  draggable?: boolean;
};

/** Story harness: the app owns the items and any confirmation UI. */
const UnderwritingBoard: React.FC<UnderwritingBoardProps> = ({
  initial = UW_ITEMS,
  confirmDecision = false,
  neverSettle = false,
  draggable = true,
}) => {
  const [items, setItems] = useState<Submission[]>(initial);
  const [pendingConfirm, setPendingConfirm] = useState<{
    itemId: string;
    resolve: (ok: boolean) => void;
  } | null>(null);
  const [lastMove, setLastMove] = useState('');

  const onMoveRequest = (itemId: string, toStageKey: string) => {
    if (neverSettle) return new Promise<boolean>(() => {});
    if (!confirmDecision || toStageKey !== 'decision') return true;
    return new Promise<boolean>((resolve) => setPendingConfirm({ itemId, resolve }));
  };

  const settle = (ok: boolean) => {
    pendingConfirm?.resolve(ok);
    setLastMove(ok ? `${pendingConfirm?.itemId} moved to Decision.` : 'Move cancelled.');
    setPendingConfirm(null);
  };

  return (
    <div>
      {pendingConfirm ? (
        <ConfirmBar role="group" aria-label="Confirm move">
          <span>{`Move ${pendingConfirm.itemId} to Decision?`}</span>
          <Button size="sm" onClick={() => settle(true)}>
            Move
          </Button>
          <Button size="sm" variant="outline" onClick={() => settle(false)}>
            Cancel
          </Button>
        </ConfirmBar>
      ) : null}
      <KanbanBoard
        ariaLabel="Underwriting board"
        stages={UW_STAGES}
        items={items}
        draggable={draggable}
        onMoveRequest={onMoveRequest}
        onMoveItem={(itemId, stageKey) =>
          setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, stageKey } : it)))
        }
        renderCard={(item: Submission, context) => <SubmissionCard item={item} context={context} />}
      />
      <p role="status" style={{ fontFamily: typography.fontFamily, color: colors.text.secondary }}>
        {lastMove}
      </p>
    </div>
  );
};

const laneOf = (canvasElement: HTMLElement, key: string) =>
  canvasElement.querySelector(`[data-stage-key="${key}"]`) as HTMLElement;

/** Lane tag ("Decision"), sub-headings listing each lane's statuses, and an h3 heading with the count. */
export const LaneTagsAndSubheadings: Story = {
  render: () => <UnderwritingBoard />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('list', { name: 'Underwriting board' })).toBeInTheDocument();
    await expect(
      canvas.getByRole('heading', { level: 3, name: /^New \(2 items\)$/ }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: /^Decision Decision \(0 items\)$/ }),
    ).toBeVisible();
    await expect(canvas.getByText('Referred, Approved, Declined')).toBeVisible();
    await expect(canvas.getByRole('listitem', { name: /^Triage \(1 item\)$/ })).toBeInTheDocument();
  },
};

/**
 * Cards hold a link and a button. The board adds no interactive wrapper (no nested-interactive),
 * and the button is the keyboard and single-pointer path to move (WCAG 2.5.7).
 */
export const KeyboardMoveWithCardButton: Story = {
  render: () => <UnderwritingBoard />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: 'SUB-8401' });
    link.focus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Move SUB-8401 to Triage' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(within(laneOf(canvasElement, 'triage')).getByText('SUB-8401')).toBeInTheDocument(),
    );
    await expect(canvas.getByRole('heading', { name: /^Triage \(2 items\)$/ })).toBeVisible();
  },
};

/** `onMoveRequest` asks to confirm moves into Decision. Cancel vetoes it and the card stays. */
export const ConfirmBeforeDecisionMove: Story = {
  render: () => <UnderwritingBoard confirmDecision />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Move SUB-8405 to Decision' }));
    const confirm = await canvas.findByRole('group', { name: 'Confirm move' });
    await expect(canvas.getByRole('button', { name: 'Move SUB-8405 to Decision' })).toBeDisabled();
    await userEvent.click(within(confirm).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Move cancelled.'));
    await expect(within(laneOf(canvasElement, 'triage')).getByText('SUB-8405')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Move SUB-8405 to Decision' }));
    await userEvent.click(
      within(await canvas.findByRole('group', { name: 'Confirm move' })).getByRole('button', {
        name: 'Move',
      }),
    );
    await waitFor(() =>
      expect(within(laneOf(canvasElement, 'decision')).getByText('SUB-8405')).toBeInTheDocument(),
    );
  },
};

/** While `onMoveRequest` is unsettled the card is `aria-busy` and its move button is disabled. */
export const MovePending: Story = {
  render: () => <UnderwritingBoard neverSettle />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Move SUB-8402 to Triage' }));
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-item-id="SUB-8402"]')).toHaveAttribute(
        'aria-busy',
        'true',
      ),
    );
    await expect(canvas.getByRole('button', { name: 'Move SUB-8402 to Triage' })).toBeDisabled();
  },
};

/** Dragging over a lane shows the caller's drop-preview text, not colour alone. */
export const DropPreview: Story = {
  render: () => <UnderwritingBoard />,
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('[data-item-id="SUB-8405"]') as HTMLElement;
    const lane = laneOf(canvasElement, 'decision');
    const data: Record<string, string> = {};
    const dataTransfer = {
      effectAllowed: 'move',
      dropEffect: 'move',
      setData: (type: string, val: string) => {
        data[type] = val;
      },
      getData: (type: string) => data[type] || '',
    };
    const fire = (el: HTMLElement, type: string) => {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'dataTransfer', { value: dataTransfer });
      el.dispatchEvent(ev);
    };
    fire(card, 'dragstart');
    fire(lane, 'dragover');
    await waitFor(() =>
      expect(
        within(lane).getByText('Drop to choose a decision: Approve or Decline (asks to confirm)'),
      ).toBeVisible(),
    );
  },
};

/** Drag turned off: the card buttons are the only move path, and empty lanes say "No items". */
export const DragDisabled: Story = {
  render: () => <UnderwritingBoard draggable={false} />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[draggable="true"]')).toBeNull();
    await expect(within(laneOf(canvasElement, 'decision')).getByText('No items')).toBeVisible();
  },
};
