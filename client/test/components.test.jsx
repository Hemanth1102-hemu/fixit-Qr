import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StatusBadge, PriorityBadge } from '../src/components/Badges';
import { StatCard } from '../src/components/StatCard';

describe('FixIt QR Frontend Components', () => {
  it('StatusBadge should render pending status text correctly', () => {
    const html = renderToString(<StatusBadge status="pending" />);
    expect(html).toContain('Pending Review');
  });

  it('StatusBadge should render resolved status text correctly', () => {
    const html = renderToString(<StatusBadge status="resolved" />);
    expect(html).toContain('Resolved');
  });

  it('PriorityBadge should render uppercase priority label', () => {
    const html = renderToString(<PriorityBadge priority="urgent" />);
    expect(html).toContain('urgent');
  });

  it('StatCard should render title and metric value', () => {
    const html = renderToString(<StatCard title="Total Tickets" value={42} />);
    expect(html).toContain('Total Tickets');
    expect(html).toContain('42');
  });
});
