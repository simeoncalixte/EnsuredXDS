import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import Button from './Button.js';
import Input from './Input.js';
import { colors } from '../colors.js';

export type ScrollableNavigationItem = { id: string; label: string };
export type ScrollableNavigationProps = {
  items: ScrollableNavigationItem[];
  activeId?: string;
  label?: string;
  searchActions?: React.ReactNode;
};

const Root = styled.div`
  width: 100%;
  min-width: 0;
  button {
    min-height: 44px;
  }
  a:focus-visible,
  button:focus-visible,
  input:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: -2px;
  }
`;
const SearchRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
  label {
    min-width: 0;
    width: min(100%, 20rem);
    font-size: 0.75rem;
    color: ${colors.onSurfaceVariant};
  }
  input {
    box-sizing: border-box;
    min-height: 44px;
    font-size: 1rem;
  }
  @media (max-width: 520px) {
    label {
      width: 100%;
    }
  }
`;
const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  > button {
    flex-shrink: 0;
  }
`;
const Links = styled.nav`
  display: flex;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  gap: 0.25rem;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  &::-webkit-scrollbar {
    display: none;
  }
  a {
    flex: 0 0 auto;
    padding: 0.8rem 1rem;
    min-height: 44px;
    box-sizing: border-box;
    border-bottom: 3px solid transparent;
    color: ${colors.onSurfaceVariant};
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }
  a:hover {
    color: ${colors.onSurfaceStrong};
    background: ${colors.surfaceContainer};
  }
  a[aria-current='page'] {
    color: ${colors.primarySoft};
    border-bottom-color: ${colors.primary};
  }
`;
const Preview = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  min-width: 0;
  padding: 0.15rem 0;
  font-size: 0.75rem;
  a {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 48%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-sizing: border-box;
    color: ${colors.onSurfaceVariant};
    padding: 0.5rem;
    text-decoration: none;
  }
`;

/** Search and overflow affordances for a host's role-scoped application links. */
export function ScrollableNavigation({
  items,
  activeId,
  label = 'Applications',
  searchActions,
}: ScrollableNavigationProps) {
  const id = useId();
  const rail = useRef<HTMLElement>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [hidden, setHidden] = useState<{ id: string; side: 'left' | 'right' }[]>([]);
  const [edges, setEdges] = useState({ left: false, right: false });
  const filtered = items.filter((item) =>
    item.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
    clearTimeout(previewTimer.current);
    // Wait for scrolling/resizing to settle; ignore links that are still partly visible.
    previewTimer.current = setTimeout(() => {
      const bounds = el.getBoundingClientRect();
      const outside = Array.from(
        el.querySelectorAll<HTMLAnchorElement>('a[data-navigation-id]'),
      ).flatMap((link) => {
        const rect = link.getBoundingClientRect();
        const side =
          rect.right <= bounds.left - 8
            ? ('left' as const)
            : rect.left >= bounds.right + 8
              ? ('right' as const)
              : null;
        return side ? [{ id: link.dataset.navigationId!, side }] : [];
      });
      // At most the nearest destination in either direction; no changing counts.
      const previous = outside.filter((item) => item.side === 'left').slice(-1);
      const next = outside.filter((item) => item.side === 'right').slice(0, 1);
      const shortcuts = [...previous, ...next];
      setHidden((current) =>
        JSON.stringify(current) === JSON.stringify(shortcuts) ? current : shortcuts,
      );
    }, 200);
  }, []);
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    measure();
    return () => {
      observer.disconnect();
      clearTimeout(previewTimer.current);
    };
  }, [items, query, measure]);
  useEffect(() => {
    setQuery('');
  }, [activeId]);
  useEffect(() => {
    const el = rail.current;
    if (!el || query) return;
    const active = Array.from(el.querySelectorAll<HTMLAnchorElement>('a')).find(
      (link) => link.dataset.navigationId === activeId,
    );
    if (active) {
      const bounds = el.getBoundingClientRect(),
        rect = active.getBoundingClientRect();
      if (rect.left < bounds.left || rect.right > bounds.right)
        el.scrollLeft += rect.left - bounds.left - (el.clientWidth - rect.width) / 2;
    }
    measure();
  }, [activeId, query, items, measure]);
  const scroll = (direction: number) => {
    const el = rail.current;
    el?.scrollBy({
      left: direction * el.clientWidth * 0.75,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };
  const overflow = edges.left || edges.right;
  const shortcuts = hidden;
  return (
    <Root>
      <SearchRow>
        <label htmlFor={`${id}-search`}>
          Search applications
          <Input
            id={`${id}-search`}
            type="search"
            placeholder="Find an application…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (rail.current) rail.current.scrollLeft = 0;
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('');
            }}
          />
        </label>
        {searchActions}
      </SearchRow>
      <Row>
        {overflow && (
          <Button
            type="button"
            variant="ghost"
            aria-label="Scroll applications left"
            aria-controls={id}
            disabled={!edges.left}
            onClick={() => scroll(-1)}
          >
            ←
          </Button>
        )}
        <Links id={id} aria-label={label} ref={rail} onScroll={measure}>
          {filtered.map((item) => (
            <Link
              key={item.id}
              to={item.id}
              data-navigation-id={item.id}
              aria-current={activeId === item.id ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </Links>
        {overflow && (
          <Button
            type="button"
            variant="ghost"
            aria-label="Scroll applications right"
            aria-controls={id}
            disabled={!edges.right}
            onClick={() => scroll(1)}
          >
            →
          </Button>
        )}
      </Row>
      {filtered.length === 0 && <p role="status">No applications match “{query}”.</p>}
      {shortcuts.length > 0 && (
        <Preview aria-label="Applications outside the visible area">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.id}
              to={shortcut.id}
              title={items.find((item) => item.id === shortcut.id)?.label}
            >
              <span aria-hidden="true">{shortcut.side === 'left' ? '← ' : '→ '}</span>
              {items.find((item) => item.id === shortcut.id)?.label}
            </Link>
          ))}
        </Preview>
      )}
    </Root>
  );
}
export default ScrollableNavigation;
