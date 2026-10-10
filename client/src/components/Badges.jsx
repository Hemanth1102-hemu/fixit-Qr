import React from 'react';

export function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    in_progress: 'bg-sky-50 text-sky-800 border-sky-200',
    resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    reopened: 'bg-rose-50 text-rose-800 border-rose-200'
  };

  const labels = {
    pending: 'Pending Review',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    reopened: 'Reopened'
  };

  const styleClass = styles[status] || 'bg-stone-50 text-stone-700 border-stone-200';
  const label = labels[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styleClass}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    urgent: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
    high: 'bg-orange-50 text-orange-800 border-orange-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
    low: 'bg-stone-50 text-stone-700 border-stone-200'
  };

  const styleClass = styles[priority] || 'bg-stone-50 text-stone-700 border-stone-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${styleClass}`}>
      {priority}
    </span>
  );
}
