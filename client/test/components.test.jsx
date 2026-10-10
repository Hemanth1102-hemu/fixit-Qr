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

  describe('Role-to-Dashboard Mapping Verification', () => {
    it('should map student to /student/dashboard', async () => {
      const { getDashboardForRole } = await import('../src/constants/routes');
      expect(getDashboardForRole('student')).toBe('/student/dashboard');
    });

    it('should map faculty to /faculty/dashboard', async () => {
      const { getDashboardForRole } = await import('../src/constants/routes');
      expect(getDashboardForRole('faculty')).toBe('/faculty/dashboard');
    });

    it('should map technician to /maintenance/dashboard', async () => {
      const { getDashboardForRole } = await import('../src/constants/routes');
      expect(getDashboardForRole('technician')).toBe('/maintenance/dashboard');
    });

    it('should map maintenance_admin to /maintenance-admin/dashboard', async () => {
      const { getDashboardForRole } = await import('../src/constants/routes');
      expect(getDashboardForRole('maintenance_admin')).toBe('/maintenance-admin/dashboard');
    });

    it('should map supervisor to /supervisor/dashboard', async () => {
      const { getDashboardForRole } = await import('../src/constants/routes');
      expect(getDashboardForRole('supervisor')).toBe('/supervisor/dashboard');
    });
  });
});
