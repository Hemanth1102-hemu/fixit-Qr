import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function UnauthorizedAccess() {
  const navigate = useNavigate();
  const { defaultDestination, role } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl border border-stone-200 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-stone-900">Access Restricted</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Your authenticated role (<strong className="capitalize">{role?.replace('_', ' ')}</strong>) does not have authorization to access this portal or resource.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate(defaultDestination || '/')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition w-full"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to My Authorized Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
