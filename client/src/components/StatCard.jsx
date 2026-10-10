import React from 'react';

export function StatCard({ title, value, icon: Icon, description, trend, alert }) {
  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all hover:border-stone-300 ${alert ? 'border-rose-200 bg-rose-50/20' : 'border-stone-200'}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-500">{title}</p>
        {Icon && (
          <div className={`p-2 rounded-lg ${alert ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-700'}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-stone-900">{value}</span>
        {trend && (
          <span className="text-xs font-medium text-emerald-700">{trend}</span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs text-stone-500">{description}</p>
      )}
    </div>
  );
}
