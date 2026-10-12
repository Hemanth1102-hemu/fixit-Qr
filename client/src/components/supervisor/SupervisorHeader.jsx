import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export function SupervisorHeader({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  onRefresh, 
  refreshing = false,
  actions 
}) {
  const location = useLocation();

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-xs mb-6">
      {/* Top Breadcrumbs & Institutional Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
        <div className="flex items-center gap-1.5 text-stone-500 font-medium">
          <Link to="/supervisor/dashboard" className="flex items-center gap-1.5 hover:text-stone-900 transition">
            <span className="w-5 h-5 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
              SRM
            </span>
            <span>Estate Operations</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
          <span className="text-stone-600 font-semibold">Supervisor Suite</span>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
              {b.to ? (
                <Link to={b.to} className="hover:text-stone-900 transition">{b.label}</Link>
              ) : (
                <span className="text-stone-900 font-semibold">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Campus Grid Active
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh database records"
              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition border border-stone-200/60 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
