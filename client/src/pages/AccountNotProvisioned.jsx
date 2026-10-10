import React from 'react';
import { ShieldAlert, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AccountNotProvisioned() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl border border-stone-200 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-stone-900">Account Access Not Provisioned</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Your account ({user?.email}) is successfully authenticated, but application access has not been configured in the campus directory.
          </p>
          <p className="text-[11px] text-stone-400">
            Please contact the campus maintenance administrator or estate office to assign your institutional role.
          </p>
        </div>

        <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/80 text-left text-xs text-stone-600 flex items-center gap-2">
          <Mail className="w-4 h-4 text-stone-400 shrink-0" />
          <span>Support Contact: <strong>estate.helpdesk@srmist.edu.in</strong></span>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
