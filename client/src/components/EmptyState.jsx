import React from 'react';

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  secondaryActionLabel,
  onSecondaryAction 
}) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 sm:p-12 text-center max-w-xl mx-auto my-6 shadow-sm">
      {Icon && (
        <div className="mx-auto w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mb-4 ring-8 ring-stone-50">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-amber-600 hover:bg-amber-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center px-4 py-2 border border-stone-300 shadow-sm text-sm font-medium rounded-lg text-stone-700 bg-white hover:bg-stone-50 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
